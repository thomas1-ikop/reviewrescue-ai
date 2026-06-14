/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Smartphone, Settings, Shield, Activity, LogOut, ArrowRight, ArrowLeft, Lock, 
  CheckCircle2, Zap, Check, ExternalLink, HelpCircle, ShieldCheck, HeartCrack, 
  MessageSquare, Star, Sparkles, LogIn, UserPlus, Info, RefreshCw
} from 'lucide-react';

import Logo from './components/Logo';
import PricingCards from './components/PricingCards';
import OnboardingModal from './components/OnboardingModal';
import ReviewsView from './components/ReviewsView';
import SMSCollector from './components/SMSCollector';
import AutopilotPanel from './components/AutopilotPanel';
import SettingsView from './components/SettingsView';
import { Profile, Review, Invite, ReviewSource } from './types';

export default function App() {
  // Navigation & Route State
  const [currentRoute, setCurrentRoute] = useState<string>('landing');
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication State
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusinessName, setAuthBusinessName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Logged-in User Context
  const [user, setUser] = useState<Profile | null>(null);
  const [isFallbackDb, setIsFallbackDb] = useState(false);

  // Business Reviews & Invites Storage State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  
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

  // Toast / System Notification banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'warn' | 'info' = 'success') => {
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

  // Sync state with address hash routing, perfect for sandbox refreshing
  useEffect(() => {
    fetchContainerHealth();

    const loadLocalSession = async () => {
      const storedUser = localStorage.getItem('reviewrescue_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          // Sync profile with database on launch
          const res = await fetch('/api/user/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parsed.email, manualUserId: parsed.id })
          });
          const data = await res.json();
          if (data.profile) {
            setUser(data.profile);
            localStorage.setItem('reviewrescue_user', JSON.stringify(data.profile));
            if (!data.profile.onboarded) {
              setShowOnboarding(true);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    loadLocalSession();

    // Check for standard Stripe completion redirects in the URL hash
    const handleUrlHashRedirects = () => {
      const hash = window.location.hash;
      if (!hash) return;

      const params = new URLSearchParams(hash.substring(hash.indexOf('?') + 1));
      
      const routeParam = params.get('currentRoute');
      if (routeParam) {
        setCurrentRoute(routeParam);
      }

      // Secure payment checkout response
      const successUpgrade = params.get('success') === 'true';
      const updatedPlan = params.get('plan');
      if (successUpgrade && updatedPlan) {
        const storedUser = localStorage.getItem('reviewrescue_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          // Sync profile state with database to verify Webhook update
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
        // Clean hash of redirects
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
        const bad = revData.reviews.filter((r: Review) => r.rating <= 3 && r.status === 'pending');
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
    if (user?.id) {
      fetchDashboardData(user.id);
      // Auto-poll logs in background for lively demonstrations
      const interval = setInterval(() => {
        fetchDashboardData(user.id);
      }, 10000); 
      return () => clearInterval(interval);
    }
  }, [user?.id]);


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
      
      if (res.ok && data.profile) {
        setUser(data.profile);
        localStorage.setItem('reviewrescue_user', JSON.stringify(data.profile));
        
        // Check if onboarding modal wizard is required
        if (!data.profile.onboarded) {
          setShowOnboarding(true);
        } else {
          setCurrentRoute('dashboard');
        }
        triggerToast(`Success: Signed in as ${data.profile.email}`, 'success');
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
    triggerToast('Logged out of ReviewRescue systems.', 'info');
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
        
        // Alert if negative review
        if (reviewData.rating <= 3) {
          setNegativeAlerts(prev => [...prev, `Alert: Negative review left by ${reviewData.customerName} (${reviewData.rating} Stars!)`]);
        }
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
      if (data.invite) {
        setInvites(prev => [data.invite, ...prev]);
        triggerToast(`Invitation sent to ${customerName}.`, 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate or Create Stripe Checkout
  const handleStripeCheckout = async (plan: 'starter' | 'growth' | 'pro') => {
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
        triggerToast(`🎉 4 New GMB Google Reviews fetched! Auto-Pilot responding...`, 'success');
        
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

  // Profile updates on settings
  const handleSettingsUpdate = async (data: { business_name: string; industry: string; tone: string }) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          business_name: data.business_name,
          industry: data.industry,
          tone: data.tone
        })
      });
      const back = await res.json();
      if (back.profile) {
        setUser(back.profile);
        localStorage.setItem('reviewrescue_user', JSON.stringify(back.profile));
      } else {
        // fallback
        const updated = { ...user, ...data };
        setUser(updated);
        localStorage.setItem('reviewrescue_user', JSON.stringify(updated));
      }
    } catch (err) {
      console.error(err);
    }
  };


  // Count AI generations used for display this month
  const repliedCountThisMonth = reviews.filter(r => r.status === 'replied' && !r.is_autopilot).length;

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
                : 'bg-blue-600 border-blue-500 text-white'
            }`}
          >
            <Info size={18} className="shrink-0" />
            <p className="text-xs font-bold leading-normal font-sans">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <OnboardingModal 
        isOpen={showOnboarding} 
        onSave={handleOnboardingSave} 
        isLoading={isOnboardingSaving} 
      />

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

      {/* LANDING PAGE GRID VIEW */}
      {currentRoute === 'landing' && (
        <div className="flex-1 flex flex-col bg-white">
          
          {/* Header */}
          <nav className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-150">
            <Logo />
            
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <a href="#features" className="hover:text-slate-900 transition">Key Features</a>
              <a href="#pricing" className="hover:text-slate-900 transition font-sans">Plans & Pricing</a>
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
              <Sparkles size={14} /> Driven by Gemini 2.0 Flash Intelligence
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.08] max-w-4xl mx-auto font-sans">
              Turn Every Review Into a <span className="text-blue-600">5-Star Reputation</span>
            </h1>
            <p className="text-md md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Automate replies, send SMS review reminders, and leverage auto-pilot for Google. Keep operations clean, warm and highly professional.
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
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">The Modern Small Business Reputation Engine</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    title: 'AI‑Powered Replies',
                    desc: 'Paste reviews from any custom source. Gemini generates high-context, professional responses in seconds.',
                    icon: <Sparkles className="text-blue-500 h-6 w-6" />
                  },
                  {
                    title: 'SMS Invite Generator',
                    desc: 'Collect more reviews instantly by dispatching personalized request texts directly to customers.',
                    icon: <Smartphone className="text-blue-500 h-6 w-6" />
                  },
                  {
                    title: 'GMB Reputation Auto-Pilot',
                    desc: 'Sync real reviews autonomously. Auto-reply to 4 and 5-star comments; negative feedback flags for manual intervention (Pro plan).',
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
                // Auto pre-select plan query indication
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
                <a href="#" className="hover:text-slate-900 transition">Privacy Policy</a>
                <a href="#" className="hover:text-slate-900 transition">Terms of Service</a>
                <a href="#" className="hover:text-slate-900 transition">Contact Workspace</a>
              </div>
              <span>&copy; 2026 ReviewRescue AI Inc. All rights reserved.</span>
            </div>
          </footer>

        </div>
      )}

      {/* AUTH SCREEN (SIGN IN / SIGN UP) */}
      {(currentRoute === 'signup' || currentRoute === 'signin') && (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 font-sans">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button 
                onClick={() => setCurrentRoute('landing')} 
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft size={14} />
                Back to Home Page
              </button>
              <button onClick={() => setCurrentRoute('landing')} className="inline-block hover:scale-105 transition-transform">
                <Logo size="sm" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {currentRoute === 'signup' ? 'Create Merchant Account' : 'Welcome back to Rescue Portal'}
              </h2>
              <p className="text-xs text-slate-400 leading-normal max-w-sm mx-auto">
                {currentRoute === 'signup' 
                  ? 'Configure your merchant account on ReviewRescue AI and claim your brand handles.' 
                  : 'Enter your business credentials to log into your active dashboards.'}
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs bg-white text-slate-900 focus:outline-none"
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs bg-white text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Secure Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs bg-white text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <button
                onClick={() => handleAuthSubmit(currentRoute as 'signup' | 'signin')}
                disabled={isAuthLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-3.5 transition shadow"
              >
                {isAuthLoading ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" /> Setting up session...
                  </>
                ) : currentRoute === 'signup' ? (
                  <>
                    <UserPlus size={14} /> Register Account
                  </>
                ) : (
                  <>
                    <LogIn size={14} /> Enter Merchant Workspace
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-150 pt-4">
              <button 
                onClick={() => setCurrentRoute(currentRoute === 'signup' ? 'signin' : 'signup')}
                className="text-blue-600 font-semibold hover:underline"
              >
                {currentRoute === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
              
              <button 
                onClick={() => triggerToast('ForgotPassword info dispatches. Use standard Supabase resets if connected.', 'info')} 
                className="hover:text-slate-800"
              >
                Forgot Password?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURE DASHBOARD (AUTHENTICATED) */}
      {user && currentRoute !== 'landing' && currentRoute !== 'signup' && currentRoute !== 'signin' && (
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* Side panel Navigation column */}
          <aside className="w-full md:w-64 border-r border-slate-200 bg-white p-6 shrink-0 flex flex-col gap-6" id="dashboard-sidebar">
            <button onClick={() => setCurrentRoute('landing')} className="hover:scale-105 transition-transform self-start">
              <Logo />
            </button>

            {/* active user details banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-widest">Active Merchant</span>
              <span className="font-extrabold text-slate-800 block text-xs mt-0.5 max-w-[190px] truncate">{user.business_name || 'My Business'}</span>
              <span className="text-[10px] text-slate-500 font-mono block max-w-[190px] truncate">{user.email}</span>
              
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`h-1.5 w-1.5 rounded-full ${user.subscription_status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 select-none">
                  {user.subscription_plan.toUpperCase()} {user.subscription_status === 'active' ? 'Active' : 'Unpaid'}
                </span>
              </div>
            </div>

            {/* sidebar routes click lists */}
            <nav className="flex-1 space-y-2">
              {[
                { id: 'dashboard', label: 'Review Center', icon: <MessageSquare size={16} />, disabled: false },
                { id: 'sms', label: 'SMS Collector', icon: <Smartphone size={16} />, disabled: user.subscription_plan === 'starter' },
                { id: 'autopilot', label: 'Google Auto-Pilot', icon: <Activity size={16} />, disabled: user.subscription_plan !== 'pro' },
                { id: 'dashboardSettings', label: 'Reputation Settings', icon: <Settings size={16} />, disabled: false },
              ].map((tab) => {
                const isActive = currentRoute === tab.id;
                const isInactivePaywall = user.subscription_status === 'inactive';
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (isInactivePaywall && tab.id !== 'dashboardSettings') {
                        triggerToast('Upgrade plan to activate full layout.', 'warn');
                        return;
                      }
                      setCurrentRoute(tab.id);
                    }}
                    className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                      isActive 
                        ? 'bg-slate-900 text-white shadow' 
                        : tab.disabled || isInactivePaywall
                        ? 'opacity-40 cursor-not-allowed hover:bg-slate-50 text-slate-400'
                        : 'text-slate-650 hover:bg-slate-50'
                    }`}
                    disabled={isInactivePaywall && tab.id !== 'dashboardSettings'}
                  >
                    <div className="flex items-center gap-2.5">
                      {tab.icon}
                      {tab.label}
                    </div>

                    {(tab.disabled || isInactivePaywall) && <Lock size={12} className="text-slate-400" />}
                  </button>
                );
              })}
            </nav>

            {/* Sign out */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="mt-auto w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-650 hover:bg-red-50 transition"
            >
              <LogOut size={16} />
              Disconnect Portal
            </button>
          </aside>

          {/* Main workspace section area */}
          <main className="flex-1 bg-slate-50 p-6 md:p-8 space-y-6 overflow-y-auto max-h-screen">
            
            {/* System banner alerts: Negative 1-3 star review caught */}
            {negativeAlerts.length > 0 && user.subscription_plan !== 'starter' && user.subscription_status === 'active' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800 animate-fade-in shadow-sm">
                <HeartCrack className="text-red-500 mt-0.5 shrink-0" size={18} />
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-red-600 block">Critical Real-time Alerts</span>
                  <p className="text-xs font-bold leading-relaxed">
                    {negativeAlerts[negativeAlerts.length - 1]} Please intervene via the Review Center now.
                  </p>
                </div>
                <button 
                  onClick={() => setNegativeAlerts([])} 
                  className="ml-auto text-xs font-bold text-red-650 hover:underline"
                >
                  Dismiss all
                </button>
              </div>
            )}

            {/* Connection state banner showing Fallback if supabase/gemini/etc is missing */}
            {isFallbackDb && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-blue-800 font-sans shadow-sm">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="text-blue-500 shrink-0" size={16} />
                  <span className="text-xs font-medium">
                    🛡 <strong>Sandbox Fallback database Active.</strong> All CRUD is fully operational in browser local storage. Synchronize any postgres database in <strong>Reputation Settings</strong> tab when ready.
                  </span>
                </div>
              </div>
            )}

            {/* A. LOCKED STATE VIEW (UNPAID/INACTIVE SYSTEM LICENSE) */}
            {user.subscription_status === 'inactive' && currentRoute !== 'dashboardSettings' ? (
              <div className="space-y-6 animate-fade-in" id="paywall-unpaid-view">
                
                {/* Visual paywall layout */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md text-center max-w-4xl mx-auto space-y-6">
                  <div className="rounded-full bg-amber-50 p-4 w-max mx-auto border border-amber-100 text-amber-600">
                    <Lock size={32} className="animate-pulse" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Reputation License Expired</h2>
                    <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed font-sans">
                      Your premium features are currently suspended. Choose an active merchant license tier below to unlock Gemini smart generation, instant review reminders, and autopilot flows.
                    </p>
                  </div>

                  {/* Pricing Columns inside standard lock view */}
                  <div className="border-t border-slate-100 pt-8" id="paywall-pricing-tier">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { id: 'starter' as const, name: 'Starter Tier', price: '$29/mo', desc: '50 Replies / mo, manual feed, standard tone rules' },
                        { id: 'growth' as const, name: 'Growth Tier', price: '$49/mo', desc: '200 Replies/mo, SMS invites reminders, Negative notifications' },
                        { id: 'pro' as const, name: 'Pro Tier', price: '$99/mo', desc: 'Unlimited AI Replies, fully hands-free Autopilot integration, simulated review sweeps' },
                      ].map((pkg) => (
                        <div key={pkg.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col justify-between items-center text-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{pkg.name}</span>
                          <span className="text-3xl font-black text-slate-900 mt-2 block">{pkg.price}</span>
                          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed min-h-[48px] font-sans">{pkg.desc}</p>
                          <button
                            onClick={() => handleStripeCheckout(pkg.id)}
                            className="w-full mt-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 transition shadow"
                          >
                            Upgrade to {pkg.id.toUpperCase()}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feature Comparison Table */}
                  <div className="border-t border-slate-100 pt-8 mt-6">
                    <h3 className="text-base font-bold text-slate-850 tracking-tight text-left mb-4">Compare Tier Capabilities</h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-250">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3 font-semibold text-slate-700">Capabilities</th>
                            <th className="p-3 font-semibold text-slate-700 text-center">Starter ($29)</th>
                            <th className="p-3 font-semibold text-slate-700 text-center">Growth ($49)</th>
                            <th className="p-3 font-semibold text-white bg-slate-800 text-center rounded-t-lg">Pro ($99)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-3 font-medium text-slate-800">Monthly AI Reply Generations</td>
                            <td className="p-3 text-center text-slate-500">50 / Month</td>
                            <td className="p-3 text-center text-slate-500">200 / Month</td>
                            <td className="p-3 text-center font-bold text-slate-900 bg-slate-50">Unlimited</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-800">Multi-lingual Intelligent Prompts</td>
                            <td className="p-3 text-center text-emerald-600">✔ Yes</td>
                            <td className="p-3 text-center text-emerald-600">✔ Yes</td>
                            <td className="p-3 text-center text-emerald-600 font-bold bg-slate-50">✔ Yes</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-800">SMS Direct Contact Invites</td>
                            <td className="p-3 text-center text-red-500">❌ Locked</td>
                            <td className="p-3 text-center text-emerald-600">✔ Up to 200/mo</td>
                            <td className="p-3 text-center text-emerald-600 font-bold bg-slate-50">✔ Unlimited</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-800">Critical Negative Review Alerts</td>
                            <td className="p-3 text-center text-red-500">❌ Locked</td>
                            <td className="p-3 text-center text-emerald-600">✔ In-App & Email</td>
                            <td className="p-3 text-center text-emerald-600 font-bold bg-slate-50">✔ Real-time SMS & Email</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-800">Auto-Pilot positive replies</td>
                            <td className="p-3 text-center text-red-500">❌ Locked</td>
                            <td className="p-3 text-center text-red-500">❌ Locked</td>
                            <td className="p-3 text-center text-emerald-600 font-bold bg-slate-50">✔ Fully automated</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-800">Google My Business Integration</td>
                            <td className="p-3 text-center text-red-500">❌ Locked</td>
                            <td className="p-3 text-center text-red-500">❌ Locked</td>
                            <td className="p-3 text-center text-emerald-600 font-bold bg-slate-50">✔ Direct Native</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* B. ACTIVE WORKSPACE RENDERING */
              <div className="space-y-6">
                
                {/* 1. Review Center route */}
                {currentRoute === 'dashboard' && (
                  <ReviewsView 
                    profile={user} 
                    reviews={reviews} 
                    onImportReview={handleImportReview} 
                    onGenerateReply={handleGenerateReplyResponse} 
                    onPostReply={handlePublishReply} 
                    isLoadingReviews={isLoadingReviews}
                    repliedCountThisMonth={repliedCountThisMonth}
                  />
                )}

                {/* 2. SMS review collector reminders */}
                {currentRoute === 'sms' && (
                  <SMSCollector 
                    profile={user} 
                    invites={invites} 
                    onSendSMS={handleSendFeedbackInvite}
                    isLoadingInvites={isLoadingInvites}
                    statusLogs={containerHealth}
                  />
                )}

                {/* 3. Autopilot fully automated control center */}
                {currentRoute === 'autopilot' && (
                  <AutopilotPanel 
                    profile={user} 
                    onUpdateBilling={async (plan, active) => {
                      const updated = { ...user, subscription_plan: plan, subscription_status: active };
                      setUser(updated);
                      localStorage.setItem('reviewrescue_user', JSON.stringify(updated));
                    }}
                    onTriggerSimulation={handleSimulateGooglePull} 
                    isLoadingSim={false}
                    statusLogs={containerHealth}
                  />
                )}

                {/* 4. Credentials, health configuration and profiles */}
                {currentRoute === 'dashboardSettings' && (
                  <SettingsView 
                    profile={user} 
                    onUpdateProfile={handleSettingsUpdate} 
                    onUpgradePlan={handleStripeCheckout} 
                    statusLogs={containerHealth}
                    isLoadingStatus={isLoadingHealth}
                  />
                )}

              </div>
            )}

          </main>
        </div>
      )}

    </div>
  );
}
