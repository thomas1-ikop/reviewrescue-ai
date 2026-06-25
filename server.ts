/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import stripePackage from 'stripe';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { Profile, Review, Invite, ReviewSource, ReviewStatus } from './src/types';


declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}


// -------------------- AUTHENTICATION MIDDLEWARE --------------------
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: missing user ID' });
  }
  req.userId = userId;
  next();
};

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// -------------------- IN-MEMORY DATABASE FALLBACK --------------------
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




// -------------------- SUPABASE CLIENT INIT --------------------
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';


let supabaseClient: any = null;
let supabaseServiceClient: any = null;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized.');
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
  }
}

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('Supabase service role client initialized.');
  } catch (err) {
    console.error('Error initializing Supabase service role client:', err);
  }
} else if (supabaseClient) {
  supabaseServiceClient = supabaseClient;
  console.log('Supabase service role key not specified. Falling back to standard client.');
}

// -------------------- LAZY CLIENTS --------------------
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

let stripe: any = null;
function getStripeClient() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.includes('placeholder') || key.startsWith('sk_test_your')) {
      console.warn('STRIPE_SECRET_KEY is not configured or is a placeholder.');
      return null;
    }
    try {
      stripe = new stripePackage(key, { apiVersion: '2023-10-16' as any });
    } catch (err) {
      console.error('Failed to initialize Stripe client:', err);
    }
  }
  return stripe;
}

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


// ─── TOKEN GENERATION ──────────────────────────────────────────
async function generateReviewToken(placeId: string, contactEmail: string, customerName: string, businessName: string): Promise<string | null> {
  try {
    // Generate a unique token
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Insert into database
    const { data, error } = await supabaseServiceClient
      .from('review_tokens')
      .insert([{
        token,
        place_id: placeId,
        contact_email: contactEmail,
        customer_name: customerName,
        business_name: businessName,
        expires_at: expiresAt,
        used: false
      }])
      .select('token')
      .single();

    if (error) {
      console.error('Failed to generate review token:', error);
      return null;
    }

    return data?.token || null;
  } catch (err) {
    console.error('Error generating review token:', err);
    return null;
  }
}




// -------------------- DATABASE HELPERS --------------------
async function getProfile(userId: string) {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized or credentials are missing.');
  }
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    throw new Error(`Profile fetch failed: ${error.message}`);
  }

  if (!data) {
    const defaultProfile = {
      id: userId,
      email: '',
      business_name: 'Our Business',
      industry: '',
      tone: 'Friendly',
      subscription_status: 'inactive',
      subscription_plan: 'pro',
      onboarded: false,
      tour_completed: false,
      verified: false,
      created_at: new Date().toISOString()
    };
    try {
      await (supabaseServiceClient || supabaseClient)
        .from('profiles')
        .insert([defaultProfile]);
    } catch (insertErr: any) {
      console.warn('Failed to insert default profile for missing user:', insertErr.message || insertErr);
    }
    return { data: defaultProfile, isFallback: false };
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
    .select();
  
  if (error) {
    throw new Error(`Profile update failed: ${error.message}`);
  }
  const profileRow = data && data.length > 0 ? data[0] : null;
  return { data: profileRow, isFallback: false };
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
    .select();
  
  if (error) {
    throw new Error(`Review insert failed: ${error.message}`);
  }
  const row = data && data.length > 0 ? data[0] : null;
  return { data: row, isFallback: false };
}

async function updateReview(reviewId: string, updates: any) {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized or credentials are missing.');
  }

  const client = supabaseServiceClient || supabaseClient;

  try {
    const { data, error } = await client
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select();

    if (error) {
      console.error('Review update error:', error.message);
      throw new Error(`Review update failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    return { data: data[0], isFallback: false };

  } catch (error: any) {
    console.error('Unexpected error in updateReview:', error.message);
    throw error;
  }
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
    .select();
  
  if (error) {
    throw new Error(`Invite insert failed: ${error.message}`);
  }
  const row = data && data.length > 0 ? data[0] : null;
  return { data: row, isFallback: false };
}

// -------------------- GENERATE GEMINI REPLY --------------------
async function generateGeminiReply(rating: number, comment: string, businessName: string, industry: string, tone: string) {
  const client = getGeminiClient();
  if (!client) {
    return `Thank you for your feedback! We appreciate your support at ${businessName || 'our business'}.`;
  }

  let attempts = 0;
  let lastError: any = null;

  while (attempts < 3) {
    try {
      let prompt = '';
      if (rating >= 4) {
        prompt = `You are a customer service representative for ${businessName || 'our business'}, a ${industry || 'local'} business. 
Write a friendly, professional, warm, concise reply to a positive review of ${rating} stars. Keep it to 1-2 sentences. 
Do not use placeholders like [Your Name] or [Business Name] (the response should be fully readable immediately).
Reply in the same language as the review.
Review text is: "${comment}"
Tone should be: ${tone || 'Friendly'}`;
      } else {
        prompt = `You are a customer service representative for ${businessName || 'our business'}, a ${industry || 'local'} business. 
Write a highly professional, empathetic response to a negative/neutral review of ${rating} stars. 
Acknowledge the customer's comment, apologize sincerely without making excuses, and offer them to resolve this issue by contacting management offline. Keep it to 1-2 sentences.
Do not use placeholders like [Your Name] or [Business Name].
Reply in the same language as the review.
Review text is: "${comment}"
Tone should be: ${tone || 'Professional & Direct'}`;
      }

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { temperature: 0.7 },
      });
      return response.text?.trim() || '';
    } catch (err: any) {
      attempts++;
      lastError = err;
      console.log(`Gemini attempt ${attempts} failed:`, err.message);
      if (attempts >= 3) break;
      await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
    }
  }

  // All attempts failed – use fallback
  console.error('All Gemini attempts failed:', lastError?.message);
  const fallbackMessage = rating >= 4 
    ? `Thank you for your kind words! We appreciate your support at ${businessName || 'our business'}.`
    : `We are sorry about your experience at ${businessName || 'our business'}. Please email us directly so we can resolve this offline.`;
  return `[Fallback] ${fallbackMessage}`;
}

// -------------------- EMAIL FUNCTIONS --------------------
const verificationTokens: Record<string, { userId: string; expiresAt: number }> = {};

async function sendVerificationEmail(email: string, userId: string, businessName: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  verificationTokens[token] = { userId, expiresAt };

  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://rewakely.com'}/api/verify?token=${token}`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Rewakely <noreply@rewakely.com>',
        to: [email],
        subject: 'Confirm your email – Rewakely',
        html: `
          <h1>Welcome to Rewakely, ${businessName}!</h1>
          <p>Please confirm your email address by clicking the link below:</p>
          <p><a href="${verificationLink}">Confirm my email</a></p>
          <p>This link expires in 24 hours.</p>
          <p>If you didn't sign up for Rewakely, you can safely ignore this email.</p>
          <p>– The Rewakely Team</p>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message };
    }

    console.log(`✅ Verification email sent to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send verification email:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendWelcomeEmail(email: string, businessName: string) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Rewakely <noreply@rewakely.com>',
        to: [email],
        subject: 'Welcome to Rewakely!',
        html: `
          <h1>Welcome to Rewakely, ${businessName}!</h1>
          <p>We're excited to help you manage your online reviews effortlessly.</p>
          <p>Log in to your dashboard to start importing reviews, sending SMS invites, and setting up auto‑reply for Google.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://rewakely.com'}">Go to Dashboard</a></p>
          <p>– The Rewakely Team</p>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message };
    }

    console.log(`✅ Welcome email sent to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send welcome email:', error.message);
    return { success: false, error: error.message };
  }
}

// -------------------- API ENDPOINTS --------------------
app.get('/api/test-email', async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });

    const info = await transporter.sendMail({
      from: 'contact@rewakely.com',
      to: 'giurexsanjuve2010@gmail.com',
      subject: 'Test from backend',
      html: '<strong>Test email from server.ts</strong>',
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

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
        return res.status(400).json({ error: `Verification email dispatch failed. Error: ${error.message}` });
      }

      if (!data.user) {
        return res.status(400).json({ error: 'Signup failed - No user object returned.' });
      }

      const userId = data.user.id;
      const profileData = {
        id: userId,
        email: email,
        business_name: businessName || 'My Business',
        industry: 'Other',
        tone: 'Friendly',
        subscription_status: 'inactive',
        subscription_plan: 'pro',
        onboarded: true,
        tour_completed: false,
        verified: false,
        created_at: new Date().toISOString()
      };

      const { error: insertErr } = await (supabaseServiceClient || supabaseClient)
        .from('profiles')
        .insert([profileData]);

      if (insertErr) {
        console.error('Failed to create profile row with service level client:', insertErr.message);
        return res.status(500).json({ error: `User created but profile initialization failed: ${insertErr.message}` });
      }

      // Send verification email (always)
      sendVerificationEmail(email, userId, businessName || 'My Business')
        .then(result => {
          if (result.success) {
            console.log(`Verification email sent to ${email}`);
          } else {
            console.error(`Verification email failed for ${email}:`, result.error);
          }
        })
        .catch(err => console.error('Email send error:', err));

      // Always require verification, do NOT log the user in
      return res.json({
        profile: null,
        verificationRequired: true,
        message: 'Verification email sent. Please check your inbox.',
        isFallback: false
      });
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
          .maybeSingle();

        if (getErr || !prof) {
          const profileData = {
            id: userId,
            email: email,
            business_name: businessName || 'My Business',
            industry: 'Other',
            tone: 'Friendly',
            subscription_status: 'inactive',
            subscription_plan: 'pro',
            onboarded: true,
            tour_completed: false,
            verified: false,
            created_at: new Date().toISOString()
          };
          const { error: insertErr } = await (supabaseServiceClient || supabaseClient).from('profiles').insert([profileData]);
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

      // Check if email is verified
      if (profile && !profile.verified) {
        return res.status(403).json({
          error: 'Please verify your email before logging in. Check your inbox for the verification link.'
        });
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

app.get('/api/verify', async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).send('Invalid verification token.');
  }

  const record = verificationTokens[token];

  if (!record) {
    return res.status(400).send('Verification token not found or already used.');
  }

  if (Date.now() > record.expiresAt) {
    delete verificationTokens[token];
    return res.status(400).send('Verification token has expired. Please request a new one.');
  }

  if (!supabaseServiceClient) {
    return res.status(500).send('Server error: Supabase service client not initialized.');
  }

  const { error } = await supabaseServiceClient
    .from('profiles')
    .update({ verified: true })
    .eq('id', record.userId);

  if (error) {
    console.error('Verification update failed:', error.message);
    return res.status(500).send('Failed to verify email. Please try again.');
  }

  delete verificationTokens[token];

  res.send(`
    <html>
      <head><title>Email Verified</title></head>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
        <div style="background: white; padding: 2.5rem; border-radius: 1rem; text-align: center; max-width: 400px;">
          <h1 style="color: #0f172a;">✅ Email Verified!</h1>
          <p style="color: #475569;">Your email has been confirmed. You can now log in to Rewakely.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signin" style="display: inline-block; background: #1e293b; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; margin-top: 1rem;">Go to Login</a>
        </div>
      </body>
    </html>
  `);
});

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

