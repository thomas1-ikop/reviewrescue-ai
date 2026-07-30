// src/lib/plans.ts

export type Plan = 'basic' | 'pro' | 'premium';

export const PLAN_ORDER = ['basic', 'pro', 'premium'];

export const PLAN_FEATURES: Record<Plan, string[]> = {
  basic: [
    'ai_replies',
    'dashboard',
    'email_invites',
    'manual_import',
    'support'
  ],
  pro: [
    'ai_replies',
    'dashboard',
    'email_invites',
    'manual_import',
    'support',
    'google_auto_reply',
    'qr_codes',
    'feedback_collection',
    'zapier'
  ],
  premium: [
    'ai_replies',
    'dashboard',
    'email_invites',
    'manual_import',
    'support',
    'google_auto_reply',
    'qr_codes',
    'feedback_collection',
    'zapier',
    'sms_invites',
    'widget',
    'insights',
    'competitor',
    'whitelabel',
    'alerts',
    'pdf_reports',
    'templates',
    'team'
  ]
};

/**
 * Check if a user has a specific feature
 */
export const hasFeature = (plan: Plan | null | undefined, feature: string): boolean => {
  if (!plan) return false;
  return PLAN_FEATURES[plan]?.includes(feature) || false;
};

/**
 * Check if a user's plan is at least the required plan
 */
export const isAtLeast = (plan: Plan | null | undefined, requiredPlan: Plan): boolean => {
  if (!plan) return false;
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(requiredPlan);
};

/**
 * Get the display name for a plan
 */
export const getPlanName = (plan: Plan | null | undefined): string => {
  if (!plan) return 'Free';
  const names: Record<Plan, string> = {
    basic: 'Basic',
    pro: 'Pro',
    premium: 'Premium'
  };
  return names[plan] || 'Free';
};

/**
 * Get the price for a plan
 */
export const getPlanPrice = (plan: Plan | null | undefined, currency: 'USD' | 'EUR' = 'USD'): string => {
  if (!plan) return currency === 'USD' ? '$0' : '€0';
  const prices: Record<Plan, { USD: string; EUR: string }> = {
    basic: { USD: '$19', EUR: '€19' },
    pro: { USD: '$49', EUR: '€49' },
    premium: { USD: '$89', EUR: '€89' }
  };
  return prices[plan]?.[currency] || (currency === 'USD' ? '$0' : '€0');
};