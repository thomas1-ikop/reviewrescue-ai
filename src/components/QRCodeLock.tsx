// src/components/QRCodeLock.tsx

import React from 'react';
import { Lock, Crown, ArrowUpRight } from 'lucide-react';
import { Plan, isAtLeast } from '../lib/plans';

interface QRCodeLockProps {
  children: React.ReactNode;
  currentPlan: Plan | null | undefined;
  requiredPlan: Plan;
  message?: string;
}

export default function QRCodeLock({
  children,
  currentPlan,
  requiredPlan,
  message
}: QRCodeLockProps) {
  // ✅ CHECK IF USER HAS ACCESS
  const hasAccess = isAtLeast(currentPlan, requiredPlan);
  
  // If user has access, show the content normally
  if (hasAccess) {
    return <>{children}</>;
  }

  const planNames: Record<Plan, string> = {
    basic: 'Basic',
    pro: 'Pro',
    premium: 'Premium'
  };

  const planPrices: Record<Plan, string> = {
    basic: '$19/mo',
    pro: '$49/mo',
    premium: '$89/mo'
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
      <div className="opacity-25 blur-[1px] pointer-events-none select-none">
        {children}
      </div>
      
      {/* ─── COMPACT HORIZONTAL OVERLAY ────────────────────────────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm px-3 py-2">
        <div className="flex items-center gap-3 w-full justify-center flex-wrap">
          {/* Lock icon */}
          <div className="bg-slate-100 rounded-full p-1.5 flex-shrink-0">
            <Lock className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
          </div>
          
          {/* Text */}
          <div className="text-center">
            <span className="text-xs font-semibold text-slate-800">
              Upgrade to <span className="text-blue-600">{planNames[requiredPlan]}</span>
            </span>
            <span className="text-[10px] text-slate-400 ml-1">
              (Current: {planNames[currentPlan || 'basic']})
            </span>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              {message || `QR codes are a Pro feature.`}
            </div>
          </div>
          
          {/* Button */}
          <button
            onClick={handleUpgrade}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold transition px-3 py-1.5 shadow-sm whitespace-nowrap flex-shrink-0"
          >
            <Crown className="w-3.5 h-3.5" />
            {planPrices[requiredPlan]}
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}