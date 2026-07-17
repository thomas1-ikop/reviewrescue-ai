// src/components/UpgradeScreen.tsx

import React from 'react';
import { Lock, Sparkles, Check } from 'lucide-react';

interface UpgradeScreenProps {
  targetPlan: 'premium';
  userId: string; // 👈 Add this
}

export default function UpgradeScreen({ targetPlan, userId }: UpgradeScreenProps) {
  const features = [
    'SMS Review Invites',
    'AI Review Insights',
    'Website Review Widget',
    'Competitor Intelligence',
    'Negative Review Alerts',
    'Team Accounts',
  ];

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xl space-y-6">
        <div className="rounded-full bg-purple-50 p-4 w-max mx-auto border border-purple-100 text-purple-600">
          <Sparkles size={32} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Unlock Premium Features</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Upgrade to Premium to unlock advanced features like SMS invites, review insights, and more.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-6 mt-6">
          <div className="p-6 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-4 max-w-sm mx-auto">
            <div className="flex items-center justify-between font-sans">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-100 px-2.5 py-1 rounded-lg">Premium</span>
              <span className="text-lg font-black text-slate-900">$89<span className="text-xs font-normal text-slate-500">/mo</span></span>
            </div>
            
            <div className="space-y-2.5 text-left text-xs font-sans text-slate-600 border-t border-purple-200/60 pt-4">
              {features.map((feature, idx) => (
                <p key={idx} className="flex items-start gap-2.5">
                  <span className="text-purple-500 mt-0.5">✔</span>
                  {feature}
                </p>
              ))}
            </div>

            <button
              onClick={() => {
                // Trigger Premium checkout
                window.location.href = `/api/stripe/create-checkout?plan=premium&userId=${userId}`;
              }}
              className="w-full mt-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-3.5 transition shadow-lg"
            >
              Activate Premium License Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}