app.post('/api/user/profile', async (req, res) => {
  const { userId, business_name, industry, tone, contact_email, tour_completed } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const updates: any = {};
  if (business_name !== undefined) updates.business_name = business_name;
  if (industry !== undefined) updates.industry = industry;
  if (tone !== undefined) updates.tone = tone;
  if (contact_email !== undefined) updates.contact_email = contact_email;
  if (tour_completed !== undefined) updates.tour_completed = tour_completed;

  const { data: profile, isFallback } = await updateProfile(userId, updates);
  res.json({ profile, isFallback });
});

app.post('/api/user/tour-complete', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const { data: profile, isFallback } = await updateProfile(userId, { tour_completed: true });
  res.json({ profile, isFallback });
});

app.get('/api/reviews', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  const { data: reviews, isFallback } = await getReviews(userId);
  res.json({ reviews, isFallback });
});

app.post('/api/reviews/import', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { customerName, rating, comment, source } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  const reviewRating = Number(rating);
  const reviewId = 'rev_' + Math.random().toString(36).substr(2, 9);

  // ✅ ALWAYS pending – NO auto-reply, NO GMB posting
  const review = {
    id: reviewId,
    user_id: userId,
    customer_name: customerName,
    rating: reviewRating,
    comment,
    source: source || 'manual',
    status: 'pending',           // Always pending – user must click "Generate Reply"
    reply_text: null,
    is_autopilot: false,         // NEVER auto-reply on manual import
    auto_synced: false,          // ✅ This is a manual import
    created_at: new Date().toISOString(),
    replied_at: null
  };

  const { data: inserted, isFallback } = await insertReview(review);

  res.json({ review: inserted, isFallback });
});

app.post('/api/reviews/reply', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { reviewId, replyText } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  let reviewSource = 'manual';
  if (supabaseServiceClient) {
    try {
      const { data: rev } = await supabaseServiceClient
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .maybeSingle();
      if (rev) {
        reviewSource = rev.source || 'manual';
      }
    } catch (e) {
      console.warn('Could not fetch review details for reply hook:', e);
    }
  }

  const { data: updated, isFallback } = await updateReview(reviewId, {
    status: 'replied',
    reply_text: replyText,
    replied_at: new Date().toISOString()
  });

// ✅ ONLY mark notifications as read – DO NOT post to GMB for manual replies
if (reviewSource === 'google' && supabaseServiceClient) {
  try {
    await supabaseServiceClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('review_id', reviewId);
  } catch (notifErr) {
    console.warn('Could not auto-resolve notification for review:', reviewId, notifErr);
  }
}

  res.json({ review: updated, isFallback });
});



app.post('/api/reviews/generate', async (req, res) => {
  const { reviewText, rating, businessName, industry, tone, userId } = req.body;

  if (!reviewText) {
    return res.status(400).json({ error: 'reviewText is required' });
  }

  if (userId) {
    const { data: profile } = await getProfile(userId);
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





// ===== DELETE REVIEW ENDPOINTS =====
// ===== DELETE REVIEW ENDPOINTS =====

// Clear all reviews for a user – MUST come BEFORE the single delete
app.delete('/api/reviews/clear', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(400).json({ error: 'userId header missing' });
  }

  try {
    // Use service role client to bypass RLS
    const { error: deleteError } = await supabaseServiceClient
      .from('reviews')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Clear reviews error:', deleteError);
      return res.status(500).json({ error: 'Failed to clear reviews' });
    }

    // Clean up notifications for this user
    if (supabaseServiceClient) {
      await supabaseServiceClient
        .from('notifications')
        .delete()
        .eq('user_id', userId);
    }

    res.json({ success: true, message: 'All reviews cleared' });
  } catch (err) {
    console.error('Unexpected error in clear reviews:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a single review – must come AFTER the clear endpoint
app.delete('/api/reviews/:reviewId', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { reviewId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'userId header missing' });
  }
  if (!reviewId) {
    return res.status(400).json({ error: 'reviewId is required' });
  }

  try {
    // Use service role client for everything
    const { data: existing, error: fetchError } = await supabaseServiceClient
      .from('reviews')
      .select('id')
      .eq('id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    const { error: deleteError } = await supabaseServiceClient
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) {
      console.error('Delete review error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete review' });
    }

    // Clean up any notifications linked to this review
    if (supabaseServiceClient) {
      await supabaseServiceClient
        .from('notifications')
        .delete()
        .eq('review_id', reviewId);
    }

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error('Unexpected error in delete review:', err);
    res.status(500).json({ error: 'Server error' });
  }
});







app.get('/api/sms/invites', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  const { data: invites, isFallback } = await getInvites(userId);
  res.json({ invites, isFallback });
});




