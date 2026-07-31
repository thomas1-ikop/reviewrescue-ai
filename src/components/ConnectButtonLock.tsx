// src/components/ConnectButtonLock.tsx

import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { Plan } from '../lib/plans';

interface ConnectButtonLockProps {
  children: React.ReactNode;
  currentPlan: Plan | null | undefined;
  requiredPlan: Plan;
}

export default function ConnectButtonLock({
  children,
  currentPlan,
  requiredPlan
}: ConnectButtonLockProps) {
  const planNames: Record<Plan, string> = {
    basic: 'Basic',
    pro: 'Pro',
    premium: 'Premium'
  };

  const handleUpgrade = () => {
    const event = new CustomEvent('navigateTo', { 
      detail: { route: 'billing' } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200/60 bg-white/50 shadow-sm">
      {/* ─── BLURRED CONTENT ─────────────────────────────────────────── */}
      <div className="opacity-30 blur-[1px] pointer-events-none select-none">
        {children}
      </div>
      
      {/* ─── CLEAN OVERLAY ───────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-sm px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 rounded-full p-1.5">
            <Lock className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-medium text-slate-600">
            Upgrade to <span className="font-bold text-blue-600">{planNames[requiredPlan]}</span>
          </span>
          <button
            onClick={handleUpgrade}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold transition px-3 py-1.5 shadow-sm"
          >
            <Crown className="w-3.5 h-3.5" />
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}