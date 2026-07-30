// src/components/PlanLock.tsx

import React from 'react';
import { Lock } from 'lucide-react';
import { isAtLeast, Plan } from '../lib/plans';

interface PlanLockProps {
  children: React.ReactNode;
  currentPlan: Plan | null | undefined;
  requiredPlan: Plan;
  message?: string;
  onUpgrade?: () => void;
}

export default function PlanLock({
  children,
  currentPlan,
  requiredPlan,
  message = 'Upgrade to unlock this feature',
  onUpgrade
}: PlanLockProps) {
  const hasAccess = isAtLeast(currentPlan, requiredPlan);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl p-6">
        <Lock className="w-8 h-8 text-slate-400 mb-3" />
        <p className="text-sm font-semibold text-slate-700 text-center">{message}</p>
        <p className="text-xs text-slate-400 text-center mt-1">
          {requiredPlan === 'pro' ? 'Upgrade to Pro ($49/mo)' : 'Upgrade to Premium ($89/mo)'}
        </p>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            Upgrade Now
          </button>
        )}
      </div>
    </div>
  );
}