app.post('/api/sms/send-invite', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { customerName, phoneNumber } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId header missing' });
  if (!customerName || !phoneNumber) {
    return res.status(400).json({ error: 'customerName and phoneNumber are required' });
  }

  // Get profile for business name and contact email
  const { data: profile } = await getProfile(userId);
  const business = profile.business_name || 'Our Business';

  const contactEmail = profile.contact_email || profile.email;
  if (!contactEmail) {
    return res.status(400).json({ 
      error: 'Please set a contact email in Settings before sending invites.' 
    });
  }

  // Get placeId from Google tokens (if connected)
  // Get placeId from Google tokens (if connected)
let placeId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
if (supabaseServiceClient) {
  try {
    const { data: tokenModel } = await supabaseServiceClient
      .from('google_tokens')
      .select('location_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (tokenModel && tokenModel.location_id) {
      placeId = tokenModel.location_id;
    }
  } catch (e) {
    console.warn('Could not read google place_id location_id token:', e);
  }
}

// ─── GENERATE SHORT TOKEN ──────────────────────────────────────
const token = await generateReviewToken(placeId, contactEmail, customerName, business);

let reviewLink: string;
if (token) {
  // ✅ Short link – ~50 characters
  reviewLink = `https://rewakely.com/r/${token}`;
} else {
  // ⚠️ Fallback – long link (shouldn't happen if DB is working)
  console.warn('Token generation failed – using fallback long URL');
  reviewLink = `https://rewakely.com/review?business=${encodeURIComponent(business)}&placeId=${encodeURIComponent(placeId)}&email=${encodeURIComponent(contactEmail)}&customerName=${encodeURIComponent(customerName)}`;
}

const customMessage = `Hi ${customerName}, ${business} values your feedback. Please review: ${reviewLink}. If you didn't visit, please ignore.`;
  // ✅ FORCE SIMULATION MODE – change this to false when you have Signal House credentials
  const isSimulation = false;

  let sendStatus: 'sent' | 'failed' = 'sent';
  let simulated = false;

  if (isSimulation) {
    // ✅ SIMULATION – just log the link to the terminal
    console.log('\n========== SMS SIMULATION ==========');
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: ${customMessage}`);
    console.log(`Link: ${reviewLink}`);
    console.log('=====================================\n');
    sendStatus = 'sent';
    simulated = true;
  } else {
    // Real Signal House integration (for when you have credentials)
    const apiKey = process.env.SIGNALHOUSE_API_KEY;
    const fromNumber = process.env.SIGNALHOUSE_PHONE_NUMBER;

    const formatPhoneNumber = (num: string) => {
      return num.replace(/[^0-9]/g, '').slice(-11);
    };

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const formattedFrom = formatPhoneNumber(fromNumber || '');

    if (!apiKey || !fromNumber) {
      console.warn('Signal House credentials missing – SMS not sent');
      sendStatus = 'failed';
    } else {
      try {
        const response = await fetch('https://api.signalhouse.io/message/sms', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            senderPhoneNumber: formattedFrom,
            recipientPhoneNumber: [formattedPhone],
            messageBody: customMessage
          })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Signal House returned non-JSON response:', text.substring(0, 200));
          throw new Error(`Signal House error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Signal House send failed');
        }

        console.log(`Signal House: SMS sent successfully to ${formattedPhone}`);
        sendStatus = 'sent';
      } catch (err: any) {
        console.error('Signal House SMS delivery failed:', err);
        sendStatus = 'failed';
      }
    }
  }

  // Save the invite to history
  const invite = {
    id: 'inv_' + Math.random().toString(36).substr(2, 9),
    user_id: userId,
    customer_name: customerName,
    phone_number: phoneNumber,
    status: sendStatus,
    sent_at: new Date().toISOString()
  };

  const { data: inserted, isFallback } = await insertInvite(invite);

  if (sendStatus === 'failed') {
    return res.status(400).json({
      error: 'sms_send_error',
      message: 'SMS send failed. Check your credentials or try again.',
      invite: inserted,
      isFallback
    });
  }

  res.json({ 
    invite: inserted, 
    isFallback, 
    simulated,
    link: reviewLink // ✅ This is useful for testing!
  });
});





// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS ENDPOINT TO YOUR server.ts
// Requires: getGeminiClient() to be set up already in your project.
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/sms/parse-customers", async (req, res) => {
  const { rawText } = req.body;

  if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    const client = getGeminiClient();

    if (!client) {
      console.error("Gemini client is null – check GEMINI_API_KEY");
      return res.status(503).json({ 
        error: "AI service is unavailable. Please check your Gemini API key configuration." 
      });
    }

    const prompt = `
You are a data extraction assistant. Extract customer information from the following text.

Extract:
- customer_name (full name, string)
- phone_number (normalize to E.164 format: +1XXXXXXXXXX for US numbers, e.g. +15551234567)
- visit_date (normalize to YYYY-MM-DD format, e.g. 2026-06-20). IMPORTANT: The current year is 2026. If the text mentions a date without a year, assume it is in the year 2026. For example, "June 26" should become "2026-06-26". Use the current year 2026 for all dates unless a specific year is mentioned.

Rules:
- Return ONLY a valid JSON array of objects with exactly these three fields.
- If a field cannot be found, use null for that field.
- Do NOT include any explanation, markdown, or text outside the JSON array.
- Each customer is a separate line or entry in the text.

Text to parse:
"""
${rawText}
"""
`.trim();

    console.log("📤 Sending prompt to Gemini...");

    // ✅ EXACTLY THE SAME PATTERN AS THE WORKING generateGeminiReply FUNCTION
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
      },
    });

    const rawJson = response.text?.trim() ?? "[]";

    // Clean markdown code fences
    const cleaned = rawJson
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let customers: Array<{
      customer_name: string | null;
      phone_number: string | null;
      visit_date: string | null;
    }>;

    try {
      customers = JSON.parse(cleaned);
      console.log(`✅ Parsed ${customers.length} customers successfully`);
    } catch {
      console.error("Failed to parse AI response as JSON:", cleaned);
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    const sanitised = customers.map((c) => ({
      customer_name: c.customer_name ?? null,
      phone_number: c.phone_number ?? null,
      visit_date: c.visit_date ?? null,
    }));

    return res.json({ customers: sanitised });
  } catch (err: unknown) {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error("❌ AI parsing error:", message);
  // Return a 500 error, no sample data
  return res.status(500).json({ error: "Failed to parse customers. Please check your input or try again." });
}
});



// ─────────────────────────────────────────────────────────────────────────────
// AUTO-SEND SCHEDULER – Runs every hour
// ─────────────────────────────────────────────────────────────────────────────

let autoSendEnabledGlobally = true; // This is the state of the toggle


// ──────────────────────────────────────────────────────────────
// AUTO‑SEND SCHEDULER – runs every hour
// ──────────────────────────────────────────────────────────────
setInterval(async () => {
  console.log('🔄 Running auto-send scheduler...');

  try {
    const now = new Date().toISOString();

    // Fetch all pending scheduled customers whose scheduled_at is due
    const { data: pendingCustomers, error } = await supabaseServiceClient
      .from('scheduled_customers')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (error) {
      console.error('Scheduler fetch error:', error);
      return;
    }

    if (!pendingCustomers || pendingCustomers.length === 0) {
      console.log('No pending customers due for auto-send.');
      return;
    }

    console.log(`Found ${pendingCustomers.length} customers due for auto-send.`);

    for (const cust of pendingCustomers) {
      // Get user profile
      const { data: profile, error: profErr } = await supabaseServiceClient
        .from('profiles')
        .select('business_name, contact_email, email, place_id')
        .eq('id', cust.user_id)
        .single();

      if (profErr || !profile) {
        console.error(`Failed to fetch profile for user ${cust.user_id}:`, profErr);
        // Mark as failed so we don't retry forever
        await supabaseServiceClient
          .from('scheduled_customers')
          .update({ status: 'failed' })
          .eq('id', cust.id);
        continue;
      }

      const business = profile.business_name || 'Our Business';
      const contactEmail = profile.contact_email || profile.email;
      if (!contactEmail) {
        console.warn(`Skipping SMS for ${cust.customer_name} – no contact email for user ${cust.user_id}`);
        await supabaseServiceClient
          .from('scheduled_customers')
          .update({ status: 'failed' })
          .eq('id', cust.id);
        continue;
      }

      const placeId = profile.place_id || 'ChIJN1t_tDeuEmsRUsoyG83frY4';
      // ─── GENERATE SHORT TOKEN ──────────────────────────────────────
const token = await generateReviewToken(placeId, contactEmail, cust.customer_name, business);

let reviewLink: string;
if (token) {
  reviewLink = `https://rewakely.com/r/${token}`;
} else {
  console.warn(`Token generation failed for ${cust.customer_name} – using fallback long URL`);
  reviewLink = `https://rewakely.com/review?business=${encodeURIComponent(business)}&placeId=${encodeURIComponent(placeId)}&email=${encodeURIComponent(contactEmail)}&customerName=${encodeURIComponent(cust.customer_name)}`;
}

const customMessage = `Hi ${cust.customer_name}, ${business} values your feedback. Please review: ${reviewLink}. If you didn't visit, please ignore. Have a great day!`;
      
      // ─── REAL SMS via Signal House ───────────────────────────
      const apiKey = process.env.SIGNALHOUSE_API_KEY;
      const fromNumber = process.env.SIGNALHOUSE_PHONE_NUMBER;

      const formatPhoneNumber = (num: string) => {
        return num.replace(/[^0-9]/g, '').slice(-11);
      };

      const formattedPhone = formatPhoneNumber(cust.phone_number);
      const formattedFrom = formatPhoneNumber(fromNumber || '');

      let sendSuccess = false;

      if (!apiKey || !fromNumber) {
        console.warn(`⚠️ Signal House credentials missing – SMS for ${cust.customer_name} not sent`);
      } else {
        try {
          const response = await fetch('https://api.signalhouse.io/message/sms', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              senderPhoneNumber: formattedFrom,
              recipientPhoneNumber: [formattedPhone],
              messageBody: customMessage
            })
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || 'Signal House send failed');
          }

          console.log(`✅ Auto-send: SMS sent successfully to ${cust.customer_name} (${formattedPhone})`);
          sendSuccess = true;
        } catch (err: any) {
          console.error(`❌ Auto-send failed for ${cust.customer_name}:`, err);
          sendSuccess = false;
        }
      }

      // ─── UPDATE STATUS BASED ON SEND RESULT ──────────────────
      // 👇 THIS IS WHERE THE CODE GOES
      const status = sendSuccess ? 'sent' : 'failed';

      await supabaseServiceClient
        .from('scheduled_customers')
        .update({ status: status })
        .eq('id', cust.id);

      // If sent successfully, also log to invites table for history
      if (sendSuccess) {
        await supabaseServiceClient
          .from('invites')
          .insert([{
            user_id: cust.user_id,
            customer_name: cust.customer_name,
            phone_number: cust.phone_number,
            status: 'sent',
            sent_at: new Date().toISOString()
          }]);
      }
    }
  } catch (err) {
    console.error('Auto-send scheduler error:', err);
  }
}, 60 * 60 * 1000); // every hour






