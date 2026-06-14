/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, Send, Clock, Check, RefreshCw, HelpCircle, Server } from 'lucide-react';
import { Invite, Profile } from '../types';

interface SMSCollectorProps {
  profile: Profile;
  invites: Invite[];
  onSendSMS: (customerName: string, phoneNumber: string) => Promise<void>;
  isLoadingInvites: boolean;
  statusLogs: { twilio: string; database_fallback: string };
}

export default function SMSCollector({
  profile,
  invites,
  onSendSMS,
  isLoadingInvites,
  statusLogs
}: SMSCollectorProps) {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Checks
  const isStarter = profile.subscription_plan === 'starter';
  const isInactive = profile.subscription_status === 'inactive';
  const isLocked = isStarter || isInactive;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phoneNumber) return;
    setIsSending(true);
    setSendSuccess(false);
    try {
      await onSendSMS(customerName, phoneNumber);
      setCustomerName('');
      setPhoneNumber('');
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Locked overlay warning if Starter tries to access */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4 shadow-sm animate-fade-in">
          <Smartphone className="h-10 w-10 text-amber-500 shrink-0" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-amber-800 text-sm">SMS Review Collector is Locked</h3>
            <p className="text-xs text-amber-700 leading-relaxed font-sans">
              Collect 5-star Google & Yelp reviews 10x faster by text message. This invite builder compiles responsive feedback links and distributes them directly to client phones. Available on <strong className="font-bold">Growth</strong> and <strong className="font-bold">Pro</strong> plans.
            </p>
          </div>
          <button 
            onClick={() => window.location.hash = '#currentRoute=dashboardSettings'}
            className="md:ml-auto rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 transition shrink-0 uppercase tracking-wider"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Intro info box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">SMS Review Collector</h2>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Send instant text reminders requesting feedback. Studies show 72% of customers leave a review when texted directly.
          </p>
        </div>
        
        {/* Status indicator badges */}
        <div className="flex gap-2 shrink-0">
          <div className="bg-slate-100 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200 uppercase tracking-wider">
            <Server size={10} />
            Twilio Key: {statusLogs.twilio === 'ready' ? (
              <span className="text-emerald-600">Active</span>
            ) : (
              <span className="text-amber-500">Virtual Simulation</span>
            )}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 md:grid-cols-5 items-start ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
        
        {/* Left pane: SMS invitation Form */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Build Review SMS Invitation</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            Submit your client's name and mobile number. An custom text invitation will dispatch immediately directing them to write positive feedback on Google.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sandra Bullock"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 bg-white"
                required
                disabled={isLocked}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                placeholder="e.g. +1 555-019-2831"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 bg-white"
                required
                disabled={isLocked}
              />
              <span className="text-[10px] text-slate-400 mt-1 block leading-normal">
                Include country prefix (e.g. +1 for United States, +49 for Germany, +34 for Spain).
              </span>
            </div>

            {sendSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 text-xs font-medium flex items-center gap-1.5 font-sans">
                <Check size={14} /> SMS Request created and logged successfully. {statusLogs.twilio !== 'ready' && '(Logged in Simulation loop)'}
              </div>
            )}

            <button
              type="submit"
              disabled={isSending || isLocked}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-2.5 transition shadow-sm"
            >
              <Send size={12} />
              {isSending ? 'Dispatching Message...' : 'Send SMS Invitation'}
            </button>
          </form>

          {/* SMS Template review box */}
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Message Preview</span>
            <p className="text-xs text-slate-600 leading-normal italic font-sans select-none">
              "Hi <strong className="text-slate-900">[Name]</strong>, {profile.business_name || 'Our establishment'} values your feedback. Please leave a review here: <span className="text-blue-500 underwear">http://localhost:3000/review/thank-you?business=...</span>"
            </p>
          </div>
        </div>

        {/* Right pane: Past Sent Invite list */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">Review Invitations History ({invites.length})</h3>
            <span className="text-xs text-slate-400 shrink-0">Live status monitor</span>
          </div>

          {isLoadingInvites ? (
            <div className="p-8 text-center bg-white" id="invites-loader">
              <RefreshCw className="h-6 w-6 text-blue-600 rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs text-slate-400">Loading invitations...</span>
            </div>
          ) : invites.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-sans min-h-[300px] flex flex-col justify-center bg-white">
              <Smartphone size={36} className="mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700 text-sm">No invites sent yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Once customer reviews requests are sent out, live delivery receipts will stream here automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto bg-white">
              {invites.map((inv) => {
                const isSent = inv.status === 'sent';
                const isDelivered = inv.status === 'delivered';
                const isFailed = inv.status === 'failed';

                return (
                  <div key={inv.id} className="p-4 flex justify-between items-center bg-white">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-900 text-sm">{inv.customer_name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{inv.phone_number}</p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-sans block">
                        {new Date(inv.sent_at).toLocaleDateString()} at {new Date(inv.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        inv.status === 'sent' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : inv.status === 'failed'
                          ? 'bg-red-50 text-red-700 border-red-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
