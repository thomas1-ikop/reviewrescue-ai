/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, MessageSquareHeart } from 'lucide-react';

interface PricingCardsProps {
  onSelectPlan: (plan: 'pro') => void;
  selectedPlan?: 'pro' | null;
  currency: 'USD' | 'EUR';
}

export default function PricingCards({ onSelectPlan, selectedPlan, currency }: PricingCardsProps) {
  const plan = {
    id: 'pro' as const,
    name: 'Pro Subscription',
    price: currency === 'USD' ? '$49' : '€49',
    interval: 'month',
    icon: <MessageSquareHeart className="h-6 w-6 text-emerald-600" />,
    description: 'Fully automated review management with smart AI replies, custom feedback collection, and text invitations.',
    features: [
      'Unlimited AI replies - absolute full access without limits',
      'Send Text Invites to customers for feedback',
      'Invite delivery history and status tracking',
      'Auto-Reply to Positive Reviews & customize responses',
      'Review Dashboard with live reviews management',
      'Dynamic brand settings & custom response tones',
      'Priority 24/7 client support response',
    ],
    ctaText: 'Activate Pro Subscription',
    highlighted: true,
  };

  const isSelected = selectedPlan === plan.id;

  return (
    <div className="max-w-md mx-auto">
      <div
        className="relative flex flex-col rounded-2xl bg-white p-8 border border-blue-600 shadow-xl ring-4 ring-blue-600/5 transition-all duration-300 hover:shadow-2xl cursor-pointer"
        onClick={() => onSelectPlan(plan.id)}
        id="pricing-card-pro"
      >
        <span className="absolute -top-3 right-8 rounded-full bg-blue-600 px-3.5 py-1 text-xs font-bold text-white uppercase tracking-wider">
          Best Value Offer
        </span>
        
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-blue-100/50">
            {plan.icon}
          </div>
          <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
        </div>
        
        <p className="mt-4 text-xs text-slate-500 leading-relaxed min-h-[40px] font-sans">
          {plan.description}
        </p>
        
        {/* ─── PRICE WITH CROSSED-OUT & DISCOUNT BADGE ───────────────────── */}
        <div className="mt-6 flex items-center justify-center gap-3 text-slate-900">
          <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
          <span className="text-sm font-semibold text-slate-500">/{plan.interval}</span>
          <span className="text-sm text-slate-400 line-through font-medium">
            {currency === 'USD' ? '$59' : '€59'}
          </span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            17% OFF
          </span>
        </div>

        <ul className="mt-8 space-y-4 flex-1 font-sans">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <span className="text-sm text-slate-650 leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectPlan(plan.id);
          }}
          className="mt-8 w-full rounded-xl py-3 px-4 text-center text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all duration-150 cursor-pointer"
          id="choose-plan-btn-pro"
        >
          {isSelected ? 'Proceed with Checkout' : plan.ctaText}
        </button>
      </div>
    </div>
  );
}