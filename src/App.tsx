/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Calendar } from 'lucide-react';


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Smartphone, Settings, Shield, Activity, LogOut, ArrowRight, ArrowLeft, Lock, 
  CheckCircle2, Zap, Check, ExternalLink, HelpCircle, ShieldCheck, HeartCrack, 
  MessageSquare, Star, Sparkles, LogIn, UserPlus, Info, RefreshCw, ThumbsUp, ThumbsDown, XCircle, CheckCircle, MapPin, Eye, EyeOff
} from 'lucide-react';

import Logo from './components/Logo';
import PricingCards from './components/PricingCards';
import SmsTour from './components/SmsTour';
import OnboardingModal from './components/OnboardingModal';
import ReviewInvitesView from './components/ReviewInvitesView';
import WaitlistModal from './components/WaitlistModal';
import ReviewsView from './components/ReviewsView';
import SMSCollector from './components/SMSCollector';
import SettingsView from './components/SettingsView';
import AutopilotPanel from './components/AutopilotPanel';
import OnboardingTour from './components/OnboardingTour';
import PublicReviewView from './components/PublicReviewView';
import ContactModal from './components/ContactModal';
import { Profile, Review, Invite, ReviewSource } from './types';
import DashboardLayout from './components/DashboardLayout';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import SupportView from './components/SupportView';
import AnimatedTour from './components/AnimatedTour';
import ResetPasswordView from './components/ResetPasswordView';
import ConfirmModal from './components/ConfirmModal';
import FeedbackView from './components/FeedbackView';
import { supabaseClient } from './lib/supabaseClient';


export default function App() {
  // Navigation & Route State
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
  const path = window.location.pathname;
  if (path === '/review' || path.startsWith('/review/')) {
    return 'review';
  }
  if (path === '/privacy') {
    return 'privacy';
  }
  if (path === '/terms') {
    return 'terms';
  }
   if (path === '/reset-password') {
    return 'reset-password';
  }
  return 'landing';
});
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication State
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusinessName, setAuthBusinessName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showSmsTour, setShowSmsTour] = useState(false);

  const [showWaitlist, setShowWaitlist] = useState(false);

  
  // Logged-in User Context
  const [user, setUser] = useState<Profile | null>(null);
  const [isFallbackDb, setIsFallbackDb] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // Business Reviews & Invites Storage State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);


const smsTourSteps = [
  {
    id: 'sms-intro',
    title: '📱 Send Review Invites',
    description: 'Collect more reviews automatically. Send SMS invites to customers after their visit.',
    image: '📱',
    target: '#tour-sidebar-sms', // highlights the SMS tab in sidebar
  },
  {
    id: 'sms-manual',
    title: '✉️ Manual Send',
    description: 'Send a one-off invite instantly. Enter a customer name and phone number, then click "Send Invite".',
    image: '✉️',
    target: '.manual-send-section',
  },
  {
    id: 'sms-autosend',
    title: '🤖 Auto-Send',
    description: 'Automatically send invites X days after a visit. Toggle it ON, set your delay, and let the system do the work.',
    image: '🤖',
    target: '.auto-send-section',
  },
  {
    id: 'sms-import',
    title: '📥 Import Customers',
    description: 'Paste your customer list or upload a file. AI will extract names, phones, and visit dates automatically.',
    image: '📥',
    target: '.customer-importer',
  },
  {
    id: 'sms-confirm',
    title: '✅ Confirm & Activate',
    description: 'Review your imported customers, then click "Confirm & Activate". Auto-send will start automatically.',
    image: '✅',
    target: '.confirm-activate-btn',
  },
];


  // Confirmation Modal State
const [confirmModal, setConfirmModal] = useState<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  onConfirm: () => {},
  isDestructive: false
});
  
  // Dashboard alerts (e.g. 1-3 star alerts)
  const [negativeAlerts, setNegativeAlerts] = useState<string[]>([]);
  
  // Developer Container health state
  const [containerHealth, setContainerHealth] = useState({
    supabase: 'loading',
    gemini: 'loading',
    stripe: 'loading',
    twilio: 'loading',
    database_fallback: 'loading'
  });
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  // Modal Wizard controlling Onboarding Modal
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isOnboardingSaving, setIsOnboardingSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Onboarding Tour State
  const [showTour, setShowTour] = useState(false);

  // Contact Modal State
  const [showContactModal, setShowContactModal] = useState(false);

  // Toast / System Notification banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'warn' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  // Check backend credentials status
  const fetchContainerHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const res = await fetch('/api/health-check');
      const data = await res.json();
      setContainerHealth(data);
      setIsFallbackDb(data.database_fallback === 'active_local_fallback');
    } catch (err) {
      console.warn('Sandbox background is loading, utilizing standard visual fallbacks');
    } finally {
      setIsLoadingHealth(false);
    }
  };


  // ─── WAITLIST MODAL EVENT LISTENER ──────────────────────────────────────
useEffect(() => {
  const handler = () => setShowWaitlist(true);
  window.addEventListener('showWaitlist', handler);
  return () => window.removeEventListener('showWaitlist', handler);
}, []);