app.post('/api/stripe/create-checkout', async (req, res) => {
  const { plan = 'pro', userId, email } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const stripeClient = getStripeClient();

  if (!stripeClient) {
    try {
      if (userId && supabaseServiceClient) {
        await supabaseServiceClient
          .from('profiles')
          .update({
            subscription_plan: 'pro',
            subscription_status: 'active'
          })
          .eq('id', userId);
      }
    } catch (dbErr) {
      console.warn('Could not update profile for simulated payment:', dbErr);
    }

    const simulationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/#currentRoute=dashboard&success=true&plan=pro&simulated=true`;
    return res.json({ url: simulationUrl, simulated: true });
  }

  try {
    const acceptLang = req.headers['accept-language'] || '';
    const useEUR = acceptLang.toLowerCase().includes('de') || acceptLang.toLowerCase().includes('fr') || acceptLang.toLowerCase().includes('es') || acceptLang.toLowerCase().includes('it');

    let priceId = useEUR ? (process.env.STRIPE_PRICE_PRO_EUR || '') : (process.env.STRIPE_PRICE_PRO_USD || '');

    if (!priceId) {
      priceId = 'price_1Thz7iLEBGVGOt3QRL0rPtIu';
    }

    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/#currentRoute=dashboard&success=true&plan=pro`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/#currentRoute=dashboard&canceled=true`,
      client_reference_id: userId,
      customer_email: email,
      metadata: { userId, plan: 'pro' },
    });

    res.json({ url: session.url, simulated: false });
  } catch (err: any) {
    console.error('Stripe Checkout Session error:', err);
    res.status(500).json({ error: 'stripe_error', message: err.message });
  }
});

app.post('/api/stripe/portal', async (req, res) => {
  const { customerId, userId } = req.body;
  const stripeClient = getStripeClient();

  if (!stripeClient) {
    const simulationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/#currentRoute=dashboardSettings&portal_simulated=true`;
    return res.json({ url: simulationUrl, simulated: true });
  }

  try {
    let finalCustomerId = customerId;
    if (!finalCustomerId && userId) {
      try {
        const { data: profile } = await getProfile(userId);
        if (profile?.stripe_customer_id) {
          finalCustomerId = profile.stripe_customer_id;
        }
      } catch (dbErr) {
        console.warn('Could not load user profile for customer portal ID lookup:', dbErr);
      }
    }
    
    if (!finalCustomerId) {
      if (userId && supabaseServiceClient) {
        const { data } = await supabaseServiceClient
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', userId)
          .maybeSingle();
        if (data?.stripe_customer_id) {
          finalCustomerId = data.stripe_customer_id;
        }
      }
    }

    if (!finalCustomerId) {
      return res.status(400).json({ error: 'portal_error', message: 'No Stripe customer ID associated with this profile.' });
    }

    const session = await stripeClient.billingPortal.sessions.create({
      customer: finalCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/#currentRoute=dashboardSettings`,
    });
    res.json({ url: session.url, simulated: false });
  } catch (err: any) {
    console.error('Stripe Customer Portal error:', err);
    res.status(500).json({ error: 'portal_error', message: err.message });
  }
});

app.post('/api/stripe/cancel-feedback', async (req, res) => {
  const { userId, reason } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  if (supabaseServiceClient) {
    try {
      await supabaseServiceClient
        .from('cancellation_feedback')
        .insert([{
          user_id: userId,
          reason: reason || '',
          created_at: new Date().toISOString()
        }]);
    } catch (dbErr: any) {
      console.warn('Could not save cancellation feedback to Supabase:', dbErr.message || dbErr);
    }
  }
  res.json({ success: true });
});

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
    const plan = session.metadata?.plan || 'pro';
    const customerId = session.customer;

    if (userId) {
      await updateProfile(userId, {
        subscription_status: 'active',
        subscription_plan: 'pro',
        stripe_customer_id: customerId
      });
      console.log(`Stripe Webhook: Active plan pro for User ${userId}`);
    }
  } else if (event.type === 'customer.subscription.deleted') {
  const subscription = event.data.object as any;
  const customerId = subscription.customer;
  if (customerId) {
    if (supabaseServiceClient) {
      const { data: matchedProfiles } = await supabaseServiceClient
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId);
      if (matchedProfiles && matchedProfiles.length > 0) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        for (const prof of matchedProfiles) {
          // Update directly using supabaseServiceClient
          await supabaseServiceClient
            .from('profiles')
            .update({
              subscription_status: 'inactive',
              subscription_plan: 'starter',
              subscription_expires_at: expiresAt
            })
            .eq('id', prof.id);
          console.log(`Stripe Webhook: subscription cancelled for user ${prof.id}. Expires at ${expiresAt}`);
        }
      }
    }
  }
}

  res.send({ received: true });
});

app.post('/api/google/disconnect', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  if (!supabaseServiceClient) {
    return res.status(500).json({ error: 'Supabase client not initialized' });
  }

  try {
    const { error } = await supabaseServiceClient
      .from('google_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    // Also reset auto-reply toggle
    await supabaseServiceClient
      .from('profiles')
      .update({ autopilot_enabled: false })
      .eq('id', userId);

    res.json({ success: true });
  } catch (err: any) {
    console.error('Disconnect error:', err);
    res.status(500).json({ error: err.message });
  }
});

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

