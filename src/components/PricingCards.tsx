/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, MessageSquareHeart, Sparkles, Clock } from 'lucide-react';

interface PricingCardsProps {
  onSelectPlan: (plan: 'pro' | 'premium') => void;
  selectedPlan?: 'pro' | 'premium' | null;
  currency: 'USD' | 'EUR';
}

export default function PricingCards({ onSelectPlan, selectedPlan, currency }: PricingCardsProps) {
  const plans = {
    pro: {
      id: 'pro' as const,
      name: 'Pro Plan',
      price: currency === 'USD' ? '$49' : '€49',
      interval: 'month',
      icon: <MessageSquareHeart className="h-6 w-6 text-blue-600" />,
      description: 'Everything you need to start collecting reviews automatically.',
      features: [
        'Unlimited AI Replies to any review',
        'Google Auto-Reply for positive reviews',
        'Review Dashboard with live management',
        'Email Review Invites',
        'QR Code Generation for in-store',
        'Feedback Collection with duplicate prevention',
        'Integration with your customer database (7,000+ apps)',
        '24/7 Email Support',
      ],
      ctaText: 'Start Pro Plan',
      highlighted: true, // 👈 NOW THE MAIN CARD
      comingSoon: false,
    },
    premium: {
      id: 'premium' as const,
      name: 'Premium Plan',
      price: currency === 'USD' ? '$89' : '€89',
      interval: 'month',
      icon: <Sparkles className="h-6 w-6 text-slate-400" />, // less flashy
      description: 'Advanced features for businesses serious about reputation.',
      features: [
        'Everything in Pro Plan',
        'SMS Review Invites',
        'Website Review Widget',
        'Real-time Negative Review Alerts',
        'Monthly Analytics Report (PDF)',
        'Competitor Review Tracking',
        'Priority Phone Support',
        'Custom Branding (remove Rewakely)',
      ],
      ctaText: 'Join Waitlist',
      highlighted: false, // 👈 NOW SECONDARY
      comingSoon: true,
    },
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {Object.values(plans).map((plan) => {
        const isSelected = selectedPlan === plan.id;

        return (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl bg-white p-8 border transition-all duration-300 ${
              plan.highlighted
                ? 'border-blue-500 shadow-xl ring-4 ring-blue-500/10 hover:shadow-2xl' // Pro gets the ring
                : 'border-slate-200 shadow-sm hover:shadow-md' // Premium is subtle
            }`}
            onClick={() => {
              if (!plan.comingSoon) onSelectPlan(plan.id);
            }}
            id={`pricing-card-${plan.id}`}
          >
            {/* ─── BADGE – only for Pro now ───────────────────────────── */}
            {plan.highlighted && (
              <span className="absolute -top-3 right-8 rounded-full bg-blue-600 px-3.5 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-sm">
                Best Value
              </span>
            )}

            {/* ─── HEADER ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 ${
                plan.highlighted ? 'bg-blue-50' : 'bg-slate-50'
              }`}>
                {plan.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
            </div>

            <p className="mt-4 text-xs text-slate-500 leading-relaxed min-h-[40px] font-sans">
              {plan.description}
            </p>

            {/* ─── PRICE ───────────────────────────────────────────────── */}
            <div className="mt-6 flex items-baseline justify-center text-slate-900">
              <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
              <span className="ml-1 text-sm font-semibold text-slate-500">/{plan.interval}</span>
            </div>

            {/* ─── COMING SOON NOTE – only for Premium ──────────────────── */}
            {plan.comingSoon && (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[10px] text-slate-500 font-medium text-center">
                  SMS invites + more features in development
                </p>
              </div>
            )}

            {/* ─── FEATURES ───────────────────────────────────────────── */}
            <ul className="mt-6 space-y-3 flex-1 font-sans">
              {plan.features.map((feature, idx) => {
                const isFuture = plan.comingSoon && idx >= 4;
                return (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className={`h-4 w-4 shrink-0 mt-0.5 ${
                      isFuture ? 'text-slate-300' : 'text-emerald-600'
                    }`} />
                    <span className={`text-sm leading-relaxed ${
                      isFuture ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                      {feature}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* ─── CTA BUTTON ──────────────────────────────────────────── */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (plan.comingSoon) {
                  const event = new CustomEvent('showWaitlist', { 
                    detail: { plan: plan.id } 
                  });
                  window.dispatchEvent(event);
                  return;
                }
                onSelectPlan(plan.id);
              }}
              className={`mt-8 w-full rounded-xl py-3 px-4 text-center text-sm font-bold transition-all duration-150 cursor-pointer ${
                plan.highlighted
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg' // bold button for Pro
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200' // subtle button for Premium
              }`}
              id={`choose-plan-btn-${plan.id}`}
            >
              {plan.comingSoon ? '🔔 Join Waitlist' : isSelected ? 'Proceed to Checkout' : plan.ctaText}
            </button>

            {/* ─── SUBTLE NOTE ────────────────────────────────────────── */}
            {plan.comingSoon && (
              <p className="text-[9px] text-slate-400 mt-2 text-center">
                Get notified when Premium launches
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}