useEffect(() => {
  const handler = () => setShowWaitlist(true);
  window.addEventListener('upgradeToPremium', handler);
  return () => window.removeEventListener('upgradeToPremium', handler);
}, []);

  // Sync state with address hash routing, perfect for sandbox refreshing
  useEffect(() => {
  // ===== NEW: Restore user from localStorage on page refresh =====
  const storedUser = localStorage.getItem('reviewrescue_user');


   // ✅ SKIP AUTO-LOGIN FOR PUBLIC ROUTES
  const publicRoutes = ['privacy', 'terms', 'review', 'reset-password'];
  if (publicRoutes.includes(currentRoute)) {
    return; // Don't auto-login on public pages
  }


  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      // Immediately set the user to avoid the "logged out" flash
      setUser(parsed);
      setCurrentRoute('dashboard');
      
      // Then fetch the latest profile from the database (gets updated subscription, contact_email, etc.)
      fetch('/api/user/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualUserId: parsed.id })
      })
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            setUser(data.profile);
            localStorage.setItem('reviewrescue_user', JSON.stringify(data.profile));
          } else {
            // If the API doesn't return a profile, the user might have been deleted – log them out
            localStorage.removeItem('reviewrescue_user');
            setUser(null);
            setCurrentRoute('landing');
          }
        })
        .catch(err => {
          console.error('Failed to refresh user profile:', err);
          // Keep the stored user as fallback
        });
    } catch (err) {
      console.error('Failed to parse stored user:', err);
      localStorage.removeItem('reviewrescue_user');
      setUser(null);
    }
  }

  // Check backend credentials status (doesn't require auth)
  fetchContainerHealth();

  // ===== Keep the existing hash handling for Stripe redirects =====
  const handleUrlHashRedirects = () => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.substring(hash.indexOf('?') + 1));
    
    const routeParam = params.get('currentRoute');
    if (routeParam) {
      setCurrentRoute(routeParam);
    }

    const successUpgrade = params.get('success') === 'true';
    const updatedPlan = params.get('plan');
    if (successUpgrade && updatedPlan) {
      const storedUser = localStorage.getItem('reviewrescue_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        fetch('/api/user/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: parsed.email, manualUserId: parsed.id })
        })
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            setUser(data.profile);
            localStorage.setItem('reviewrescue_user', JSON.stringify(data.profile));
            if (data.profile.subscription_status === 'active') {
              triggerToast(`✔ Workspace Upgraded! License plan set to "${updatedPlan.toUpperCase()}" successfully.`, 'success');
            } else {
              triggerToast(`Payment received! Verifying license tier securely...`, 'info');
            }
          }
        });
      }
      window.location.hash = '#currentRoute=dashboard';
    }
  };

  handleUrlHashRedirects();
  window.addEventListener('hashchange', handleUrlHashRedirects);
  return () => window.removeEventListener('hashchange', handleUrlHashRedirects);
}, []);

  // Fetch feedback and invitations records once authenticated
  const fetchDashboardData = async (userId: string) => {
    setIsLoadingReviews(true);
    setIsLoadingInvites(true);
    try {
      // 1. Reviews
      const revRes = await fetch('/api/reviews', {
        headers: { 'x-user-id': userId }
      });
      const revData = await revRes.json();
      if (revData.reviews) {
        setReviews(revData.reviews);
        
        // Scan for negative alerts (rating 1-3)
        // Only show alerts for Google reviews (auto-synced), not manual imports
// ✅ NEW CODE – ONLY ALERTS FOR AUTO-SYNCED NEGATIVE REVIEWS
const bad = revData.reviews.filter((r: Review) => r.rating <= 3 && r.status === 'pending' && r.auto_synced === true);
if (bad.length > 0) {
  setNegativeAlerts(bad.map((b: Review) => `Alert: Negative review left by ${b.customer_name} (${b.rating} Stars!)`));
} else {
  setNegativeAlerts([]);
}
      }

      // 2. SMS Feedback invites
      const invRes = await fetch('/api/sms/invites', {
        headers: { 'x-user-id': userId }
      });
      const invData = await invRes.json();
      if (invData.invites) {
        setInvites(invData.invites);
      }
    } catch (err) {
      console.warn('Offline mock tables active');
    } finally {
      setIsLoadingReviews(false);
      setIsLoadingInvites(false);
    }
  };

  useEffect(() => {
    const hash = window.location.hash || '';
    const query = window.location.search || '';
    if (hash.includes('access_token') || hash.includes('type=verify') || query.includes('type=verify') || query.includes('verify')) {
      triggerToast('✔ Email confirmed successfully! You can now log into your account.', 'success');
      setCurrentRoute('signin');
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData(user.id);
      // Auto-poll logs in background for lively demonstrations
      const interval = setInterval(() => {
        fetchDashboardData(user.id);
      }, 10000); 
      return () => clearInterval(interval);
    }
  }, [user?.id]);