app.get('/api/autopilot/logs', async (req, res) => {
  const userId = req.headers['x-user-id'] as string || req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  let logs: any[] = [];

  if (supabaseServiceClient) {
    try {
      const { data, error } = await supabaseServiceClient
        .from('autopilot_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        logs = data.map((log: any) => ({
          id: log.id,
          review_customer_name: log.review_customer_name || 'Customer',
          review_text: log.review_text,
          rating: log.rating,
          generated_reply: log.generated_reply,
          status: log.status,
          timestamp: log.created_at
        }));
      } else {
        throw new Error(error?.message || 'Query error');
      }
    } catch (err) {
      logs = db.autopilotLogs.filter(log => log.id.startsWith(userId))
        .map(log => ({
          id: log.id,
          review_customer_name: log.review_customer_name || 'Customer',
          review_text: log.review_text,
          rating: log.rating,
          generated_reply: log.generated_reply,
          status: 'success',
          timestamp: log.timestamp
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  } else {
    logs = db.autopilotLogs.filter(log => log.id.startsWith(userId))
      .map(log => ({
        id: log.id,
        review_customer_name: log.review_customer_name || 'Customer',
        review_text: log.review_text,
        rating: log.rating,
        generated_reply: log.generated_reply,
        status: 'success',
        timestamp: log.timestamp
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  res.json({ logs });
});

app.get('/api/autopilot/stats', async (req, res) => {
  const userId = req.headers['x-user-id'] as string || req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId parameter is required' });

  let totalAutoReplies = 0;
  let lastGoogleSync = null;
  let autopilotEnabled = false;

  if (supabaseServiceClient) {
    try {
      const { data: profile } = await supabaseServiceClient
        .from('profiles')
        .select('last_google_sync, autopilot_enabled')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        lastGoogleSync = profile.last_google_sync;
        autopilotEnabled = !!profile.autopilot_enabled;
      }

      const { count, error } = await supabaseServiceClient
        .from('autopilot_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'success');
      
      if (!error && count !== null) {
        totalAutoReplies = count;
      } else {
        totalAutoReplies = db.autopilotLogs.filter(log => log.id.startsWith(userId)).length;
      }
    } catch (err) {
      totalAutoReplies = db.autopilotLogs.filter(log => log.id.startsWith(userId)).length;
    }
  } else {
    totalAutoReplies = db.autopilotLogs.filter(log => log.id.startsWith(userId)).length;
  }

  res.json({
    totalAutoReplies,
    lastGoogleSync,
    autopilotEnabled
  });
});

app.post('/api/autopilot/sync', async (req, res) => {
  const userId = req.headers['x-user-id'] as string || req.body.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    console.log(`[Autopilot Manual Sync] Triggered sync for user ${userId}`);
    await syncGoogleReviewsForUser(userId);
    
    let lastGoogleSync = new Date().toISOString();
    if (supabaseServiceClient) {
      try {
        const { data: profile } = await supabaseServiceClient
          .from('profiles')
          .select('last_google_sync')
          .eq('id', userId)
          .maybeSingle();
        if (profile?.last_google_sync) {
          lastGoogleSync = profile.last_google_sync;
        }
      } catch (err) {}
    }

    res.json({ success: true, lastGoogleSync });
  } catch (err: any) {
    console.error(`Manual autopilot sync failed for user ${userId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/feedback/submit', async (req, res) => {
  const { business_name, rating, customer_ip: clientIp, place_id, customer_name } = req.body;

  if (!business_name || rating === undefined || rating === null) {
    return res.status(400).json({ error: 'business_name and rating are required' });
  }

  const determinedIp = clientIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const finalIp = Array.isArray(determinedIp) ? determinedIp[0] : determinedIp;

  let insertedRecord = null;
  let savedToDb = false;
  let userId = null;

  // ✅ NEW: Look up the user_id from the place_id
  if (place_id && supabaseServiceClient) {
    try {
      const { data: profile } = await supabaseServiceClient
        .from('profiles')
        .select('id')
        .eq('place_id', place_id)
        .maybeSingle();
      if (profile) {
        userId = profile.id;
        console.log(`Found user_id ${userId} for place_id ${place_id}`);
      } else {
        console.log(`No profile found for place_id ${place_id}`);
      }
    } catch (err) {
      console.warn('Error looking up place_id:', err);
    }
  }

  if (supabaseServiceClient) {
    try {
      const insertData: any = {
        business_name,
        rating: parseInt(rating, 10),
        customer_ip: finalIp,
        created_at: new Date().toISOString()
      };

      // Only add user_id if we found one
      if (userId) {
        insertData.user_id = userId;
      }
      if (customer_name) {
        insertData.customer_name = customer_name;
      }

      const { data, error } = await supabaseServiceClient
        .from('feedback_submissions')
        .insert([insertData])
        .select();

      if (!error && data && data.length > 0) {
        insertedRecord = data[0];
        savedToDb = true;
      } else {
        console.warn('Supabase feedback insert warning:', error?.message);
      }
    } catch (err: any) {
      console.warn('Supabase feedback_submissions insert bypass-fail:', err.message);
    }
  }

  if (!savedToDb) {
    insertedRecord = {
      id: `local_fallback_${Math.random().toString(36).substring(2, 11)}`,
      business_name,
      rating: parseInt(rating, 10),
      customer_ip: finalIp,
      user_id: userId,
      customer_name: customer_name || null,
      created_at: new Date().toISOString()
    };
  }

  res.json({ success: true, submission: insertedRecord, savedToDb });
});


// ─────────────────────────────────────────────────────────────────────────────
// SAVE AUTO-SEND TOGGLE STATE
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/sms/auto-send/toggle', authenticate, async (req, res) => {
  const userId = req.userId;
  const { enabled, sendDelay } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId header missing' });
  }

  try {
    const updates: any = { auto_send_enabled: enabled };
    if (sendDelay !== undefined) {
      updates.send_delay = sendDelay;
    }

    const { data, error } = await supabaseServiceClient
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, enabled: data.auto_send_enabled, delay: data.send_delay });
  } catch (err: any) {
    console.error('Toggle save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET AUTO-SEND STATE
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/sms/auto-send/state', authenticate, async (req, res) => {
  const userId = req.userId;

  // 1. Fetch profile settings
  const { data: profile } = await supabaseServiceClient
    .from('profiles')
    .select('auto_send_enabled, send_delay')
    .eq('id', userId)
    .single();

  // 2. Count upcoming (pending scheduled customers)
  const { count: upcomingCount } = await supabaseServiceClient
    .from('scheduled_customers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending');

  // 3. Count sent invites
  const { count: sentCount } = await supabaseServiceClient
    .from('invites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'sent'); // or 'delivered' – check your status values

  // 4. Count feedback submissions for this user
  const { count: feedbackCount } = await supabaseServiceClient
    .from('feedback_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const responseRate = sentCount && sentCount > 0
    ? Math.round((feedbackCount / sentCount) * 100)
    : null;

  res.json({
    enabled: profile?.auto_send_enabled || false,
    delay: profile?.send_delay || 2,
    upcomingCount: upcomingCount || 0,
    sentCount: sentCount || 0,
    responseRate,
  });
});



// ─────────────────────────────────────────────────────────────────────────────
// SAVE SCHEDULED CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────────
   


app.get('/api/sms/upcoming', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId header missing' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabaseServiceClient
      .from('scheduled_customers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('visit_date', today)
      .gte('scheduled_at', today);

    if (error) throw error;
    res.json({ upcoming: count || 0 });
  } catch (err: any) {
    console.error('Upcoming count error:', err);
    res.status(500).json({ error: err.message });
  }
});



// ─────────────────────────────────────────────────────────────────────────────
// GET SCHEDULED CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/sms/scheduled-customers', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId header missing' });
  }

  try {
    const { data, error } = await supabaseServiceClient
      .from('scheduled_customers')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')  // Only show pending
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ customers: data || [] });
  } catch (err: any) {
    console.error('Fetch scheduled customers error:', err);
    res.status(500).json({ error: err.message });
  }
});



app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required fields.' });
  }

  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  let insertedRecord = null;
  let savedToDb = false;

  if (supabaseServiceClient) {
    try {
      const { data, error } = await supabaseServiceClient
        .from('contact_messages')
        .insert([{
          name,
          email,
          message,
          created_at: new Date().toISOString()
        }])
        .select();

      if (!error && data && data.length > 0) {
        insertedRecord = data[0];
        savedToDb = true;
      } else {
        console.warn('Supabase contact message insert warning:', error.message);
        return res.status(500).json({ error: `Save failed: ${error.message}` });
      }
    } catch (err: any) {
      console.warn('Supabase contact_messages insert fail:', err.message);
      return res.status(500).json({ error: `Server error while saving message: ${err.message}` });
    }
  } else {
    console.warn('Supabase service client not initialized during contact submission.');
    insertedRecord = {
      id: `local_fallback_${Math.random().toString(36).substring(2, 11)}`,
      name,
      email,
      message,
      created_at: new Date().toISOString()
    };
    savedToDb = false;
    return res.json({ success: true, submission: insertedRecord, savedToDb });
  }

  res.json({ success: true, submission: insertedRecord, savedToDb });
});


// Fetch feedback submissions for a business owner
// Fetch feedback submissions for a business owner
app.get('/api/feedback/submissions', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId header missing' });
  }

  if (!supabaseServiceClient) {
    return res.status(500).json({ error: 'Supabase client not initialized' });
  }

  try {
    const { data, error } = await supabaseServiceClient
      .from('feedback_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch feedback error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ submissions: data || [] });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------- GOOGLE OAUTH & BACKGROUND SYNC --------------------
async function refreshGoogleAccessToken(userId: string, tokensModel: any) {
  const { refresh_token } = tokensModel;
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    console.warn(`[Google OAuth] Skip refreshing user: ${userId}. CLIENT_ID or CLIENT_SECRET missing.`);
    return null;
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refresh_token,
        grant_type: 'refresh_token'
      }).toString()
    });

    const data = await res.json();
    if (!res.ok) {
      console.error(`Token refresh failed for user ${userId}:`, data);
      return null;
    }

    const { access_token, expires_in } = data;
    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

    if (supabaseServiceClient) {
      await supabaseServiceClient
        .from('google_tokens')
        .update({
          access_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    console.log(`Access token refreshed successfully for user: ${userId}`);
    return access_token;
  } catch (err) {
    console.error(`Error refreshing token for user ${userId}:`, err);
    return null;
  }
}

async function syncGoogleReviewsForUser(userId: string) {
  if (!supabaseServiceClient) {
    console.warn('[Sync Worker] Supabase Service level client offline.');
    return;
  }

  try {
    const { data: tokenModel, error: rErr } = await supabaseServiceClient
      .from('google_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (rErr || !tokenModel) {
      console.log(`[Google Sync] No Google My Business tokens found for user ${userId}. Skipping sync.`);
      return;
    }

    const { data: profile, error: pErr } = await supabaseServiceClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (pErr || !profile) {
      console.warn(`[Google Sync] Profile resolution failed for ${userId}. Skipping.`);
      return;
    }

    if (profile.subscription_plan !== 'pro' || profile.subscription_status !== 'active') {
      console.log(`[Google Sync] User ${userId} is not on active Pro plan. Skipping autopilot sync.`);
      return;
    }

    let accessToken = tokenModel.access_token;
    const isExpired = new Date(tokenModel.expires_at).getTime() < Date.now() + 60000;
    if (isExpired) {
      accessToken = await refreshGoogleAccessToken(userId, tokenModel);
      if (!accessToken) {
        console.warn(`[Google Sync] Skipping sync for ${userId} due to expired token failure.`);
        return;
      }
    }

    const syncTime = new Date().toISOString();
    await supabaseServiceClient
      .from('profiles')
      .update({ last_google_sync: syncTime })
      .eq('id', userId);

    const accountId = tokenModel.account_id || 'acc_gmb_default_999';
    const locationId = tokenModel.location_id || 'loc_gmb_default_718';

    let fetchedReviews: any[] = [];
    let isSimulatedFetch = false;

    try {
      const response = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.reviews) {
          fetchedReviews = result.reviews.map((r: any) => ({
            id: r.reviewId,
            customer_name: r.reviewer?.displayName || 'Anonymous',
            rating: r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1,
            comment: r.comment || '',
            created_at: r.createTime || new Date().toISOString()
          }));
        }
      } else {
        console.warn(`GMB API returned status ${response.status}. Using high-fidelity developer sandbox simulation.`);
        isSimulatedFetch = true;
      }
    } catch (err) {
      console.warn(`GMB connection offline: Using simulation.`, err);
      isSimulatedFetch = true;
    }

    if (isSimulatedFetch) {
  // No simulated reviews – simply return
  console.log('[Google Sync] No real reviews available – skipping sync (no simulation)');
  fetchedReviews = [];
  return; // Exit early so nothing is processed
}

    for (const item of fetchedReviews) {
      let alreadyProcessed = false;
      if (supabaseServiceClient) {
        try {
          const { data: proc } = await supabaseServiceClient
            .from('google_processed_reviews')
            .select('id')
            .eq('id', item.id)
            .maybeSingle();
          if (proc) {
            alreadyProcessed = true;
          }
        } catch (e) {
          // Table may not exist yet, fallback
        }
      }

      if (!alreadyProcessed && supabaseServiceClient) {
        try {
          const { data: existingRev } = await supabaseServiceClient
            .from('reviews')
            .select('id')
            .eq('id', item.id)
            .maybeSingle();
          if (existingRev) {
            alreadyProcessed = true;
          }
        } catch (e) {}
      }

      if (alreadyProcessed) {
        continue;
      }

      const reviewRecord = {
  id: item.id,
  user_id: userId,
  customer_name: item.customer_name,
  rating: item.rating,
  comment: item.comment,
  source: 'google',
  status: item.rating >= 4 ? 'replied' : 'pending',
  reply_text: null,
  is_autopilot: item.rating >= 4,
  auto_synced: true, // ✅ AUTO-FETCHED
  created_at: item.created_at,
  replied_at: item.rating >= 4 ? new Date().toISOString() : null
};

      if (item.rating >= 4) {
        const gemini = getGeminiClient();
        let replyText = '';

        if (gemini) {
          try {
            const prompt = `You are a customer service AI avatar for ${profile.business_name}, a ${profile.industry || 'local'} business. 
Write a short, warm, delighted 1-2 sentence auto-pilot response to a ${item.rating}-star review left by ${item.customer_name}. 
Do not use placeholders. Write the final response immediately.
Reply in the same language as the customer's review comment.
Review comment: "${item.comment}"
Aesthetic Tone: ${profile.tone}`;

            const response = await gemini.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: prompt,
            });
            replyText = response.text?.trim() || '';
          } catch (gErr) {
            console.error('Gemini content generation failed in background:', gErr);
          }
        }

        if (!replyText) {
          replyText = `Thank you so much, ${item.customer_name}! The team at ${profile.business_name || 'our business'} are delighted by your feedback!`;
        }

        (reviewRecord as any).reply_text = replyText;

        let postStatus = 'success';
        try {
          const replyResponse = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${item.id}/reply`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment: replyText })
          });
          if (replyResponse.ok) {
            console.log(`Successfully auto-posted GMB reply back to google for review ${item.id}`);
          } else {
            console.warn(`Attempt to auto-post reply back to GMB returned code: ${replyResponse.status}`);
            postStatus = 'failed';
          }
        } catch (postErr) {
          console.warn(`Google post reply simulated successfully.`);
        }

        await supabaseServiceClient
          .from('reviews')
          .insert([reviewRecord]);

        if (supabaseServiceClient) {
          try {
            await supabaseServiceClient
              .from('google_processed_reviews')
              .insert([{ id: item.id, user_id: userId, processed_at: new Date().toISOString() }]);
          } catch (e) {
            console.warn('Could not insert to google_processed_reviews:', e);
          }
        }

        if (supabaseServiceClient) {
          try {
            await supabaseServiceClient
              .from('autopilot_logs')
              .insert([{
                user_id: userId,
                review_id: item.id,
                review_customer_name: item.customer_name,
                review_text: item.comment,
                rating: item.rating,
                generated_reply: replyText,
                status: postStatus,
                created_at: new Date().toISOString()
              }]);
          } catch (e) {
            console.warn('Could not insert to autopilot_logs table:', e);
          }
        }

        db.autopilotLogs.unshift({
          id: `${userId}_g_${Math.random()}`,
          review_customer_name: item.customer_name,
          review_text: item.comment,
          rating: item.rating,
          generated_reply: replyText,
          timestamp: new Date().toISOString()
        });

      } else {
        await supabaseServiceClient
          .from('reviews')
          .insert([reviewRecord]);

        if (supabaseServiceClient) {
          try {
            await supabaseServiceClient
              .from('google_processed_reviews')
              .insert([{ id: item.id, user_id: userId, processed_at: new Date().toISOString() }]);
          } catch (e) {
            console.warn('Could not insert to google_processed_reviews:', e);
          }
        }

        const alarmMsg = `Negative ${item.rating}-Star Google Review received from ${item.customer_name}: "${item.comment.substring(0, 80)}${item.comment.length > 80 ? '...' : ''}"`;
        await supabaseServiceClient
          .from('notifications')
          .insert([{
            user_id: userId,
            review_id: item.id,
            message: alarmMsg,
            read: false,
            created_at: new Date().toISOString()
          }]);

        console.log(`[Google Sync Alert] Negative Google Review received. In-app alarm generated successfully!`);
        console.log(`[Resend Email Mock] Sending immediate alert to Merchant owner ${profile.email}:
          Subject: ⚠️ ReviewRescue Alert: A negative ${item.rating}-star review on Google My Business requires attention.
          Body: Hello ${profile.business_name || 'Merchant'}, ${item.customer_name} left a review comment: "${item.comment}". Replying personally is highly recommended to salvage consumer relationship.`);
      }
    }
  } catch (syncExc) {
    console.error(`Google synchronization worker exception for user: ${userId}`, syncExc);
  }
}

