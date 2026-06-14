/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import stripePackage from 'stripe';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
console.log('Loaded SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('Loaded SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);


// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// --- IN-MEMORY DATABASE FALLBACK (for offline, sandbox or missing SQL tables) ---
interface InMemDB {
  profiles: any[];
  reviews: any[];
  invites: any[];
  autopilotLogs: any[];
}

const db: InMemDB = {
  profiles: [],
  reviews: [],
  invites: [],
  autopilotLogs: []
};

// Seed an initial demo profile if we use memory fallback, but let's keep it empty by default
// so it remains clean as requested

// Initialize Supabase Client
// Initialize Supabase Client – use service role for write operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
  || process.env.SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL 
  || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  || process.env.SUPABASE_ANON_KEY 
  || process.env.VITE_SUPABASE_ANON_KEY 
  || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseClient: any = null;
let supabaseAdmin: any = null; // for writes

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized.');
    
    // Create admin client if service key exists
    if (supabaseServiceKey && !supabaseServiceKey.includes('placeholder')) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      console.log('Supabase admin client initialized (bypasses RLS).');
    } else {
      console.warn('No service role key – some write operations may fail RLS.');
    }
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
  }
}


// Lazy Initialize Gemini API Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes('MY_GEMINI_API_KEY')) {
      console.warn('GEMINI_API_KEY is not configured or is a placeholder.');
      return null;
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Lazy Initialize Stripe Client
let stripe: any = null;
function getStripeClient() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.includes('placeholder') || key.startsWith('sk_test_your')) {
      console.warn('STRIPE_SECRET_KEY is not configured or is a placeholder.');
      return null;
    }
    try {
      stripe = new stripePackage(key, { apiVersion: '2026-05-27' as any });
    } catch (err) {
      console.error('Failed to initialize Stripe client:', err);
    }
  }
  return stripe;
}

// Lazy Initialize Twilio Client
let twilioClient: any = null;
function getTwilio() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token || sid.includes('your_sid') || token.includes('your_token')) {
      return null;
    }
    try {
      twilioClient = twilio(sid, token);
    } catch (err) {
      console.error('Failed to initialize Twilio client:', err);
    }
  }
  return twilioClient;
}

// --- DATABASE ACCESS HELPERS WITH NO FAKE FALLBACKS ---
async function getProfile(userId: string) {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized or credentials are missing.');
  }
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    throw new Error(`Profile fetch failed: ${error.message}`);
  }
  return { data, isFallback: false };
}

async function updateProfile(userId: string, updates: any) {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized or credentials are missing.');
  }
  const { data, error } = await supabaseClient
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Profile update failed: ${error.message}`);
  }
  return { data, isFallback: false };
}

async function getReviews(userId: string) {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized or credentials are missing.');
  }
  const { data, error } = await supabaseClient
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Reviews fetch failed: ${error.message}`);
  }
  return { data, isFallback: false };
}

async function insertReview(review: any) {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized or credentials are missing.');
  }
  const { data, error } = await supabaseClient
    .from('reviews')
    .insert([review])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Review insert failed: ${error.message}`);
  }
  return { data, isFallback: false };
}

async function updateReview(reviewId: string, updates: any) {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized or credentials are missing.');
  }
  const { data, error } = await supabaseClient
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Review update failed: ${error.message}`);
  }
  return { data, isFallback: false };
}

async function getInvites(userId: string) {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized or credentials are missing.');
  }
  const { data, error } = await supabaseClient
    .from('invites')
    .select('*')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false });
  
  if (error) {
    throw new Error(`Invites fetch failed: ${error.message}`);
  }
  return { data, isFallback: false };
}