/// ─── SMS TOUR TRIGGER ──────────────────────────────────────
useEffect(() => {
  if (currentRoute === 'sms' && user) {
    const tourCompleted = localStorage.getItem('sms_tour_completed');
    if (!tourCompleted && !showTour && !showOnboarding) {
      console.log('✅ Showing SMS tour!');
      setShowSmsTour(true);
    }
  } else {
    setShowSmsTour(false);
  }
}, [currentRoute, user, showTour, showOnboarding]);

  // Onboarding Tour trigger & handler
  useEffect(() => {
    if (
      user && 
      user.onboarded && 
      user.subscription_status === 'active' && 
      !showOnboarding && 
      currentRoute !== 'landing' && 
      currentRoute !== 'signup' && 
      currentRoute !== 'signin'
    ) {
      if (!user.tour_completed) {
        setShowTour(true);
      }
    } else {
      setShowTour(false);
    }
  }, [user, showOnboarding, currentRoute]);

  const handleTourComplete = async () => {
    setShowTour(false);
    if (!user) return;
    try {
      const updatedUser: Profile = { ...user, tour_completed: true };
      setUser(updatedUser);
      localStorage.setItem('reviewrescue_user', JSON.stringify(updatedUser));

      await fetch('/api/user/tour-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
    } catch (err) {
      console.warn('Failed to persist tour completion to DB.');
    }
  };


  // Authentication Handlers
  const handleAuthSubmit = async (action: 'signup' | 'signin') => {
    if (!authEmail || !authPassword) {
      setAuthError('Email and Password are required');
      return;
    }
    if (action === 'signup' && !authBusinessName) {
      setAuthError('Please specify your Business Name');
      return;
    }

    if (action === 'signup' && !acceptedTerms) {
    setAuthError('Please accept the Terms of Service and Privacy Policy to continue.');
    return;
  }

    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/user/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          businessName: authBusinessName,
          action
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.verificationRequired) {
          triggerToast('Check your email to confirm your account. Confirm the link, then log in.', 'success');
          setAuthBusinessName('');
          setAuthPassword('');
          setAuthError('Check your email to confirm your account. Once verified, you may sign in below. It could take up to 1 minute to send. Check your spam folder.');
          setCurrentRoute('signin');
          return;
        }

        if (data.profile) {
          setUser(data.profile);
          localStorage.setItem('reviewrescue_user', JSON.stringify(data.profile));
          
          // Check if onboarding modal wizard is required
          if (!data.profile.onboarded) {
            setShowOnboarding(true);
          } else {
            setCurrentRoute('dashboard');
          }
          triggerToast(`Success: Signed in as ${data.profile.email}`, 'success');
        }
      } else {
        setAuthError(data.error || 'Authentication failed, please verify credentials or connection settings.');
      }
    } catch (err: any) {
      console.error('System connection failure:', err);
      setAuthError('Connection failure: Please verify Supabase active credentials in Secrets panel.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('reviewrescue_user');
    setReviews([]);
    setInvites([]);
    setNegativeAlerts([]);
    setCurrentRoute('landing');
    triggerToast('Logged out of Rewakely systems.', 'info');
  };

  // Wizard Onboarding Complete Save
  const handleOnboardingSave = async (data: any) => {
    if (!user) return;
    setIsOnboardingSaving(true);
    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          businessName: data.business_name,
          industry: data.industry,
          tone: data.tone
        })
      });
      const back = await res.json();
      
      let updatedUser = user;
      if (back.profile) {
        updatedUser = back.profile;
      } else {
        // Fallback local memory save
        updatedUser = {
          ...user,
          business_name: data.business_name,
          industry: data.industry,
          tone: data.tone,
          onboarded: true
        };
      }

      // Check if user entered an initial review and import it
      if (data.initialReview) {
        await handleImportReview({
          customerName: data.initialReview.customer,
          rating: data.initialReview.rating,
          comment: data.initialReview.comment,
          source: 'manual'
        });
      }

      setUser(updatedUser);
      localStorage.setItem('reviewrescue_user', JSON.stringify(updatedUser));
      setShowOnboarding(false);
      setCurrentRoute('dashboard');
      triggerToast('💼 Profile voice set up perfectly. Welcome aboard!', 'success');
    } catch (err) {
      console.error(err);
      setShowOnboarding(false);
      setCurrentRoute('dashboard');
    } finally {
      setIsOnboardingSaving(false);
    }
  };

  // Manual Review Import
  const handleImportReview = async (reviewData: { customerName: string; rating: number; comment: string; source: ReviewSource }) => {
  if (!user) return;
  try {
    const res = await fetch('/api/reviews/import', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify(reviewData)
    });
    const data = await res.json();
    if (data.review) {
      setReviews(prev => [data.review, ...prev]);
      triggerToast(`Review for ${reviewData.customerName} imported.`, 'success');
      // ✅ REMOVED the negative alert block
    }
  } catch (err) {
    console.error(err);
  }
};

  // Generate Reply with Gemini AI
  const handleGenerateReplyResponse = async (review: Review): Promise<string | null> => {
    if (!user) return null;
    try {
      const res = await fetch('/api/reviews/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.comment,
          rating: review.rating,
          businessName: user.business_name || 'Our establishment',
          industry: user.industry || 'Business Cafe',
          tone: user.tone || 'Friendly',
          userId: user.id
        })
      });
      
      if (res.status === 403) {
        const errorData = await res.json();
        throw new Error(errorData.message);
      }

      const data = await res.json();
      return data.replyText || '';
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // publish/save customized AI Reply
  const handlePublishReply = async (reviewId: string, replyText: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ reviewId, replyText })
      });
      const data = await res.json();
      if (data.review) {
        setReviews(prev => prev.map(r => r.id === reviewId ? data.review : r));
        triggerToast('Reply logged and saved as "Replied" state.', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send review collection text invitation
  const handleSendFeedbackInvite = async (customerName: string, phoneNumber: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/sms/send-invite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id 
        },
        body: JSON.stringify({ customerName, phoneNumber })
      });
      const data = await res.json();
      if (res.ok && data.invite) {
        setInvites(prev => [data.invite, ...prev]);
        triggerToast(`Invitation sent to ${customerName}.`, 'success');
      } else {
        const errMsg = data.error || data.message || 'Twilio SMS dispatch failed.';
        triggerToast(errMsg, 'warn');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to dispatch text invitation.', 'warn');
    }
  };


{currentRoute === 'verify-email' && (
  <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
    <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-8 shadow-2xl text-center">
      <div className="text-5xl mb-4">📧</div>
      <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
      <p className="text-slate-500 mt-2">
        We've sent a verification link to <strong>{authEmail}</strong>.
        Click the link to confirm your account, then log in.
      </p>
      <p className="text-xs text-slate-400 mt-6">
        Didn't receive the email? Check your spam folder or <button className="text-blue-600 hover:underline">click here to resend</button>.
      </p>
      <button 
        onClick={() => setCurrentRoute('signin')}
        className="mt-6 w-full rounded-xl bg-slate-800 text-white py-2.5 text-sm font-semibold hover:bg-slate-900 transition"
      >
        Go to Login
      </button>
    </div>
  </div>
)}





  // Create Stripe Checkout
  const handleStripeCheckout = async (plan: 'pro' = 'pro') => {
    if (!user) {
      setCurrentRoute('signup');
      return;
    }
    triggerToast(`Initiating checkout secure stream for ${plan.toUpperCase()}...`, 'info');
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: user.id, email: user.email })
      });
      const data = await res.json();
      if (data.url) {
        // In AI Studio / Cloud Run container environment, we do a direct navigation 
        // to checkout, supporting local development simulations
        window.location.href = data.url;
      } else {
        triggerToast(`Checkout Issue: ${data.message || 'Cannot initialize session.'}`, 'warn');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Unable to connect to Stripe server, activating in-memory override.');
    }
  };

  // Trigger Simulative Google reviews pulling (Pro feature)
  const handleSimulateGooglePull = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/reviews/simulate-google', {
        method: 'POST',
        headers: { 'x-user-id': user.id }
      });
      const data = await res.json();
      if (data.reviews) {
        setReviews(prev => [...data.reviews, ...prev]);
        triggerToast(`🎉 4 New Google Reviews found! Auto-Reply responding...`, 'success');
        
        // Scan for the bad ones to warn the user
        const bad = data.reviews.filter((r: any) => r.rating <= 3);
        if (bad.length > 0) {
          const badAlerts = bad.map((b: any) => `Alert: Negative Google Review from ${b.customer_name} (${b.rating} Stars!)`);
          setNegativeAlerts(prev => [...prev, ...badAlerts]);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };




// Delete a single review
// Delete a single review – uses modal instead of confirm()
const handleDeleteReview = async (reviewId: string) => {
  setConfirmModal({
    isOpen: true,
    title: 'Delete Review',
    message: 'Are you sure you want to delete this review? This action cannot be undone.',
    confirmText: 'Delete',
    isDestructive: true,
    onConfirm: async () => {
      setConfirmModal({ ...confirmModal, isOpen: false });
      if (!user) return;
      try {
        const res = await fetch(`/api/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: { 'x-user-id': user.id }
        });
        if (res.ok) {
          setReviews(prev => prev.filter(r => r.id !== reviewId));
          triggerToast('Review deleted successfully.', 'success');
        } else {
          const data = await res.json();
          triggerToast(data.error || 'Failed to delete review.', 'warn');
        }
      } catch (err) {
        console.error(err);
        triggerToast('Error deleting review.', 'warn');
      }
    }
  });
};

// Clear all reviews – uses modal instead of confirm()
const handleClearAllReviews = async () => {
  setConfirmModal({
    isOpen: true,
    title: 'Clear All Reviews',
    message: 'Are you sure you want to delete ALL reviews? This action cannot be undone.',
    confirmText: 'Delete All',
    isDestructive: true,
    onConfirm: async () => {
      setConfirmModal({ ...confirmModal, isOpen: false });
      if (!user) return;
      try {
        const res = await fetch('/api/reviews/clear', {
          method: 'DELETE',
          headers: { 'x-user-id': user.id }
        });
        if (res.ok) {
          setReviews([]);
          setNegativeAlerts([]);
          triggerToast('All reviews cleared.', 'success');
        } else {
          const data = await res.json();
          triggerToast(data.error || 'Failed to clear reviews.', 'warn');
        }
      } catch (err) {
        console.error(err);
        triggerToast('Error clearing reviews.', 'warn');
      }
    }
  });
};




  // Profile updates on settings
  const handleSettingsUpdate = async (data: { business_name: string; industry: string; tone: string; contact_email: string }) => {
  if (!user) return;
  try {
    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        business_name: data.business_name,
        industry: data.industry,
        tone: data.tone,
        contact_email: data.contact_email
      })
    });
    const back = await res.json();
    
    // Always update the user state with the new data, even if the response doesn't include profile
    const updatedUser = back.profile 
      ? back.profile 
      : { ...user, ...data };
    
    setUser(updatedUser);
    localStorage.setItem('reviewrescue_user', JSON.stringify(updatedUser));
    
    triggerToast('Profile settings saved successfully!', 'success');
  } catch (err) {
    console.error(err);
    triggerToast('Failed to save settings.', 'warn');
  }
};


  // Count AI generations used for display this month
  const repliedCountThisMonth = reviews.filter(r => r.status === 'replied' && !r.is_autopilot).length;

  if (currentRoute === 'review') {
    return <PublicReviewView />;
  }
  if (currentRoute === 'privacy') {
  return <PrivacyPolicy />;
}
if (currentRoute === 'terms') {
  return <TermsOfService />;
}
if (currentRoute === 'reset-password') {
  return <ResetPasswordView />;
}

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 selection:bg-blue-150 selection:text-blue-800">
      
      {/* Dynamic Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-5 py-3.5 shadow-xl border flex items-center gap-3 w-full max-w-sm ${
  toast.type === 'success' 
    ? 'bg-slate-900 border-slate-800 text-white' 
    : toast.type === 'warn'
    ? 'bg-amber-500 border-amber-600 text-slate-900'
    : toast.type === 'error'
    ? 'bg-red-600 border-red-500 text-white'
    : 'bg-blue-600 border-blue-500 text-white'
}`}
          >
            <Info size={18} className="shrink-0" />
            <p className="text-xs font-bold leading-normal font-sans">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
        triggerToast={triggerToast}
      />

      {showTour && user && (
        <OnboardingTour 
          userId={user.id} 
          onComplete={handleTourComplete} 
          onStepChange={(stepId) => setCurrentRoute(stepId)}
        />
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="logout-confirmation-modal">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center space-y-4"
          >
            <div className="rounded-full bg-red-50 p-3 w-max mx-auto border border-red-100 text-red-600">
              <LogOut size={24} />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Are you sure you want to log out?</h3>
              <p className="text-xs text-slate-500 font-sans">
                This will disconnect your merchant session from the active dashboard portal.
              </p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleSignOut();
                }}
                className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-750 text-xs font-bold text-white transition shadow"
              >
                Yes, Logout
              </button>
            </div>
          </motion.div>
        </div>
      )}


<ConfirmModal
      isOpen={confirmModal.isOpen}
      title={confirmModal.title}
      message={confirmModal.message}
      confirmText={confirmModal.confirmText}
      cancelText="Cancel"
      onConfirm={confirmModal.onConfirm}
      onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      isDestructive={confirmModal.isDestructive}
    />


    {/* ─── WAITLIST MODAL ──────────────────────────────────────────── */}
<WaitlistModal 
  isOpen={showWaitlist}
  onClose={() => setShowWaitlist(false)}
  planName="Premium Plan"
/>



      {/* LANDING PAGE GRID VIEW */}
      {currentRoute === 'landing' && (
  <div className="flex-1 flex flex-col bg-white">
    
    {/* Header */}
    <nav className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-150">
      <Logo />
      
      <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
        <a href="#features" className="hover:text-slate-900 transition">Key Features</a>
        <a href="#pricing" className="hover:text-slate-900 transition font-sans">Plans & Pricing</a>
        <button 
          onClick={() => setShowContactModal(true)} 
          className="hover:text-slate-900 transition font-sans cursor-pointer NavLink"
          id="landing-nav-contact-desktop"
        >
          Contact
        </button>
        {user ? (
          <button 
            onClick={() => setCurrentRoute('dashboard')}
            className="rounded-xl bg-slate-900 text-white px-4.5 py-2 hover:bg-slate-800 transition"
          >
            Enter Dashboard
          </button>
        ) : (
          <>
            <button onClick={() => setCurrentRoute('signin')} className="hover:text-slate-900 transition">Login</button>
            <button 
              onClick={() => setCurrentRoute('signup')}
              className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4.5 py-2 transition shadow-sm"
            >
              Get Started
            </button>
          </>

          
        )}
      </div>
      <a
  href="https://calendly.com/rewakely/15min"
  target="_blank"
  rel="noopener noreferrer"
  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-2 transition shadow-sm"
>
  Book a Demo
</a>

      

      {/* Mobile Menu Icon */}
      <button className="md:hidden text-slate-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </nav>

    {/* Mobile responsive menu dropdown */}
    {mobileMenuOpen && (
      <div className="md:hidden bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col gap-4 text-sm font-bold text-slate-600">
        <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
        <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
        <button 
          onClick={() => { setMobileMenuOpen(false); setShowContactModal(true); }} 
          className="text-left hover:text-slate-900 transition font-sans"
          id="landing-nav-contact-mobile"
        >
          Contact
        </button>
        {user ? (
          <button 
            onClick={() => { setMobileMenuOpen(false); setCurrentRoute('dashboard'); }}
            className="text-left py-2 text-slate-900"
          >
            Enter Dashboard
          </button>
        ) : (
          <>
            <button onClick={() => { setMobileMenuOpen(false); setCurrentRoute('signin'); }} className="text-left py-2">SignIn</button>
            <button 
              onClick={() => { setMobileMenuOpen(false); setCurrentRoute('signup'); }}
              className="rounded-xl bg-slate-800 text-white py-2.5 text-center px-4"
            >
              Get Started
            </button>
          </>
        )}
      </div>
    )}

    {/* Hero Section */}
    <header className="max-w-5xl w-full mx-auto px-6 pt-16 pb-20 text-center space-y-6">
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-100">
        <Sparkles size={14} /> Driven by Rewakely AI Intelligence
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.08] max-w-4xl mx-auto font-sans">
        Rewakely – Turn Every Review Into a <span className="text-blue-600">5-Star Business Rating</span>
      </h1>
      <p className="text-md md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
        Automate replies, send text review reminders, and leverage auto-reply for Google. Keep operations clean, friendly and highly professional.
      </p>
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => setCurrentRoute('signup')}
          className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-semibold text-sm px-8 py-4 shadow-md flex items-center justify-center gap-2 group transition"
        >
          Get Started Instantly
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <a
          href="#pricing"
          className="w-full sm:w-auto rounded-xl border border-slate-300 text-slate-650 font-semibold text-sm px-8 py-4 text-center hover:bg-slate-50 transition"
        >
          See Plans & Pricing
        </a>
      </div>
    </header>

    {/* Features cards */}
    <section id="features" className="bg-slate-50 border-y border-slate-150 py-20 px-6">
      <div className="max-w-6xl w-full mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-extrabold text-blue-500 uppercase tracking-widest block">Core Products</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">The Modern Small Business Review System</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'AI‑Powered Replies',
              desc: 'Paste reviews from any custom source. Gemini generates high-context, professional responses in seconds.',
              icon: <Sparkles className="text-blue-500 h-6 w-6" />
            },
            {
              title: 'Text Invite Generator',
              desc: 'Collect more reviews instantly by sending personalized request texts directly to customers.',
              icon: <Smartphone className="text-blue-500 h-6 w-6" />
            },
            {
              title: 'Auto-Reply to Positive Reviews',
              desc: 'Sync real reviews autonomously. Auto-reply to 4 and 5-star comments; reviews with 1 to 3 stars are highlighted for manual response (Pro plan).',
              icon: <Shield className="text-blue-500 h-6 w-6" />
            }
          ].map((feat, i) => (
            <div key={i} className="p-8 rounded-2xl bg-white border border-slate-150 shadow-sm transition hover:shadow-md">
              <div className="rounded-xl bg-blue-50 p-2.5 w-max mb-6">
                {feat.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-sans">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ✅ COMPARISON SECTION – Without vs With Rewakely */}
    <section className="py-20 px-6 bg-white border-y border-slate-150">
      <div className="max-w-6xl w-full mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-extrabold text-blue-500 uppercase tracking-widest block">See the Difference</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Without Rewakely vs. With Rewakely</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto font-sans">
            Stop losing customers to bad reviews. Let Rewakely protect your reputation automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN – Without Rewakely */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                <XCircle size={24} />
              </div>
              <span className="text-sm font-black text-red-600 uppercase tracking-wider">Without Rewakely</span>
            </div>
            
            <div className="space-y-6">
              {/* Business Card Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                <h4 className="font-bold text-slate-900">Your Business Name</h4>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Public Unprotected Profile</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-amber-500 font-bold text-lg">3.1 ★★★☆☆</span>
                  <span className="text-[10px] text-slate-400">(3 Stars shown)</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <ThumbsDown size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <span>Bad scores and angry feedback are published instantly to Google Maps.</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <MapPin size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <span>Negatively impacts store search rank and monthly income.</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN – With Rewakely */}
          <div className="bg-white rounded-2xl border border-blue-200 shadow-md hover:shadow-lg transition relative overflow-hidden">
            {/* Highlight Badge */}
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Rewakely Active
            </div>
            
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Shield size={24} className="fill-emerald-100" />
                </div>
                <span className="text-sm font-black text-emerald-600 uppercase tracking-wider">With Rewakely</span>
              </div>
              
              <div className="space-y-6">
                {/* Business Card Preview */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">Your Business Name</h4>
                    <Shield size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider">Shield Connected</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-amber-500 font-bold text-lg">4.7 ★★★★☆</span>
                    <span className="text-[10px] text-slate-400">(4 Stars shown)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <ThumbsUp size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>Happy customers are routed straight to Google Maps for 5-star reviews.</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <Shield size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>Constructive criticisms are quarantined privately so you can rescue the guest.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    {/* ─── SOCIAL PROOF ────────────────────────────────────────── */}
<section className="py-16 px-6 bg-slate-50 border-y border-slate-150">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
      Trusted by Business Owners Like You
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
  <div>
    <p className="text-3xl font-black text-blue-600">2 Seconds</p>
    <p className="text-sm text-slate-500 mt-1">AI Reply Generation</p>
  </div>
  <div>
    <p className="text-3xl font-black text-blue-600">Unlimited</p>
    <p className="text-sm text-slate-500 mt-1">AI Replies Included</p>
  </div>
  <div>
    <p className="text-3xl font-black text-blue-600">Save Hours</p>
    <p className="text-sm text-slate-500 mt-1">Weekly With Automation</p>
  </div>
</div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <p className="text-sm text-slate-600 italic leading-relaxed">
          "What used to take hours now takes seconds. Rewakely is a game‑changer."
        </p>
        <p className="text-xs font-bold text-slate-800 mt-3">— Mike, HVAC Contractor</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <p className="text-sm text-slate-600 italic leading-relaxed">
          "The SMS and email feature is amazing. We get 5‑star reviews without even asking."
        </p>
        <p className="text-xs font-bold text-slate-800 mt-3">— Sarah, Dental Practice</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <p className="text-sm text-slate-600 italic leading-relaxed">
          "Auto‑reply to Google reviews is my favorite feature. I never miss a review now."
        </p>
        <p className="text-xs font-bold text-slate-800 mt-3">— John, Roofing Company</p>
      </div>
    </div>
  </div>
</section>

    {/* Pricing cards columns */}
    <section id="pricing" className="py-20 px-6 max-w-7xl w-full mx-auto">
      <div className="text-center space-y-4 mb-16">
        <span className="text-xs font-extrabold text-blue-500 uppercase tracking-widest block font-sans">Merchant Licensing</span>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Simple, Transparent Pricing</h2>
        
        {/* Currency Toggle */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mt-4 border border-slate-200 select-none">
          <button 
            onClick={() => setCurrency('USD')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
              currency === 'USD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
            }`}
          >
            USD ($)
          </button>
          <button 
            onClick={() => setCurrency('EUR')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
              currency === 'EUR' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
            }`}
          >
            EUR (€)
          </button>
        </div>
      </div>

      <PricingCards 
        currency={currency} 
        onSelectPlan={(plan) => {
          setCurrentRoute('signup');
          setAuthBusinessName('');
          setAuthEmail('');
          triggerToast(`Preselected "${plan.toUpperCase()}" package! Sign up to upgrade.`, 'info');
        }} 
      />
    </section>

    {/* Footer */}
    <footer className="border-t border-slate-150 bg-slate-50 py-10 px-6">
      <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-sans text-slate-400">
        <Logo size="sm" />
        <div className="flex gap-6">
          <button 
            onClick={() => setCurrentRoute('privacy')} 
            className="hover:text-slate-900 transition"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => setCurrentRoute('terms')} 
            className="hover:text-slate-900 transition"
          >
            Terms of Service
          </button>
          <a href="#" className="hover:text-slate-900 transition">Contact</a>
        </div>
        <span>&copy; 2026 Rewakely. All rights reserved.</span>
      </div>
    </footer>

  </div>
)}

      {/* AUTH SCREEN (SIGN IN / SIGN UP) */}
      {(currentRoute === 'signup' || currentRoute === 'signin') && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 bg-slate-50 font-sans min-h-[85vh]">
          
          {/* Left Column: Visual presentation with custom brand details & tagline */}
          <div className="flex flex-col justify-between bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden select-none order-1 min-h-[400px] md:min-h-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-95 z-0"></div>
            
            {/* Top Brand Logo */}
            <div className="relative z-10 flex items-center justify-between">
              <button onClick={() => setCurrentRoute('landing')} className="inline-block hover:scale-105 transition-transform">
                <Logo size="md" />
              </button>
              <span className="p-1 px-2.5 bg-slate-800 text-slate-300 border border-slate-700/80 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest bg-slate-805/60">
                PRO AUTOMATION ACTIVE
              </span>
            </div>

            {/* Centered Tagline & Value Adds */}
            <div className="relative z-10 max-w-md mx-auto my-auto space-y-8 py-8">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Reclaim your customer sentiment, automated by Gemini AI.
                </h1>
                <p className="text-sm text-slate-300 font-sans leading-relaxed">
                  Join hundreds of top-tier merchants who protect their reputation in real time using automated responses and high-volume text collection.
                </p>
              </div>

              {/* Value Add List */}
              <div className="space-y-4 font-sans text-xs">
                {[
                  { title: 'AI Assistant', desc: 'No-delay custom brand matching replies.' },
                  { title: 'Text Message Invites', desc: 'Direct text requests to customer phones.' },
                  { title: 'Review Dashboard', desc: 'Centralized live review controls.' }
                ].map((val, idx) => (
                  <div key={idx} className="flex gap-3 leading-relaxed items-start">
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-1 mt-0.5 shrink-0">
                      <Check size={12} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">{val.title}</h4>
                      <p className="text-slate-400 text-[11px] font-normal leading-normal">{val.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Credit */}
            <div className="relative z-10 flex justify-between items-center text-slate-500 text-[11px] font-sans pt-4 border-t border-slate-800/50 mt-4">
              <span>Trusted by 2,000+ local merchants worldwide</span>
              <span className="font-mono">Rewakely &copy; 2026</span>
            </div>
          </div>

          {/* Right Column: Form Container */}
          <div className="flex items-center justify-center p-8 bg-white border-b md:border-b-0 md:border-l border-slate-100 order-2">
            <div className="w-full max-w-md space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button 
                  onClick={() => setCurrentRoute('landing')} 
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                  id="auth-back-home"
                >
                  <ArrowLeft size={14} />
                  Back to Home Page
                </button>
                <button onClick={() => setCurrentRoute('landing')} className="inline-block hover:scale-105 transition-transform">
                  <Logo size="sm" />
                </button>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {currentRoute === 'signup' ? 'Sign Up' : 'Log in'}
                </h2>
                <p className="text-xs text-slate-400 leading-normal max-w-sm">
                  {currentRoute === 'signup' 
                    ? 'Configure your merchant profile on Rewakely and claim your autopilot credentials.' 
                    : 'Enter your business email credentials to log into your active review analytics.'}
                </p>
              </div>

              {authError && (
                <div className="bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-100 text-xs font-semibold">
                  {authError}
                </div>
              )}

              <div className="space-y-4">
                {currentRoute === 'signup' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Business name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Liam's Pastry Boutique"
                      value={authBusinessName}
                      onChange={(e) => setAuthBusinessName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="name@business.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-xs bg-white text-slate-905 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    required
                  />
                </div>

                <div>
  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
    Secure Password *
  </label>
  <div className="relative">
    <input
      type={showPassword ? 'text' : 'password'}
      placeholder="••••••••"
      value={authPassword}
      onChange={(e) => setAuthPassword(e.target.value)}
      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-xs bg-white text-slate-905 focus:outline-none focus:ring-2 focus:ring-slate-400 pr-10"
      required
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>
</div>

{/* ✅ TERMS CHECKBOX */}
{currentRoute === 'signup' && (
  <div className="flex items-start gap-2 mt-2">
    <input
      type="checkbox"
      id="terms"
      checked={acceptedTerms}
      onChange={(e) => setAcceptedTerms(e.target.checked)}
      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      required
    />
    <label htmlFor="terms" className="text-[10px] text-slate-500 font-sans leading-relaxed">
      By creating an account, you agree to our{' '}
      <button onClick={() => setCurrentRoute('terms')} className="text-blue-600 hover:underline font-semibold">
        Terms of Service
      </button>
      {' '}and{' '}
      <button onClick={() => setCurrentRoute('privacy')} className="text-blue-600 hover:underline font-semibold">
        Privacy Policy
      </button>.
    </label>
  </div>
)}

<button
  onClick={() => handleAuthSubmit(currentRoute as 'signup' | 'signin')}
  disabled={isAuthLoading}
  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-3.5 transition shadow"
>
  {isAuthLoading ? (
    <>
      <RefreshCw className="h-3 w-3 animate-spin" /> Preparing workspace token...
    </>
  ) : currentRoute === 'signup' ? (
    <>
      <UserPlus size={14} /> Register Active Profile
    </>
  ) : (
    <>
      <LogIn size={14} /> Log Into Workspace
    </>
  )}
</button>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-4 font-sans">
                <button 
                  onClick={() => setCurrentRoute(currentRoute === 'signup' ? 'signin' : 'signup')}
                  className="text-blue-600 font-bold hover:underline"
                >
                  {currentRoute === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
                
                <button 
  onClick={() => setCurrentRoute('reset-password')}
  className="hover:text-slate-800 text-sm"
>
  Forgot Password?
</button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SECURE DASHBOARD (AUTHENTICATED) */}
{user && currentRoute !== 'landing' && currentRoute !== 'signup' && currentRoute !== 'signin' && (
  <DashboardLayout
    currentRoute={currentRoute}
    setCurrentRoute={setCurrentRoute}
    user={user}
    onLogout={handleSignOut}
    negativeAlerts={negativeAlerts}
    onDismissAlerts={() => setNegativeAlerts([])}
  >
    {/* ✅ PAYWALL CHECK – If user is NOT subscribed, show paywall */}
    {user.subscription_status !== 'active' ? (
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
                onClick={() => handleStripeCheckout('pro')}
                className="w-full mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 transition shadow-lg"
              >
                Activate Pro License Now
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : (
      // ✅ SUBSCRIBED USER – Show all features
      <>
        {/* 1. Review Center */}
        {currentRoute === 'dashboard' && (
          <ReviewsView 
            profile={user} 
            reviews={reviews} 
            onImportReview={handleImportReview} 
            onGenerateReply={handleGenerateReplyResponse} 
            onPostReply={handlePublishReply} 
            isLoadingReviews={isLoadingReviews}
            repliedCountThisMonth={repliedCountThisMonth}
            onDeleteReview={handleDeleteReview}
            onClearAllReviews={handleClearAllReviews}
          />
        )}


       
        
        {/* 2. Review Invites Tab */}
{currentRoute === 'invites' && (
  <ReviewInvitesView 
    userId={user?.id}
    isPremium={user?.subscription_plan === 'premium'}
    toast={triggerToast}
  />
)}
        
        {/* 3. Auto-Reply */}
        {currentRoute === 'autopilot' && (
          <AutopilotPanel 
            profile={user} 
            onProfileUpdated={(updated) => {
              setUser(updated);
              localStorage.setItem('reviewrescue_user', JSON.stringify(updated));
            }}
          />
        )}
        
        {/* 4. Customer Feedback */}
        {currentRoute === 'feedback' && (
          <FeedbackView profile={user} />
        )}
        
        {/* 5. Support */}
        {currentRoute === 'support' && (
          <SupportView profile={user} />
        )}
        
        {/* 6. Settings – ALWAYS visible even if not subscribed */}
        {currentRoute === 'dashboardSettings' && (
          <SettingsView 
            profile={user} 
            onUpdateProfile={handleSettingsUpdate} 
            onUpgradePlan={handleStripeCheckout} 
            statusLogs={containerHealth}
            isLoadingStatus={isLoadingHealth}
            triggerToast={triggerToast}
          />
        )}
      </>
    )}
  </DashboardLayout>
)}

{/* ─── FLOATING BOOK A DEMO BUTTON ────────────────────────────── */}
{user && (
  <a
    href="https://calendly.com/rewakely/15min"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
  >
    <Calendar size={18} />
    <span className="font-semibold text-sm">Book a Demo</span>
  </a>
)}

    </div>
  );
}
