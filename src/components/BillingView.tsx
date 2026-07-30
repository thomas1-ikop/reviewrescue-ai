/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CreditCard, 
  Crown, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpCircle, 
  ArrowDownCircle,
  ExternalLink,
  RefreshCw,
  Calendar,
  Shield
} from 'lucide-react';
import { Profile } from '../types';

interface BillingViewProps {
  profile: Profile;
  onUpgradePlan: (plan: 'basic' | 'pro' | 'premium') => Promise<void>;
  onCancelSubscription: () => Promise<void>;
  triggerToast: (message: string, type?: 'success' | 'warn' | 'info' | 'error') => void;
}

export default function BillingView({ 
  profile, 
  onUpgradePlan, 
  onCancelSubscription,
  triggerToast 
}: BillingViewProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [cancelReason, setCancelReason] = useState('');
const [showCancelFeedback, setShowCancelFeedback] = useState(false);
const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const plan = profile.subscription_plan || 'basic';
  const status = profile.subscription_status || 'inactive';
  const isActive = status === 'active';
  const daysLeft = profile.subscription_expires_at 
    ? Math.ceil((new Date(profile.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const planNames: Record<string, string> = {
    basic: 'Basic',
    pro: 'Pro',
    premium: 'Premium'
  };

  const planPrices: Record<string, string> = {
    basic: '$19/mo',
    pro: '$49/mo',
    premium: '$89/mo'
  };

  const planFeatures: Record<string, string[]> = {
    basic: ['AI Replies', 'Dashboard', 'Email Invites', 'Manual Import'],
    pro: ['All Basic +', 'Auto-Reply', 'QR Codes', 'Zapier Integration'],
    premium: ['All Pro +', 'SMS Invites', 'Widget', 'Insights', 'Team Accounts']
  };

  const handleUpgrade = async (newPlan: 'basic' | 'pro' | 'premium') => {
    if (newPlan === plan) {
      triggerToast(`You're already on the ${planNames[newPlan]} plan`, 'info');
      return;
    }
    setIsUpgrading(true);
    try {
      await onUpgradePlan(newPlan);
      triggerToast(`Upgraded to ${planNames[newPlan]} plan successfully!`, 'success');
    } catch (err) {
      triggerToast('Failed to upgrade plan. Please try again.', 'error');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      await onCancelSubscription();
      triggerToast('Subscription cancelled. You will have access until the end of your billing period.', 'info');
      setShowCancelModal(false);
    } catch (err) {
      triggerToast('Failed to cancel subscription. Please try again.', 'error');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm">
          <CreditCard className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Billing & Subscription</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your plan, billing, and subscription details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── LEFT COLUMN: Plan Details ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Current Plan</h2>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertTriangle className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-3xl font-black text-slate-900">{planNames[plan]}</span>
                  <span className="text-sm font-semibold text-slate-500">{planPrices[plan]}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {planFeatures[plan]?.map((feature, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                {plan === 'premium' ? (
                  <Crown className="w-6 h-6 text-amber-500" />
                ) : plan === 'pro' ? (
                  <Shield className="w-6 h-6 text-blue-500" />
                ) : (
                  <CreditCard className="w-6 h-6 text-slate-500" />
                )}
              </div>
            </div>

            {/* ─── COUNTDOWN ────────────────────────────────────────────── */}
{profile.subscription_expires_at && isActive && (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <Calendar className="w-5 h-5 text-slate-500" />
      <h3 className="text-sm font-bold text-slate-900">Billing Cycle</h3>
    </div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-500">Next billing date</p>
        <p className="text-sm font-semibold text-slate-900">
          {new Date(profile.subscription_expires_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-500">Days remaining</p>
        <p className="text-xl font-black text-blue-600">
          {Math.ceil((new Date(profile.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
        </p>
      </div>
    </div>
  </div>
)}

            {/* Subscription Status */}
            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 font-medium">Status</span>
                <p className="text-sm font-semibold text-slate-800">
                  {isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              {daysLeft !== null && isActive && (
                <div>
                  <span className="text-xs text-slate-400 font-medium">Days Remaining</span>
                  <p className="text-sm font-semibold text-slate-800">
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                  </p>
                </div>
              )}
              {profile.subscription_expires_at && !isActive && (
  <div>
    <span className="text-xs text-slate-400 font-medium">Expired On</span>
    <p className="text-sm font-semibold text-slate-800">
      {new Date(profile.subscription_expires_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </p>
  </div>
)}
            </div>
          </div>

          {/* Plan Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Plan Actions</h3>
            <div className="space-y-3">
              {/* Upgrade */}
              {plan === 'basic' && (
                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={isUpgrading}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition group"
                >
                  <div className="flex items-center gap-3">
                    <ArrowUpCircle className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-blue-800">Upgrade to Pro</p>
                      <p className="text-[10px] text-blue-600">Get Auto-Reply, QR Codes & more</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-800">$49/mo</span>
                </button>
              )}
              {plan === 'pro' && (
                <>
                  <button
                    onClick={() => handleUpgrade('premium')}
                    disabled={isUpgrading}
                    className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowUpCircle className="w-5 h-5 text-amber-600" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-amber-800">Upgrade to Premium</p>
                        <p className="text-[10px] text-amber-600">Get SMS, Widget, Insights & more</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-amber-800">$89/mo</span>
                  </button>
                  <button
                    onClick={() => handleUpgrade('basic')}
                    disabled={isUpgrading}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowDownCircle className="w-5 h-5 text-slate-600" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-700">Downgrade to Basic</p>
                        <p className="text-[10px] text-slate-500">Keep core features</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-700">$19/mo</span>
                  </button>
                </>
              )}
              {plan === 'premium' && (
                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={isUpgrading}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition group"
                >
                  <div className="flex items-center gap-3">
                    <ArrowDownCircle className="w-5 h-5 text-slate-600" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-700">Downgrade to Pro</p>
                      <p className="text-[10px] text-slate-500">Remove Premium features</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-700">$49/mo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Danger Zone ────────────────────────────── */}
        <div className="space-y-6">
          {/* Cancel Subscription */}
          {isActive && (
  <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <AlertTriangle className="w-5 h-5 text-red-500" />
      <h3 className="text-sm font-bold text-red-800">Cancel Subscription</h3>
    </div>
    
    {!profile.stripe_customer_id ? (
      // ─── MANUAL ACCOUNT – No Stripe portal ──────────────────────
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <p className="text-xs text-amber-700">
          ⚠️ This is a test account. To cancel, you'll need to contact support or update your status manually.
        </p>
        <p className="text-xs text-amber-600 mt-1">
          <strong>Subscription expires:</strong> {profile.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString() : 'No expiry set (test account)'}
        </p>
      </div>
    ) : (
      // ─── REAL STRIPE ACCOUNT ──────────────────────────────────────
      <p className="text-xs text-slate-500 mb-4">
        Your subscription will remain active until the end of your current billing period. You will not be charged again.
      </p>
    )}

    <button
      onClick={() => {
        if (!profile.stripe_customer_id) {
          triggerToast('Test account – please contact support to cancel.', 'info');
          return;
        }
        setShowCancelFeedback(true);
      }}
      disabled={isCanceling}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 text-sm font-semibold transition disabled:opacity-50"
    >
      {isCanceling ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Canceling...
        </>
      ) : (
        'Cancel Subscription'
      )}
    </button>
  </div>
)}


{/* ─── CANCEL FEEDBACK MODAL ────────────────────────────────── */}
{showCancelFeedback && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">We're sad to see you go</h3>
      </div>
      
      <p className="text-sm text-slate-600 mb-4">
        We'd love to know why you're canceling so we can improve. Your feedback is valuable.
      </p>
      
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Why are you canceling?
        </label>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={3}
          placeholder="e.g., Too expensive, Missing features, Not using it, etc."
          className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
        />
      </div>
      
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setShowCancelFeedback(false)}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
        >
          Keep Subscription
        </button>
        <button
          onClick={() => {
            setShowCancelFeedback(false);
            setShowCancelModal(true);
          }}
          className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-lg shadow-red-600/25"
        >
          Continue to Cancel
        </button>
      </div>
    </div>
  </div>
)}


          {/* Help */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Need Help?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Have questions about your subscription? Contact our support team.
            </p>
            <a
              href="mailto:contact@rewakely.com"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      {/* ─── CANCEL CONFIRMATION MODAL ─────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Subscription?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to cancel your subscription? You will have access until <strong>{profile.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'the end of your billing period'}</strong> and will not be charged again.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={isCanceling}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-lg shadow-red-600/25"
              >
                {isCanceling ? 'Canceling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}