async function insertInvite(invite: any) {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized or credentials are missing.');
  }
  const { data, error } = await supabaseClient
    .from('invites')
    .insert([invite])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Invite insert failed: ${error.message}`);
  }
  return { data, isFallback: false };
}


// --- API ENDPOINTS ---

// Get DB Setup Connection Status Checklist
app.get('/api/health-check', async (req, res) => {
  const isSupabaseConfigured = !!supabaseClient;
  const isGeminiConfigured = !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY');
  const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder') && !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_your');
  const isTwilioConfigured = !!process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('your_sid');

  res.json({
    supabase: isSupabaseConfigured ? 'connected' : 'missing_or_invalid',
    gemini: isGeminiConfigured ? 'ready' : 'missing_key',
    stripe: isStripeConfigured ? 'ready' : 'missing_key',
    twilio: isTwilioConfigured ? 'ready' : 'missing_key',
    database_fallback: isSupabaseConfigured ? 'inactive' : 'active_local_fallback'
  });
});

// Authenticate / Fetch Profile (Using real Supabase auth signUp / signInWithPassword)
app.post('/api/user/auth', async (req, res) => {
  const { email, password, businessName, action, manualUserId } = req.body;

  if (!supabaseClient) {
    return res.status(500).json({ error: 'Supabase client is not initialized or credentials are missing.' });
  }

  try {
    if (action === 'signup') {
      if (!email || !password || !businessName) {
        return res.status(400).json({ error: 'Email, password, and business name are required' });
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!data.user) {
        return res.status(400).json({ error: 'Signup failed - No user object returned.' });
      }

      const userId = data.user.id;
      const profileData = {
        id: userId,
        email: email,
        business_name: businessName,
        industry: '',
        tone: 'Friendly',
        subscription_status: 'inactive',
        subscription_plan: 'starter',
        onboarded: false,
        created_at: new Date().toISOString()
      };

      if (!supabaseAdmin) {
  throw new Error('Service role key missing – cannot create profile');
}
const { error: insertErr } = await supabaseAdmin
  .from('profiles')
  .insert([profileData]);

      if (insertErr) {
        console.error('Failed to create profile row:', insertErr.message);
        return res.status(500).json({ error: `User created but profile initialization failed: ${insertErr.message}` });
      }

      return res.json({ profile: profileData, isFallback: false });
    }

    if (action === 'signin') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      if (!data.user) {
        return res.status(401).json({ error: 'Login failed - No user object returned.' });
      }

      const userId = data.user.id;
      let profile;
      try {
        const { data: prof, error: getErr } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (getErr && getErr.code === 'PGRST116') {
          const profileData = {
            id: userId,
            email: email,
            business_name: businessName || '',
            industry: '',
            tone: 'Friendly',
            subscription_status: 'inactive',
            subscription_plan: 'starter',
            onboarded: false,
            created_at: new Date().toISOString()
          };
          if (!supabaseAdmin) {
  throw new Error('Service role key missing – cannot create profile');
}
const { error: insertErr } = await supabaseAdmin.from('profiles').insert([profileData]);
          if (insertErr) {
            return res.status(500).json({ error: `Failed to initialize missing profile: ${insertErr.message}` });
          }
          profile = profileData;
        } else if (getErr) {
          return res.status(500).json({ error: `Failed to fetch profile row: ${getErr.message}` });
        } else {
          profile = prof;
        }
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }

      return res.json({ profile, isFallback: false });
    }

    if (manualUserId) {
      const { data: profile, isFallback } = await getProfile(manualUserId);
      return res.json({ profile, isFallback });
    }

    return res.status(400).json({ error: 'Invalid user action' });
  } catch (err: any) {
    console.error('Auth endpoint execution failure:', err);
    return res.status(500).json({ error: err.message || 'Server Auth Failure' });
  }
});

// Update Onboarding
app.post('/api/user/onboarding', async (req, res) => {
  const { userId, businessName, industry, tone } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const { data: profile, isFallback } = await updateProfile(userId, {
    business_name: businessName,
    industry,
    tone,
    onboarded: true
  });
  res.json({ profile, isFallback });
});

// Update Profile Custom Setup
app.post('/api/user/profile', async (req, res) => {
  const { userId, business_name, industry, tone } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const updates: any = {};
  if (business_name !== undefined) updates.business_name = business_name;
  if (industry !== undefined) updates.industry = industry;
  if (tone !== undefined) updates.tone = tone;

  const { data: profile, isFallback } = await updateProfile(userId, updates);
  res.json({ profile, isFallback });
});

// List reviews
app.get('/api/reviews', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  const { data: reviews, isFallback } = await getReviews(userId);
  res.json({ reviews, isFallback });
});

// Import manual review
app.post('/api/reviews/import', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { customerName, rating, comment, source } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  // For starter plan, reviews are capped. But let's check profile plan first
  const { data: profile } = await getProfile(userId);

  const review = {
    id: 'rev_' + Math.random().toString(36).substr(2, 9),
    user_id: userId,
    customer_name: customerName,
    rating: Number(rating),
    comment,
    source: source || 'manual',
    status: 'pending',
    is_autopilot: false,
    created_at: new Date().toISOString()
  };

  const { data: inserted, isFallback } = await insertReview(review);
  res.json({ review: inserted, isFallback });
});

// Save AI response or Edit response manually
app.post('/api/reviews/reply', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { reviewId, replyText } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  const { data: updated, isFallback } = await updateReview(reviewId, {
    status: 'replied',
    reply_text: replyText,
    replied_at: new Date().toISOString()
  });

  res.json({ review: updated, isFallback });
});

// Generate AI Reply using Gemini
app.post('/api/reviews/generate', async (req, res) => {
  const { reviewText, rating, businessName, industry, tone, userId } = req.body;

  if (!reviewText) {
    return res.status(400).json({ error: 'reviewText is required' });
  }

  // Quota control check
  if (userId) {
    const { data: profile } = await getProfile(userId);
    // Let's assume an in-memory quota tracking or profile attribute tracking
    // Starter: 50 limit. Growth: 200 limit. Pro: Unlimited.
    // We can simulate decrementing or keeping track.
    // Let's fetch comments generated this month
    const { data: reviews } = await getReviews(userId);
    const repliedCount = reviews.filter((r: any) => r.status === 'replied' && !r.is_autopilot).length;
    
    if (profile.subscription_plan === 'starter' && repliedCount >= 50) {
      return res.status(403).json({ error: 'starter_quota_exceeded', message: "You've reached your Starter plan quota of 50 AI generations this month. Upgrade to Growth for 200/mo." });
    }
    if (profile.subscription_plan === 'growth' && repliedCount >= 200) {
      return res.status(403).json({ error: 'growth_quota_exceeded', message: "You've reached your Growth plan quota of 200 AI generations this month. Upgrade to Pro for unlimited." });
    }
  }

  const client = getGeminiClient();
  if (!client) {
    // Elegant fallback reply if Gemini is offline
    const fallbackMessage = rating >= 4 
      ? `Thank you for your warm words! We appreciate your support at ${businessName || 'our business'} and hope to see you again soon.`
      : `We are genuinely sorry about your experience at ${businessName || 'our business'}. Please email us directly so we can resolve this offline.`;
    return res.json({ replyText: `[Fallback Mode: Key Missing] ${fallbackMessage}` });
  }

  try {
    let prompt = '';
    if (rating >= 4) {
      prompt = `You are a customer service representative for ${businessName || 'our business'}, a ${industry || 'local'} business. 
Write a friendly, professional, warm, concise reply to a positive review of ${rating} stars. Keep it to 1-2 sentences. 
Do not use placeholders like [Your Name] or [Business Name] (the response should be fully readable immediately).
Reply in the same language as the review.
Review text is: "${reviewText}"
Tone should be: ${tone || 'Friendly'}`;
    } else {
      prompt = `You are a customer service representative for ${businessName || 'our business'}, a ${industry || 'local'} business. 
Write a highly professional, empathetic response to a negative/neutral review of ${rating} stars. 
Acknowledge the customer's comment, apologize sincerely without making excuses, and offer them to resolve this issue by contacting management offline. Keep it to 1-2 sentences.
Do not use placeholders like [Your Name] or [Business Name].
Reply in the same language as the review.
Review text is: "${reviewText}"
Tone should be: ${tone || 'Professional & Direct'}`;
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    res.json({ replyText: response.text?.trim() });
  } catch (err: any) {
    console.error('Gemini generateContent failure:', err);
    res.status(500).json({ error: 'Gemini service failed', message: err.message });
  }
});

// List SMS Invites
app.get('/api/sms/invites', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  const { data: invites, isFallback } = await getInvites(userId);
  res.json({ invites, isFallback });
});

// Send SMS Invite (Growth & Pro)
app.post('/api/sms/send-invite', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { customerName, phoneNumber } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId header missing' });
  if (!customerName || !phoneNumber) {
    return res.status(400).json({ error: 'customerName and phoneNumber are required' });
  }

  const { data: profile } = await getProfile(userId);
  
  // Custom message creation
  const business = profile.business_name || 'Our Business';
  const customMessage = `Hi ${customerName}, ${business} values your feedback. Please leave a review here: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/thank-you?business=${encodeURIComponent(business)}`;

  let twilioStatus: 'sent' | 'failed' = 'sent';

  const twClient = getTwilio();
  if (twClient) {
    try {
      await twClient.messages.create({
        body: customMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      console.log(`Twilio: Real SMS sent to ${phoneNumber}`);
    } catch (err) {
      console.error('Twilio SMS delivery failed:', err);
      twilioStatus = 'failed';
    }
  } else {
    // Simulate SMS sending and log it
    console.log(`[Twilio Simulation Mode] SMS Sent!
