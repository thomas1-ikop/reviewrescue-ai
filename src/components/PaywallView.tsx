// src/components/PaywallView.tsx
import React from 'react';
import { Lock, Sparkles, Check } from 'lucide-react';

interface PaywallViewProps {
  user: any;
  onUpgrade: () => void;
}

const PaywallView: React.FC<PaywallViewProps> = ({ user, onUpgrade }) => {
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xl space-y-6">
        <div className="rounded-full bg-blue-50 p-4 w-max mx-auto border border-blue-100 text-blue-600">
          <Lock size={32} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Activate Your Pro Plan</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Your account is currently on a free trial. Upgrade to Pro to unlock unlimited AI replies, SMS invites, and auto-reply.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-6 mt-6">
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 max-w-sm mx-auto">
            <div className="flex items-center justify-between font-sans">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg">Pro Access</span>
              <span className="text-lg font-black text-slate-900">$49<span className="text-xs font-normal text-slate-500">/mo</span></span>
            </div>
            
            <div className="space-y-2.5 text-left text-xs font-sans text-slate-600 border-t border-slate-200/60 pt-4">
              <p className="flex items-start gap-2.5">
                <span className="text-emerald-500">✔</span> Unlimited AI Replies
              </p>
              <p className="flex items-start gap-2.5">
                <span className="text-emerald-500">✔</span> SMS Review Invites
              </p>
              <p className="flex items-start gap-2.5">
                <span className="text-emerald-500">✔</span> Google Auto-Reply
              </p>
              <p className="flex items-start gap-2.5">
                <span className="text-emerald-500">✔</span> Real-time Alerts
              </p>
            </div>

            <button
              onClick={onUpgrade}
              className="w-full mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 transition shadow-lg"
            >
              Activate Pro License Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallView;