/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Key } from 'lucide-react';
import { Profile } from '../types';
import { supabaseClient } from '../lib/supabaseClient';

interface SettingsViewProps {
  profile: Profile;
  onUpdateProfile: (data: { business_name: string; industry: string; tone: string; contact_email: string }) => Promise<void>;
  triggerToast: (message: string, type?: 'success' | 'warn' | 'info') => void;
}

export default function SettingsView({
  profile,
  onUpdateProfile,
  triggerToast
}: SettingsViewProps) {
  const [bizName, setBizName] = useState(profile.business_name || '');
  const [industry, setIndustry] = useState(profile.industry || 'Restaurant');
  const [tone, setTone] = useState(profile.tone || 'Friendly');
  const [contactEmail, setContactEmail] = useState(profile.contact_email || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSaved, setUpdateSaved] = useState(false);

  // --- Password change state ---
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

        {/* Change Password Button */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold py-3 transition shadow-sm"
          >
            <Key size={14} />
            Change Password
          </button>
        </div>
      </div>

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