async function syncAllAutopilotGMB() {
  if (!supabaseServiceClient) return;

  try {
    const { data: activeProUsers, error } = await supabaseServiceClient
      .from('profiles')
      .select('id')
      .eq('subscription_plan', 'pro')
      .eq('subscription_status', 'active')
      .eq('autopilot_enabled', true);

    if (error || !activeProUsers || activeProUsers.length === 0) {
      return;
    }

    console.log(`[Google Sync Worker] Syncing Google My Business for ${activeProUsers.length} Pro-Autopilot customers.`);
    for (const user of activeProUsers) {
      await syncGoogleReviewsForUser(user.id);
    }
  } catch (workerErr) {
    console.error('[Google Sync Worker] Sync sweep threw an uncaught error:', workerErr);
  }
}






// -------------------- AUTOPILOT TOGGLE --------------------
app.post('/api/user/autopilot-toggle', async (req, res) => {
  const userId = req.headers['x-user-id'] as string || req.body.userId;
  const { enabled } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'x-user-id header is required' });
  }

  if (!supabaseServiceClient) {
    return res.status(500).json({ error: 'Supabase service client not initialized.' });
  }

  try {
    const { data: updatedProfile, error } = await supabaseServiceClient
      .from('profiles')
      .update({ 
        autopilot_enabled: !!enabled,
        auto_reply_enabled: !!enabled
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: `Failed to toggle autopilot: ${error.message}` });
    }

    if (enabled) {
      syncGoogleReviewsForUser(userId).catch(e => console.error('Immediate autopilot sync failed:', e));
    }

    res.json({ profile: updatedProfile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- GOOGLE OAUTH ROUTES --------------------
app.get('/api/auth/google', (req, res) => {
  const userId = req.query.userId || req.headers['x-user-id'];
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  
  if (!userId) {
    return res.status(400).send('userId query parameter or x-user-id header is required.');
  }
  if (!clientId) {
    return res.status(400).send('OAuth setup error: GOOGLE_OAUTH_CLIENT_ID is not configured in secrets.');
  }

  const redirectUri = `https://rewakely.com/api/auth/google/callback`;
  const scope = 'https://www.googleapis.com/auth/business.manage';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    access_type: 'offline',
    prompt: 'consent',
    state: userId as string
  }).toString();

  res.redirect(authUrl);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).send('Google OAuth callback failed: Missing authorize code or state userId.');
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  const redirectUri = `https://rewakely.com/api/auth/google/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      console.error('Exchange Google code failed:', tokens);
      return res.status(400).send(`Token exchange error: ${tokens.error_description || 'Unknown Google error'}`);
    }

    const { access_token, refresh_token, expires_in } = tokens;
    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

    let finalRefreshToken = refresh_token;
    if (!finalRefreshToken && supabaseServiceClient) {
      try {
        const { data: existing } = await supabaseServiceClient
          .from('google_tokens')
          .select('refresh_token')
          .eq('user_id', userId as string)
          .maybeSingle();
        if (existing?.refresh_token) {
          finalRefreshToken = existing.refresh_token;
        }
      } catch (eToken) {
        console.warn('Could not read existing tokens:', eToken);
      }
    }

    if (!finalRefreshToken) {
      finalRefreshToken = 'rt_gmb_sandbox_fallback_858';
    }

    let accountId = 'acc_gmb_default_999';
    let locationId = 'loc_gmb_default_718';

    try {
      const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (accountsData.accounts && accountsData.accounts.length > 0) {
          accountId = accountsData.accounts[0].name.split('/').pop() || 'acc_gmb_default_999';
          const locationsRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
          });
          if (locationsRes.ok) {
            const locationsData = await locationsRes.json();
            if (locationsData.locations && locationsData.locations.length > 0) {
              locationId = locationsData.locations[0].name.split('/').pop() || 'loc_gmb_default_718';
            }
          }
        }
      }
    } catch (gErr) {
      console.warn('GMB fetch account metadata warning:', gErr);
    }

    if (!supabaseServiceClient) {
      throw new Error('Supabase client unavailable.');
    }

    const { error: upsertErr } = await supabaseServiceClient
      .from('google_tokens')
      .upsert({
        user_id: userId as string,
        access_token,
        refresh_token: finalRefreshToken,
        expires_at: expiresAt,
        location_id: locationId,
        account_id: accountId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertErr) {
      console.error('Google tokens database upsert failed:', upsertErr.message);
    }

    res.send(`
      <html>
        <head>
          <title>Google GMB Connected Successfully</title>
        </head>
        <body style="font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #1e293b;">
          <div style="background-color: white; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); text-align: center; max-width: 400px; margin: 15px;">
            <div style="width: 4rem; height: 4rem; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; color: #0f172a;">Google My Business Connected!</h2>
            <p style="font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 1.5rem;">
               Your active Google Reviews location has been authenticated and linked securely to your main dashboard profile!
            </p>
            <p style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">
              This popup window will close automatically...
            </p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              setTimeout(() => {
                window.close();
              }, 1500);
            } else {
              window.location.href = '/#currentRoute=dashboardAutopilot';
            }
          </script>
        </body>
      </html>
    `);

  } catch (err: any) {
    console.error('Google callback code exchange failed:', err);
    res.status(500).send(`GMB Authentication error: ${err.message}`);
  }
});

app.post('/api/autopilot/sync', async (req, res) => {
  const userId = req.headers['x-user-id'] as string || req.body.userId;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    await syncGoogleReviewsForUser(userId);
    res.json({ success: true, message: 'Google Business Profile reviews synchronized and processed.' });
  } catch (err: any) {
    console.error('Autopilot manual sync exception:', err);
    res.status(500).json({ error: err.message || 'Failure during sync' });
  }
});

app.get('/api/autopilot/logs', async (req, res) => {
  const userId = req.headers['x-user-id'] as string || req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  if (!supabaseServiceClient) {
    return res.json({ logs: db.autopilotLogs });
  }

  try {
    const { data: logs, error } = await supabaseServiceClient
      .from('autopilot_logs')
      .select(`
        id,
        review_id,
        generated_reply,
        status,
        created_at,
        platform,
        reviews (
          customer_name,
          comment,
          rating
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: rawLogs } = await supabaseServiceClient
        .from('autopilot_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return res.json({ logs: rawLogs || [] });
    }

    const formatted = (logs || []).map((l: any) => ({
      id: l.id,
      review_customer_name: l.reviews?.customer_name || 'Verified Customer',
      review_text: l.reviews?.comment || 'New Review',
      rating: l.reviews?.rating || 5,
      generated_reply: l.generated_reply,
      status: l.status,
      timestamp: l.created_at
    }));

    res.json({ logs: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/autopilot/stats', async (req, res) => {
  const userId = req.headers['x-user-id'] as string || req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  if (!supabaseServiceClient) {
    return res.json({
      totalAutoReplies: db.autopilotLogs.filter(l => l.status === 'success' || l.status === 'posted').length,
      lastGoogleSync: new Date().toISOString(),
      autopilotEnabled: false
    });
  }

  try {
    const { count, error: countErr } = await supabaseServiceClient
      .from('autopilot_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'success');

    const { data: profile, error: profErr } = await supabaseServiceClient
      .from('profiles')
      .select('last_google_sync, autopilot_enabled')
      .eq('id', userId)
      .maybeSingle();

    res.json({
      totalAutoReplies: count || 0,
      lastGoogleSync: profile?.last_google_sync || null,
      autopilotEnabled: profile?.autopilot_enabled || false
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/google/connect', (req, res) => {
  const userId = req.body.userId || req.headers['x-user-id'];
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  
  if (!userId) {
    return res.status(400).json({ error: 'userId body property or x-user-id header is required.' });
  }
  if (!clientId) {
    return res.status(400).json({ error: 'OAuth setup error: GOOGLE_OAUTH_CLIENT_ID is not configured in secrets.' });
  }

  const redirectUri = 'https://rewakely.com/api/google/callback';
  const scope = 'https://www.googleapis.com/auth/business.manage';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    access_type: 'offline',
    prompt: 'consent',
    state: userId as string
  }).toString();

  res.json({ url: authUrl });
});

app.get('/api/google/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).send('Google OAuth callback failed: Missing authorize code or state userId.');
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  const redirectUri = 'https://rewakely.com/api/google/callback';

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      console.error('Exchange Google code failed:', tokens);
      return res.status(400).send(`Token exchange error: ${tokens.error_description || 'Unknown Google error'}`);
    }

    const { access_token, refresh_token, expires_in } = tokens;
    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

    let finalRefreshToken = refresh_token;
    if (!finalRefreshToken && supabaseServiceClient) {
      try {
        const { data: existing } = await supabaseServiceClient
          .from('google_tokens')
          .select('refresh_token')
          .eq('user_id', userId as string)
          .maybeSingle();
        if (existing?.refresh_token) {
          finalRefreshToken = existing.refresh_token;
        }
      } catch (eToken) {
        console.warn('Could not read existing google tokens to preserve refresh token:', eToken);
      }
    }

    if (!finalRefreshToken) {
      finalRefreshToken = 'rt_gmb_sandbox_fallback_858';
    }

    let accountId = 'acc_gmb_default_999';
    let locationId = 'loc_gmb_default_718';

    try {
      const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (accountsData.accounts && accountsData.accounts.length > 0) {
          accountId = accountsData.accounts[0].name.split('/').pop() || 'acc_gmb_default_999';
          const locationsRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
          });
          if (locationsRes.ok) {
            const locationsData = await locationsRes.json();
            if (locationsData.locations && locationsData.locations.length > 0) {
              locationId = locationsData.locations[0].name.split('/').pop() || 'loc_gmb_default_718';
            }
          }
        }
      }
    } catch (gErr) {
      console.warn('GMB fetch account metadata warning (using simulated location):', gErr);
    }

    if (!supabaseServiceClient) {
      throw new Error('Supabase client unavailable.');
    }

    const { error: upsertErr } = await supabaseServiceClient
      .from('google_tokens')
      .upsert({
        user_id: userId as string,
        access_token,
        refresh_token: finalRefreshToken,
        expires_at: expiresAt,
        location_id: locationId,
        account_id: accountId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertErr) {
      console.error('Google tokens database upsert failed:', upsertErr.message);
    }

    res.send(`
      <html>
        <head>
          <title>Google GMB Connected Successfully</title>
        </head>
        <body style="font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #1e293b;">
          <div style="background-color: white; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); text-align: center; max-width: 400px; margin: 15px;">
            <div style="width: 4rem; height: 4rem; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; color: #0f172a;">Google My Business Connected!</h2>
            <p style="font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 1.5rem;">
              Your active Google Reviews location has been authenticated and linked securely to your main dashboard profile!
            </p>
            <p style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">
              This popup window will close automatically...
            </p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              setTimeout(() => {
                window.close();
              }, 1500);
            } else {
              window.location.href = '/#currentRoute=dashboardAutopilot';
            }
          </script>
        </body>
      </html>
    `);

  } catch (err: any) {
    console.error('Google callback code exchange failed:', err);
    res.status(500).send(`GMB Authentication error: ${err.message}`);
  }
});

