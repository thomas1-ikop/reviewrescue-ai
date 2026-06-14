/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Shield, RefreshCw, Smartphone, Key, CircleDot, AlertTriangle, ExternalLink } from 'lucide-react';
import { Profile } from '../types';

interface SettingsViewProps {
  profile: Profile;
  onUpdateProfile: (data: { business_name: string; industry: string; tone: string }) => Promise<void>;
  onUpgradePlan: (plan: 'starter' | 'growth' | 'pro') => Promise<void>;
  statusLogs: {
    supabase: string;
    gemini: string;
    stripe: string;
    twilio: string;
    database_fallback: string;
  };
  isLoadingStatus: boolean;
}

export default function SettingsView({
  profile,
  onUpdateProfile,
  onUpgradePlan,
  statusLogs,
  isLoadingStatus
}: SettingsViewProps) {
  const [bizName, setBizName] = useState(profile.business_name || '');
  const [industry, setIndustry] = useState(profile.industry || 'Restaurant');
  const [tone, setTone] = useState(profile.tone || 'Friendly');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSaved, setUpdateSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSaved(false);
    try {
      await onUpdateProfile({ business_name: bizName, industry, tone });
      setUpdateSaved(true);
      setTimeout(() => setUpdateSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
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

        {/* Integration Credentials checklist (Outstanding UX for developers) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="h-4 flex justify-between items-center bg-slate-50 border-b border-slate-100 -mx-6 -mt-6 px-6 py-8 rounded-t-2xl font-sans">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Workspace Credentials Checklist</h3>
              <p className="text-[11px] text-slate-400">Review real-time API integrations on your active development container.</p>
            </div>
            
            {isLoadingStatus && <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
          </div>

          <div className="space-y-3 pt-2 font-mono">
            {[
              {
                id: 'supabase',
                title: 'Supabase Database Connection',
                desc: 'Profiles, Reviews and SMS tables synchronization.',
                status: statusLogs.supabase,
                okText: 'Connected (Using Real Database)',
                nokText: 'Sandbox Fallback Mode Active (Tables not found/unset)'
              },
              {
                id: 'gemini',
                title: 'Gemini 2.0 API Key',
                desc: 'Generates smart replies tailored to review stars.',
                status: statusLogs.gemini,
                okText: 'Active & Verified',
                nokText: 'Missing Key (Simulated responses active)'
              },
              {
                id: 'stripe',
                title: 'Stripe Merchant Key',
                desc: 'Monitors starter/growth/pro checkout subscriptions.',
                status: statusLogs.stripe,
                okText: 'Stripe CLI sandbox active',
                nokText: 'Stripe keys missing (Visual simulated checkout active)'
              },
              {
                id: 'twilio',
                title: 'Twilio SMS Gateway',
                desc: 'Sends instant review invites directly to phone streams.',
                status: statusLogs.twilio,
                okText: 'Connected and sending text',
                nokText: 'Twilio accounts key offline (Visual logging active)'
              }
            ].map((check) => {
              const isOk = check.status === 'connected' || check.status === 'ready';
              return (
                <div key={check.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <CircleDot size={14} className={`mt-1 shrink-0 ${isOk ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">{check.title}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block font-sans">{check.desc}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-extrabold mt-1 block font-sans ${isOk ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {isOk ? check.okText : check.nokText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RLS or SQL instructions for user */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-xs space-y-2">
            <span className="font-extrabold text-slate-700 block flex items-center gap-1">
              <AlertTriangle size={14} className="text-amber-500" />
              Supabase SQL Editor Code:
            </span>
            <p className="text-slate-500 font-sans leading-relaxed text-[11px]">
              If tables are missing in your Supabase DB, copy-paste the SQL script inside the Supabase SQL editor:
            </p>
            <pre className="text-[10px] text-slate-650 bg-white border border-slate-200 p-2.5 rounded-lg overflow-x-auto leading-normal whitespace-pre">
{`CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  email text,
  business_name text,
  industry text,
  tone text,
  subscription_status text DEFAULT 'inactive',
  subscription_plan text DEFAULT 'starter',
  onboarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  stripe_customer_id text
);

CREATE TABLE reviews (
  id text PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  customer_name text,
  rating integer,
  comment text,
  source text,
  status text DEFAULT 'pending',
  reply_text text,
  is_autopilot boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);`}
            </pre>
          </div>
        </div>
      </div>

      {/* Right col: Stripe Subscription control portal info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Shield className="text-slate-700 h-5 w-5" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Subscription Management</h3>
              <p className="text-xs text-slate-400 font-sans font-normal">Review and adjust your billing cycle instantly.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Account ID</span>
              <span className="text-slate-800 font-mono text-[9px] font-bold">{profile.id}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Current Plan</span>
              <span className="text-blue-600 font-extrabold uppercase tracking-widest text-xs bg-blue-50 px-2 py-0.5 rounded-lg">
                {profile.subscription_plan} plan
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Status</span>
              <span className={`font-semibold text-xs px-2 py-0.5 rounded-lg ${
                profile.subscription_status === 'active' 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-red-50 text-red-650'
              }`}>
                {profile.subscription_status === 'active' ? 'Active Subscription' : 'Inactive (Payment required / Unpaid)'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-normal font-sans">
            Ready to adjust limits or cancel? Tap below to access the secure customer portal. Change plans on the fly; Stripe recalculates allocations and applies proration immediately.
          </p>

          <div className="space-y-2">
            <button
              onClick={() => onUpgradePlan(profile.subscription_plan)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold py-3 hover:bg-slate-50 transition"
              id="billing-portal-launcher-btn"
            >
              Manage / Cancel Plan (Billing Portal)
              <ExternalLink size={12} />
            </button>

            {profile.subscription_status === 'inactive' && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Re-Activate Quick Selection</span>
                <div className="grid grid-cols-3 gap-2">
                  {['starter', 'growth', 'pro'].map((p) => (
                    <button
                      key={p}
                      onClick={() => onUpgradePlan(p as any)}
                      className="rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] py-1 px-2 font-bold uppercase transition text-center"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
