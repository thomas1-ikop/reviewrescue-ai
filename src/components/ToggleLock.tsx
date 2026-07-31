// src/components/ToggleLock.tsx

import React from 'react';
import { Lock } from 'lucide-react';
import { Plan } from '../lib/plans';

interface ToggleLockProps {
  children: React.ReactNode;
  currentPlan: Plan | null | undefined;
  requiredPlan: Plan;
}

export default function ToggleLock({
  children,
  currentPlan,
  requiredPlan
}: ToggleLockProps) {
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
    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-slate-200/60">
      {/* Toggle (blurred) */}
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Divider */}
      <div className="w-px h-6 bg-slate-200" />
      
      {/* Upgrade button */}
      <button
        onClick={handleUpgrade}
        className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600 hover:text-blue-700 transition whitespace-nowrap"
      >
        <Lock className="w-3 h-3" />
        Upgrade to <span className="font-semibold">{planNames[requiredPlan]}</span>
      </button>
    </div>
  );
}