To: ${phoneNumber}
From: ${process.env.TWILIO_PHONE_NUMBER || '+15551234567'}
Message: ${customMessage}`);
  }

  const invite = {
    id: 'inv_' + Math.random().toString(36).substr(2, 9),
    user_id: userId,
    customer_name: customerName,
    phone_number: phoneNumber,
    status: twilioStatus,
    sent_at: new Date().toISOString()
  };

  const { data: inserted, isFallback } = await insertInvite(invite);
  res.json({ invite: inserted, isFallback, simulated: !twClient });
});

// Stripe Create Checkout Session
app.post('/api/stripe/create-checkout', async (req, res) => {
  const { plan, userId, email } = req.body;

  if (!plan || !userId) {
    return res.status(400).json({ error: 'plan and userId are required' });
  }

  const stripeClient = getStripeClient();

  if (!stripeClient) {
    return res.status(400).json({ error: 'stripe_not_configured', message: 'Stripe integration is currently not configured or active on the server. Please check active Environment Settings.' });
  }

  try {
    // Detect Currency: Toggle between price IDs in USD or EUR based on request
    const acceptLang = req.headers['accept-language'] || '';
    const useEUR = acceptLang.toLowerCase().includes('de') || acceptLang.toLowerCase().includes('fr') || acceptLang.toLowerCase().includes('es') || acceptLang.toLowerCase().includes('it');

    let priceId = '';
    if (plan === 'starter') {
      priceId = useEUR ? (process.env.STRIPE_PRICE_STARTER_EUR || '') : (process.env.STRIPE_PRICE_STARTER_USD || '');
    } else if (plan === 'growth') {
      priceId = useEUR ? (process.env.STRIPE_PRICE_GROWTH_EUR || '') : (process.env.STRIPE_PRICE_GROWTH_USD || '');
    } else if (plan === 'pro') {
      priceId = useEUR ? (process.env.STRIPE_PRICE_PRO_EUR || '') : (process.env.STRIPE_PRICE_PRO_USD || '');
    }

    if (!priceId) {
      // fallback in case price ID env is empty
      priceId = plan === 'starter' ? 'price_1Thz7ILEBGVGOt3QdPF7lGtr' : plan === 'growth' ? 'price_1ThyxmLEBGVGOt3QK7tPuXSF' : 'price_1Thz7iLEBGVGOt3QRL0rPtIu';
    }

    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/#currentRoute=dashboard&success=true&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/#currentRoute=dashboard&canceled=true`,
      client_reference_id: userId,
      customer_email: email,
      metadata: { userId, plan },
    });

    res.json({ url: session.url, simulated: false });
  } catch (err: any) {
    console.error('Stripe Checkout Session error:', err);
    res.status(500).json({ error: 'stripe_error', message: err.message });
  }
});

// Stripe Portal
app.post('/api/stripe/portal', async (req, res) => {
  const { customerId, userId } = req.body;
  const stripeClient = getStripeClient();

  if (!stripeClient) {
    return res.status(400).json({ error: 'stripe_not_configured', message: 'Stripe integration is currently not configured or active on the server.' });
  }

  try {
    const session = await stripeClient.billingPortal.sessions.create({
      customer: customerId || 'cus_sample_id_123',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/#currentRoute=dashboardSettings`,
    });
    res.json({ url: session.url, simulated: false });
  } catch (err: any) {
    console.error('Stripe Customer Portal error:', err);
    res.status(500).json({ error: 'portal_error', message: err.message });
  }
});

// Stripe Webhook Endpoint
app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripeClient = getStripeClient();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeClient || !sig || !endpointSecret) {
    return res.status(400).send('Webhook config missing or Stripe client disabled');
  }

  let event;
  try {
    event = stripeClient.webhooks.constructEvent((req as any).rawBody || JSON.stringify(req.body), sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata?.userId || session.client_reference_id;
    const plan = session.metadata?.plan || 'starter';
    const customerId = session.customer;

    if (userId) {
      await updateProfile(userId, {
        subscription_status: 'active',
        subscription_plan: plan,
        stripe_customer_id: customerId
      });
      console.log(`Stripe Webhook: Active plan ${plan} for User ${userId}`);
    }
  }

  res.send({ received: true });
});

