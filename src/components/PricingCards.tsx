/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, Flame, MessageSquareHeart, Zap } from 'lucide-react';

interface PricingCardsProps {
  onSelectPlan: (plan: 'starter' | 'growth' | 'pro') => void;
  selectedPlan?: 'starter' | 'growth' | 'pro' | null;
  currency: 'USD' | 'EUR';
}

export default function PricingCards({ onSelectPlan, selectedPlan, currency }: PricingCardsProps) {
  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
      price: currency === 'USD' ? '$29' : '€29',
      interval: 'month',
      icon: <Zap className="h-6 w-6 text-slate-600" />,
      description: 'Ideal for small brick-and-mortar stores initiating their reputation journey.',
      features: [
        '50 AI Replies / month',
        'Manual Review Import Form',
        'Auto Language Translation',
        'Friendly/Professional Tone Modifiers',
        'Clean Review Management Table',
      ],
      notIncluded: [
        'SMS Customer Invites',
        'Negative Feedback Alerts',
        'Google My Business Auto-Pilot',
        'Google Profile OAuth Integration',
      ],
      ctaText: 'Start with Starter',
      highlighted: false,
    },
    {
      id: 'growth' as const,
      name: 'Growth',
      price: currency === 'USD' ? '$49' : '€49',
      interval: 'month',
      icon: <Flame className="h-6 w-6 text-blue-600" />,
      description: 'Accelerate review generation with SMS invitations and instant notifications.',
      features: [
        '200 AI Replies / month',
        'Everything in Starter',
        'SMS Review Collector (Form + List)',
        'Negative Review Alerts (Instant in-app)',
        'Invite status tracker (Sent, Delivery status)',
        'Customer satisfaction analytics',
      ],
      notIncluded: [
        'Google My Business Auto-Pilot',
        'Google Profile OAuth Integration',
      ],
      ctaText: 'Go for Growth',
      highlighted: true,
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: currency === 'USD' ? '$99' : '€99',
      interval: 'month',
      icon: <MessageSquareHeart className="h-6 w-6 text-emerald-600" />,
      description: 'Hands-free reputation automation. Full autopilot powered by Gemini AI.',
      features: [
        'Unlimited AI Replies (Unlimited Quota)',
        'Everything in Growth',
        'GMB Autopilot Mode (Auto-post 4-5 stars)',
        'Real Google Reviews Sync simulation',
        'Manual override log for Autopilot',
        'Instant SMS & email alerts override',
        'Priority 24/7 client rescue support',
      ],
      notIncluded: [],
      ctaText: 'Rescue with Pro',
      highlighted: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3 xl:gap-10">
      {plans.map((plan) => {
        const isSelected = selectedPlan === plan.id;
        return (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl bg-white p-8 border ${
              plan.highlighted 
                ? 'border-blue-600 shadow-md ring-2 ring-blue-600/10' 
                : 'border-slate-200 shadow-sm'
            } transition-all duration-300 hover:shadow-md cursor-pointer`}
            onClick={() => onSelectPlan(plan.id)}
            id={`pricing-card-${plan.id}`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 right-8 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white uppercase tracking-wider">
                Popular
              </span>
            )}
            
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${plan.highlighted ? 'bg-blue-100/50' : 'bg-slate-100'}`}>
                {plan.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
            </div>
            
            <p className="mt-4 text-sm text-slate-500 leading-relaxed min-h-[40px]">
              {plan.description}
            </p>
            
            <div className="mt-6 flex items-baseline text-slate-900">
              <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
              <span className="ml-1 text-sm font-semibold text-slate-500">/{plan.interval}</span>
            </div>

            <ul className="mt-8 space-y-4 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="text-sm text-slate-600">{feature}</span>
                </li>
              ))}
              {plan.notIncluded.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 opacity-40">
                  <div className="h-2 w-2 rounded-full bg-slate-400 mt-2 shrink-0 ml-1.5" />
                  <span className="text-sm text-slate-400 line-through">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectPlan(plan.id);
              }}
              className={`mt-8 w-full rounded-xl py-3 px-4 text-center text-sm font-semibold transition-all duration-150 ${
                plan.highlighted
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : isSelected
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-800 text-white hover:bg-slate-900'
              }`}
              id={`choose-plan-btn-${plan.id}`}
            >
              {isSelected ? 'Preselected' : plan.ctaText}
            </button>
          </div>
        );
      })}
    </div>
  );
}
