/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Sparkles, AlertCircle, RefreshCw, Cpu, Activity, CheckCircle } from 'lucide-react';
import { Profile, AutopilotLog } from '../types';

interface AutopilotPanelProps {
  profile: Profile;
  onUpdateBilling: (plan: 'starter' | 'growth' | 'pro', active: 'active' | 'inactive') => Promise<void>;
  onTriggerSimulation: () => Promise<void>;
  isLoadingSim: boolean;
  statusLogs: { gemini: string; database_fallback: string };
}

export default function AutopilotPanel({
  profile,
  onUpdateBilling,
  onTriggerSimulation,
  isLoadingSim,
  statusLogs
}: AutopilotPanelProps) {
  const isPro = profile.subscription_plan === 'pro';
  const isInactive = profile.subscription_status === 'inactive';
  const isLocked = !isPro || isInactive;

  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [logs, setLogs] = useState<AutopilotLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Toggle state handle
  const handleToggle = () => {
    if (isLocked) return;
    setAutopilotEnabled(!autopilotEnabled);
  };

  // Fetch autopilot logs from our server
  const fetchAutopilotLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/autopilot/logs', {
        headers: { 'x-user-id': profile.id }
      });
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (!isLocked) {
      fetchAutopilotLogs();
      const interval = setInterval(fetchAutopilotLogs, 6000); // refresh every 6 seconds
      return () => clearInterval(interval);
    }
  }, [isLocked, profile.id]);

  return (
    <div className="space-y-6">
      
      {/* Alert Warning for non-Pro plans */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4 shadow-sm">
          <Cpu className="h-10 w-10 text-amber-500 shrink-0" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-amber-800 text-sm">GMB Reputation Auto-Pilot is Locked</h3>
            <p className="text-xs text-amber-700 leading-relaxed font-sans">
              Connect your Google My Business (GMB) Profile to let the Gemini 2.0 Flash agent auto-post highly personalized, warm responses to 4 and 5-star customer reviews instantly inside the cloud stream. This feature is unlocked on the <strong className="font-bold">Pro plan</strong> only.
            </p>
          </div>
          <button 
            onClick={() => window.location.hash = '#currentRoute=dashboardSettings'}
            className="md:ml-auto rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 transition shrink-0 uppercase tracking-wider"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Main Autopilot Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">Google Auto-Pilot Engine</h2>
          <p className="text-sm text-slate-500 mt-1 font-sans font-normal">
            Gemini autonomously fields positive reviews right on Google My Business. Negative reviews (1-3 stars) trigger immediate dashboard alerts so you handle them personally.
          </p>
        </div>

        {/* Master Switch on Header */}
        {!isLocked && (
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 shrink-0 select-none">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Autopilot Status:
            </span>
            <button 
              onClick={handleToggle}
              className="transition hover:scale-105"
              id="autopilot-toggle-switch"
            >
              {autopilotEnabled ? (
                <div className="flex items-center gap-1 text-emerald-600">
                  <span className="text-xs font-black uppercase tracking-wider">Active</span>
                  <ToggleRight size={38} className="text-emerald-500 transition-colors" />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-350">Halted</span>
                  <ToggleLeft size={38} className="text-slate-300" />
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-6 md:grid-cols-5 items-start ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
        
        {/* Left pane: Connector Card and Simulators */}
        <div className="md:col-span-2 space-y-4">
          
          {/* Virtual Integration State Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Integration Status</h3>
            
            <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-sans">
              <CheckCircle className="text-emerald-600 shrink-0 h-5 w-5" />
              <div className="text-xs">
                <span className="font-bold block">Google Profile Connected</span>
                <span className="text-[11px] block mt-0.5 text-emerald-700 font-light">Connected with mock OAuth token GMB-718</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Engine rules:</span>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed list-disc list-inside font-sans">
                <li><strong className="text-slate-800">Reviews &ge; 4 Stars</strong>: Generate & auto-respond under 1 minute.</li>
                <li><strong className="text-slate-800">Reviews &le; 3 Stars</strong>: Flag red alert in Review Center. No auto-response will post.</li>
                <li><strong className="text-slate-800">Tone Alignment</strong>: Dynamic friendly/direct modifiers apply.</li>
              </ul>
            </div>

            {/* Simulated Reviews Trigger box */}
            <div className="p-4 bg-blue-50/20 border border-blue-100 rounded-xl space-y-3">
              <div className="flex items-start gap-1.5">
                <Activity className="text-blue-500 mt-0.5 shrink-0" size={16} />
                <span className="text-xs font-bold text-blue-900">Sandbox Playground Simulator</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-normal font-sans font-light">
                Autopilot is fully functional! Tap the switch to <strong className="font-bold">Active</strong>, then click below to simulated receipt of 4 new Google Reviews. Watch Gemini reply to positive feedback automatically on the background thread!
              </p>

              <button
                onClick={onTriggerSimulation}
                disabled={isLoadingSim || !autopilotEnabled}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 shadow-md disabled:bg-slate-300 disabled:shadow-none"
                id="btn-simulate-incoming"
              >
                {isLoadingSim ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" /> Ingesting reviews...
                  </>
                ) : (
                  <>
                    <RefreshCw size={12} /> Inject Simulated GMB Reviews
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right pane: Autopilot audit log */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">Autopilot Process Ledger ({logs.length})</h3>
            <span className="text-[10px] font-bold text-blue-600 shrink-0 uppercase tracking-widest flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping" /> Real-time feed
            </span>
          </div>

          {isLoadingLogs && logs.length === 0 ? (
            <div className="p-10 text-center" id="autopilot-loading-logs">
              <div className="h-6 w-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs text-slate-400">Loading process audit log...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-sans min-h-[300px] flex flex-col justify-center">
              <Cpu size={32} className="mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-750 text-sm">Audit trail is currently empty</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Once Autopilot catches incoming Google feedback of Star Rating 4 or 5, details of the AI auto-replies will register here immediately. Make sure GMB is Connected, Autopilot is Active, and trigger simulated reviews!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="p-5 font-sans space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-slate-950 text-xs text-md">{log.review_customer_name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-emerald-600 font-extrabold text-[11px]">★ {log.rating} Star Review</span>
                        <span className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span className="text-[9px] text-slate-400">Auto-sent on Google Profile</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                    "{log.review_text}"
                  </p>

                  <div className="p-3 bg-blue-50/15 border border-l-2 border-blue-500/20 text-xs rounded-lg space-y-1">
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block flex items-center gap-1">
                      <Sparkles size={10} /> Autopilot Response posted:
                    </span>
                    <p className="text-slate-700 leading-normal">
                      {log.generated_reply}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
