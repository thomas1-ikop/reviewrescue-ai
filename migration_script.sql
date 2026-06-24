-- Migration Script for Google My Business Auto-Pilot
-- Run this in the Supabase SQL Editor:

-- 1. Add autopilot_enabled and auto_reply_enabled column and last_google_sync to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_google_sync TIMESTAMPTZ;

-- 2. Create google_tokens table
CREATE TABLE IF NOT EXISTS public.google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  location_id TEXT,
  account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create autopilot_logs table
CREATE TABLE IF NOT EXISTS public.autopilot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id TEXT REFERENCES public.reviews(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('google', 'yelp', 'manual')),
  generated_reply TEXT,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create notifications table for negative review alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id TEXT REFERENCES public.reviews(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. Establish exact access control policies
DROP POLICY IF EXISTS "Users can view own tokens" ON public.google_tokens;
CREATE POLICY "Users can view own tokens" ON public.google_tokens 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tokens" ON public.google_tokens;
CREATE POLICY "Users can insert own tokens" ON public.google_tokens 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own autopilot_logs" ON public.autopilot_logs;
CREATE POLICY "Users can view own autopilot_logs" ON public.autopilot_logs 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own autopilot_logs" ON public.autopilot_logs;
CREATE POLICY "Users can insert own autopilot_logs" ON public.autopilot_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Add contact_email to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN DEFAULT false;

-- 8. Create feedback_submissions table
CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  customer_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on feedback_submissions for compliance (bypassed by service_role)
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback submissions" ON public.feedback_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can select feedback submissions" ON public.feedback_submissions FOR SELECT USING (true);


-- 9. Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on contact_messages for compliance (bypassed by service_role)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can select contact messages" ON public.contact_messages FOR SELECT USING (true);


-- 10. Create cancellation_feedback table
CREATE TABLE IF NOT EXISTS public.cancellation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on cancellation_feedback for compliance
ALTER TABLE public.cancellation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert cancellation feedback" ON public.cancellation_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can select cancellation feedback" ON public.cancellation_feedback FOR SELECT USING (true);