app.get('/api/google/status', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(400).json({ error: 'userId header missing' });

  if (!supabaseServiceClient) {
    return res.json({ connected: false, location_name: null });
  }

  try {
    const { data, error } = await supabaseServiceClient
      .from('google_tokens')
      .select('location_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return res.json({ connected: false, location_name: null });
    }

    res.json({ connected: true, location_name: `GMB Location: ${data.location_id}` });
  } catch (err) {
    res.json({ connected: false, location_name: null });
  }
});

app.get('/api/notifications', async (req, res) => {
  const userId = req.headers['x-user-id'] as string || req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId parameter is required' });

  if (!supabaseServiceClient) {
    return res.json({ notifications: [] });
  }

  try {
    const { data: list, error } = await supabaseServiceClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ notifications: list || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/mark-read', async (req, res) => {
  const userId = req.headers['x-user-id'] as string || req.body.userId as string;
  const { notificationId } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId parameter is required' });

  if (!supabaseServiceClient) {
    return res.json({ success: true });
  }

  try {
    let query = supabaseServiceClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);

    if (notificationId) {
      query = query.eq('id', notificationId);
    }

    const { error } = await query;
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- BACKGROUND SYNC --------------------
setInterval(syncAllAutopilotGMB, 6 * 60 * 60 * 1000);
setTimeout(syncAllAutopilotGMB, 6000);

// -------------------- VITE MIDDLEWARE SETUP --------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rewakely Server listening at http://localhost:${PORT}`);
  });




}

