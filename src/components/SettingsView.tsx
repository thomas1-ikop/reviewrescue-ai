/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Shield, RefreshCw, Smartphone, Key, CircleDot, AlertTriangle, ExternalLink } from 'lucide-react';
import { Profile } from '../types';
import { supabaseClient } from '../lib/supabaseClient';

interface SettingsViewProps {
  profile: Profile;
  onUpdateProfile: (data: { business_name: string; industry: string; tone: string; contact_email: string }) => Promise<void>;
  onUpgradePlan: (plan: 'pro') => Promise<void>;
  statusLogs: {
    supabase: string;
    gemini: string;
    stripe: string;
    twilio: string;
    database_fallback: string;
  };
  isLoadingStatus: boolean;
  triggerToast: (message: string, type?: 'success' | 'warn' | 'info') => void; // ✅ NEW
}

export default function SettingsView({
  profile,
  onUpdateProfile,
  onUpgradePlan,
  statusLogs,
  isLoadingStatus,
  triggerToast // ✅ NEW
}: SettingsViewProps) {
  const [bizName, setBizName] = useState(profile.business_name || '');
  const [industry, setIndustry] = useState(profile.industry || 'Restaurant');
  const [tone, setTone] = useState(profile.tone || 'Friendly');
  const [contactEmail, setContactEmail] = useState(profile.contact_email || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSaved, setUpdateSaved] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isTriggeringCheckout, setIsTriggeringCheckout] = useState(false);

  // --- Password change state ---
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const getDaysLeft = () => {
    if (!profile.subscription_expires_at) return null;
    const now = new Date();
    const expiry = new Date(profile.subscription_expires_at);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 0;
    return diff;
  };

  const daysLeft = getDaysLeft();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSaved(false);
    try {
      await onUpdateProfile({ business_name: bizName, industry, tone, contact_email: contactEmail });
      setUpdateSaved(true);
      setTimeout(() => setUpdateSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const [showCancelFeedbackModal, setShowCancelFeedbackModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);

  const handleProceedToStripePortal = async () => {
    setIsOpeningPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           'x-user-id': profile.id
         },
         body: JSON.stringify({ userId: profile.id })
       });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        triggerToast(data.error || 'Unable to redirect to Stripe customer portal.', 'warn');
      }
    } catch (portalErr) {
      console.error('Error invoking Stripe portal redirection:', portalErr);
      triggerToast('Something went wrong. Please try again.', 'warn');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleCancelOrManageSubscription = () => {
    setShowCancelFeedbackModal(true);
  };

  const handleUpgradeClick = async () => {
    if (profile.subscription_status === 'active') {
      await handleProceedToStripePortal();
    } else {
      setIsTriggeringCheckout(true);
      try {
        await onUpgradePlan('pro');
      } finally {
        setIsTriggeringCheckout(false);
      }
    }
  };

  // --- Direct password change handler with toast notifications ---
  const handleChangePasswordDirect = async () => {
    if (newPassword !== confirmPassword) {
      triggerToast('Passwords do not match.', 'warn');
      return;
    }
    if (newPassword.length < 6) {
      triggerToast('Password must be at least 6 characters.', 'warn');
      return;
    }
    setIsChangingPassword(true);
    try {
      // Verify current password by signing in again
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: profile.email,
        password: oldPassword,
      });
      if (signInError) {
        triggerToast('Current password is incorrect.', 'warn');
        setIsChangingPassword(false);
        return;
      }
      // Update password
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        triggerToast('Failed to update password: ' + updateError.message, 'warn');
      } else {
        triggerToast('✅ Password changed successfully!', 'success');
        setShowChangePassword(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Something went wrong. Please try again.', 'warn');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 items-start">
      
      {/* Left col: Profile & Tone voice configuration */}
      <div className="lg:col-span-3 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Settings className="text-slate-700 h-5 w-5" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Business Voice Parameters</h3>
              <p className="text-xs text-slate-400 font-sans">Update business settings used during generative AI calculations.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Market Sector
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs bg-white text-slate-800 focus:outline-none"
                >
                  <option value="Restaurant">Restaurant & Cafe</option>
                  <option value="Retail">Retail & Boutiques</option>
                  <option value="Salon">Salon & Wellness Spa</option>
                  <option value="Hotel">Hotel & Hospitality</option>
                  <option value="Medical">Medical & Private Care</option>
                  <option value="Real Estate">Real Estate Agencies</option>
                  <option value="Other">Other Services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Brand AI Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs bg-white text-slate-800 focus:outline-none"
                >
                  <option value="Friendly">Friendly & Casual</option>
                  <option value="Professional">Elegant & Professional</option>
                  <option value="Direct">Clean & Direct</option>
                </select>
              </div>
            </div>

            

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Contact email for unhappy customers
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="feedback@yourbusiness.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                This email will be shown to customers who rate you 1-3 stars on the review page.
              </p>
            </div>
          </div>

          {updateSaved && (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 text-xs font-medium font-sans animate-fade-in">
              ✔ Profile voice settings saved and synchronized successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={isUpdating}
            className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-5 py-2.5 transition"
          >
            {isUpdating ? 'Saving Changes...' : 'Save Profile Settings'}
          </button>
        </form>

        {/* Subscription Control Panel (Upgrades & Cancellation) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Shield className="text-slate-700 h-5 w-5" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Subscription & Billing</h3>
              <p className="text-xs text-slate-400 font-sans font-normal">Review and adjust your current active merchant plan.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Account ID</span>
              <span className="text-slate-800 font-mono text-[9px] font-bold">{profile.id}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Service Plan</span>
              <span className="text-blue-600 font-extrabold uppercase tracking-widest text-[10px] bg-blue-50 px-2.5 py-1 rounded-lg">
                PRO PLAN
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Provision State</span>
              <span className={`font-bold text-[10px] px-2.5 py-1 rounded-lg ${
  profile.subscription_status === 'active' 
    ? 'bg-emerald-50 text-emerald-700 uppercase tracking-wider' 
    : 'bg-red-50 text-red-600 uppercase tracking-wider'
}`}>
  {profile.subscription_status === 'active' 
    ? 'Active' 
    : daysLeft !== null && daysLeft > 0 
      ? `Inactive (${daysLeft} days left)` 
      : 'Inactive'}
</span>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="space-y-3 font-sans">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subscription Control</span>
            
            <button
              onClick={handleUpgradeClick}
              disabled={isTriggeringCheckout || isOpeningPortal}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 transition shadow-md disabled:opacity-50 cursor-pointer"
              id="settings-btn-upgrade-plan"
            >
              {isTriggeringCheckout ? 'Calling Secure Checkout...' : profile.subscription_status === 'active' ? 'Manage via Stripe Customer Portal ➔' : 'Activate Pro Subscription ($49/mo) ➔'}
            </button>

            {profile.subscription_status === 'active' && (
              <button
                onClick={handleCancelOrManageSubscription}
                disabled={isOpeningPortal}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-650 text-xs font-bold py-3 transition shadow-sm disabled:opacity-50 cursor-pointer"
                id="btn-cancel-subscription"
              >
                {isOpeningPortal ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" /> Redirecting...
                  </>
                ) : (
                  <>
                    Cancel / Terminate Subscription
                    <ExternalLink size={12} />
                  </>
                )}
              </button>
            )}

            {/* ✅ Change Password Button (opens modal) */}
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold py-3 transition shadow-sm"
            >
              <Key size={14} />
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Feedback Modal */}
      {showCancelFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" id="cancel-feedback-modal-overlay">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900 text-sm mb-2">We're sad to see you go</h3>
            <p className="text-xs text-slate-500 mb-4 font-sans leading-relaxed">
              We'll miss having you on board. Please let us know if there's anything we could have done better (optional):
            </p>
            <textarea
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 mb-4 resize-none font-sans"
              rows={3}
              placeholder="E.g., Missing features, customer support, pricing, or temporary cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              id="cancel-feedback-reason-input"
            />
            <div className="flex items-center justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={() => {
                  setShowCancelFeedbackModal(false);
                  setCancelReason('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsSubmittingCancellation(true);
                  try {
                    await fetch('/api/stripe/cancel-feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: profile.id, reason: cancelReason })
                    });
                  } catch (err) {
                    console.warn('Failed to submit cancellation feedback:', err);
                  } finally {
                    setShowCancelFeedbackModal(false);
                    setIsSubmittingCancellation(false);
                    await handleProceedToStripePortal();
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                id="confirm-cancel-subscription-btn"
              >
                Confirm & Redirect to Stripe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-slate-900 text-sm mb-2">Change Password</h3>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10"
              />
              <input
                type="password"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePasswordDirect}
                disabled={isChangingPassword}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
              >
                {isChangingPassword ? 'Changing...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}