// Simulating Real Time review ingestion for Autopilot (Google, Yelp, Facebook)
app.post('/api/reviews/simulate-google', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  const { data: profile } = await getProfile(userId);
  if (profile.subscription_plan !== 'pro') {
    return res.status(403).json({ error: 'plan_insufficient', message: 'Simulated Google reviews feed is a Pro Plan exclusive feature.' });
  }

  const reviewSims = [
    { name: "Sven G.", rating: 5, comment: "I loved the client treatment at this establishment. Everything was clean, swift, and highly premium!", source: 'google' },
    { name: "Lucia M.", rating: 3, comment: "The service was quite slow, despite the product quality being alright. Hope they speed up next time.", source: 'google' },
    { name: "Marcus Aurelius", rating: 5, comment: "Absolutely incredible! The team at this spot has outdone themselves. Five stars!", source: 'google' },
    { name: "Devin K.", rating: 2, comment: "Did not meet expectations. The staff seemed distracted and the tone was completely direct.", source: 'google' },
  ];

  const addedReviews: any[] = [];
  for (const sim of reviewSims) {
    const r = {
      id: 'rev_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      customer_name: sim.name,
      rating: sim.rating,
      comment: sim.comment,
      source: sim.source,
      status: 'pending',
      is_autopilot: false,
      created_at: new Date().toISOString()
    };
    const { data: inserted } = await insertReview(r);
    addedReviews.push(inserted);
  }

  res.json({ reviews: addedReviews });
});

// Create list of autopilot logs
app.get('/api/autopilot/logs', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  const logs = db.autopilotLogs.filter(log => log.id.startsWith(userId))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({ logs });
});

// --- AUTOPILOT ACTIVE BACKGROUND LOOP (Checks for Autopilot trigger on Pro Users in Supabase) ---
setInterval(async () => {
  if (!supabaseClient) return;

  try {
    // Fetch active pro profiles that have onboarded
    const { data: activeProProfiles, error: profErr } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('subscription_plan', 'pro')
      .eq('subscription_status', 'active')
      .eq('onboarded', true);

    if (profErr || !activeProProfiles) return;

    for (const profile of activeProProfiles) {
      // Find unreplied reviews of 4-5 stars for this user
      const { data: pendingReviews, error: revErr } = await supabaseClient
        .from('reviews')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'pending')
        .gte('rating', 4);

      if (revErr || !pendingReviews || pendingReviews.length === 0) continue;
      
      for (const review of pendingReviews) {
        console.log(`[Auto-Pilot Pro Triggered] Auto-replying to Review from ${review.customer_name} (${review.rating} Stars)...`);
        
        const client = getGeminiClient();
        let replyText = '';
        if (client) {
          try {
            const prompt = `You are a customer service AI avatar for ${profile.business_name}, a ${profile.industry || 'local'} business. 
Write a short, warm, delighted 1-2 sentence auto-pilot response to a 5-star review left by ${review.customer_name}. 
Do not use placeholders. Write the final response immediately.
Reply in the same language as the customer's review comment.
Review comment: "${review.comment}"
Aesthetic Tone: ${profile.tone}`;
            const response = await client.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: prompt,
            });
            replyText = response.text?.trim() || '';
          } catch (err) {
            console.error('Autopilot Gemini call failed:', err);
          }
        }

        if (!replyText) {
          replyText = `Thank you so much, ${review.customer_name}! The team at ${profile.business_name} are delighted by your feedback!`;
        }

        // Update review to Replied
        await supabaseClient
          .from('reviews')
          .update({
            status: 'replied',
            reply_text: replyText,
            is_autopilot: true,
            replied_at: new Date().toISOString()
          })
          .eq('id', review.id);

        // Log autopilot activity
        db.autopilotLogs.unshift({
          id: `${profile.id}_${Math.random()}`,
          review_customer_name: review.customer_name,
          review_text: review.comment,
          rating: review.rating,
          generated_reply: replyText,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error('Background autopilot execution failed:', err);
  }
}, 25000); // Poll every 25 seconds


// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production modes
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReviewRescue AI Server listening at http://localhost:${PORT}`);
  });
}

startServer();