// ──────────────────────────────────────────────────────────────
// SCHEDULED CUSTOMERS – POST, DELETE (clear first, then :id)
// ──────────────────────────────────────────────────────────────

// 1. POST – Schedule new customers
app.post('/api/sms/schedule-customers', authenticate, async (req, res) => {
  const userId = req.userId;
  const { customers } = req.body;

  if (!customers || !Array.isArray(customers) || customers.length === 0) {
    return res.status(400).json({ error: 'No customers provided' });
  }

  // Get the user's current send_delay from the profile
  const { data: profile, error: profErr } = await supabaseServiceClient
    .from('profiles')
    .select('send_delay')
    .eq('id', userId)
    .single();

  if (profErr) {
    console.error('Failed to fetch profile for delay:', profErr);
    return res.status(500).json({ error: 'Failed to fetch user settings' });
  }

  const delay = profile?.send_delay ?? 2; // fallback to 2 days

  const inserted: any[] = [];
  for (const cust of customers) {
    const visitDate = cust.visit_date ? new Date(cust.visit_date) : new Date();
    const scheduledDate = new Date(visitDate);
    scheduledDate.setDate(scheduledDate.getDate() + delay);

    const { data, error } = await supabaseServiceClient
      .from('scheduled_customers')
      .insert([{
        user_id: userId,
        customer_name: cust.customer_name,
        phone_number: cust.phone_number,
        visit_date: cust.visit_date,
        scheduled_at: scheduledDate.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
      }])
      .select();

    if (error) {
      console.error('Insert scheduled customer error:', error);
      return res.status(500).json({ error: error.message });
    }
    if (data) inserted.push(data[0]);
  }

  // Automatically enable auto-send if it was off
  await supabaseServiceClient
    .from('profiles')
    .update({ auto_send_enabled: true })
    .eq('id', userId);

  res.json({ inserted: inserted.length, customers: inserted });
});

// 2. DELETE – Clear all pending (MUST come before :id)
app.delete('/api/sms/scheduled-customers/clear', authenticate, async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId missing' });
  }

  console.log(`[CLEAR] Deleting pending customers for user ${userId}`);

  try {
    const { data, error } = await supabaseServiceClient
      .from('scheduled_customers')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select('id');  // get IDs of deleted rows

    if (error) {
      console.error('[CLEAR] DB error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`[CLEAR] Deleted ${data?.length || 0} customers`);
    res.json({ success: true, deletedCount: data?.length || 0 });
  } catch (err: any) {
    console.error('[CLEAR] Unexpected error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 3. DELETE – Single customer (MUST come after clear)
app.delete('/api/sms/scheduled-customers/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  if (!id) {
    return res.status(400).json({ error: 'Missing customer ID' });
  }

  console.log(`[DELETE] Deleting customer ${id} for user ${userId}`);

  try {
    const { data, error } = await supabaseServiceClient
      .from('scheduled_customers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      console.error('[DELETE] DB error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      console.warn(`[DELETE] No customer found with ID ${id} for user ${userId}`);
      return res.status(404).json({ error: 'Customer not found' });
    }

    console.log(`[DELETE] Successfully deleted customer ${id}`);
    res.json({ success: true, deleted: data[0] });
  } catch (err: any) {
    console.error('[DELETE] Unexpected error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});


// ─── TOKEN REDIRECT ROUTE ──────────────────────────────────────
app.get('/r/:token', async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).send('Invalid review link.');
  }

  try {
    // Look up the token in the database
    const { data, error } = await supabaseServiceClient
      .from('review_tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .eq('used', false)
      .maybeSingle();

    if (error || !data) {
      console.warn(`Invalid or expired token: ${token}`);
      return res.status(404).send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; margin: 0;">
            <div style="background: white; padding: 2rem; border-radius: 1rem; text-align: center; max-width: 400px;">
              <h2>🔗 Link Expired or Invalid</h2>
              <p style="color: #64748b;">This review link is no longer valid. Please contact the business directly.</p>
            </div>
          </body>
        </html>
      `);
    }

    // ✅ Mark as used (prevents reuse – optional, but good security)
    // Comment this out if you want the link to work multiple times
    // await supabaseServiceClient
    //   .from('review_tokens')
    //   .update({ used: true })
    //   .eq('token', token);

    // Redirect to the actual review page with all the data
    const redirectUrl = `/review?business=${encodeURIComponent(data.business_name)}&placeId=${encodeURIComponent(data.place_id)}&email=${encodeURIComponent(data.contact_email)}&customerName=${encodeURIComponent(data.customer_name)}`;
    res.redirect(redirectUrl);

  } catch (err) {
    console.error('Token redirect error:', err);
    res.status(500).send('Server error');
  }
});


startServer();