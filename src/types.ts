/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  id: string;
  email: string;
  business_name: string;
  industry: string;
  tone: string;
  subscription_status: 'active' | 'inactive';
  subscription_plan: 'starter' | 'growth' | 'pro';
  onboarded: boolean;
  stripe_customer_id?: string | null;
  created_at?: string;
}

export type ReviewSource = 'google' | 'yelp' | 'facebook' | 'manual';
export type ReviewStatus = 'pending' | 'replied';

export interface Review {
  id: string;
  user_id: string;
  customer_name: string;
  rating: number; // 1-5
  comment: string;
  source: ReviewSource;
  status: ReviewStatus;
  reply_text?: string | null;
  is_autopilot: boolean;
  created_at: string;
  replied_at?: string | null;
}

export interface Invite {
  id: string;
  user_id: string;
  customer_name: string;
  phone_number: string;
  status: 'sent' | 'delivered' | 'failed';
  sent_at: string;
}

export interface AutopilotLog {
  id: string;
  review_customer_name: string;
  review_text: string;
  rating: number;
  generated_reply: string;
  timestamp: string;
}

export interface OnboardingData {
  business_name: string;
  industry: string;
  tone: string;
}
