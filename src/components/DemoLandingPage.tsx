// src/components/DemoLandingPage.tsx
import React, { useState } from 'react';
import { PlayCircle, ArrowRight, Star, CheckCircle2, Rocket, RefreshCw, ArrowLeft, Calendar, Info } from 'lucide-react';
import Logo from './Logo';

interface DemoLandingPageProps {
  setCurrentRoute: (route: string) => void; // ✅ Add this prop
}

export default function DemoLandingPage({ setCurrentRoute }: DemoLandingPageProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/demo-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setIsSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to sign up. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state: Show the video
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full text-center">
          <Logo size="lg" className="mx-auto mb-6" />
          <div className="p-4 bg-emerald-50 rounded-2xl mb-6">
            <CheckCircle2 size={48} className="text-emerald-600 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Watch The Demo Video Below!</h1>
          <p className="text-slate-500 mt-2">
            The demo briefly talks about what we offer. If you're interested please book a meeting tailored to your business on our website .
          </p>
          <p className="text-sm text-slate-400 mt-4">
            
          </p>

          {/* Return to Home Button */}
          <div className="mt-6">
            <button
              onClick={() => setCurrentRoute('landing')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 px-4 py-2 text-sm font-semibold transition"
            >
              <ArrowLeft size={16} />
              Return to Home
            </button>
          </div>

          {/* Video */}
          <div className="mt-8 bg-slate-900 rounded-2xl aspect-video max-w-3xl mx-auto shadow-2xl overflow-hidden">
  <iframe
    id="rewakely-demo-player"
    width="100%"
    height="100%"
    src="https://www.youtube.com/embed/YOUR_VIDEO_ID?enablejsapi=1&rel=0"
    title="Rewakely Demo"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    className="w-full h-full"
  />
</div>
          {/* ===== CTAs BELOW VIDEO ===== */}
<div className="mt-8 max-w-2xl mx-auto">
  <h2 className="text-xl font-bold text-slate-900 text-center mb-6">
    Ready to Turn Your Reviews Into Customers?
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* CTA 1: Start Free Trial */}
    <button
      onClick={() => {
        setCurrentRoute('signup');
      }}
      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 text-sm font-semibold transition shadow-sm shadow-indigo-500/20 flex flex-col items-center gap-2"
    >
      <Rocket size={20} />
      Start Now
    </button>

    {/* CTA 2: Book a Demo Call */}
    <a
      href="https://calendly.com/rewakely/15min"
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-3 text-sm font-semibold transition flex flex-col items-center gap-2"
    >
      <Calendar size={20} />
      Book a Demo Call
    </a>

    {/* CTA 3: Learn More */}
    <button
      onClick={() => {
        setCurrentRoute('landing');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-3 text-sm font-semibold transition flex flex-col items-center gap-2"
    >
      <Info size={20} />
      Learn More
    </button>
  </div>

  {/* Social Proof (Optional) */}
  <div className="mt-8 text-center">
    <p className="text-xs text-slate-400">
      © 2026 Rewakely. All rights reserved.
    </p>
    <div className="flex justify-center gap-6 mt-4 text-xs text-slate-500">
       
    </div>
  </div>
</div>
        </div>
      </div>
    );
  }

  // Default state: Email capture form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <Logo size="lg" className="mx-auto mb-6" />

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          Fix Your Reviews.{' '}
          <span className="text-indigo-600">Get More Customers.</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-4 text-slate-600 text-lg">
          See how Rewakely automates your online reputation in <strong>90 seconds</strong>.
        </p>

        {/* Benefits */}
        <div className="mt-6 space-y-3 text-left">
          <div className="flex items-center gap-3 text-slate-700">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-sm">AI replies in <strong>2 seconds</strong></span>
          </div>
          <div className="flex items-center gap-3 text-slate-700">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Rocket size={16} />
            </div>
            <span className="text-sm">Auto-reply to <strong>4-5 star reviews</strong></span>
          </div>
          <div className="flex items-center gap-3 text-slate-700">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Star size={16} />
            </div>
            <span className="text-sm">Get <strong>more 5-star reviews</strong></span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 text-sm font-semibold transition shadow-sm shadow-indigo-500/20 disabled:opacity-70"
            >
              {isSubmitting ? (
                <RefreshCw size={16} className="animate-spin mx-auto" />
              ) : (
                <>
                  Watch Demo <ArrowRight size={16} className="inline ml-1" />
                </>
              )}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        {/* Cancel Button (OUTSIDE the form) */}
        <button
          onClick={() => setCurrentRoute('landing')}
          className="mt-4 w-full text-sm text-slate-500 hover:text-slate-700 transition flex items-center justify-center gap-1"
        >
          <ArrowLeft size={14} />
          Return to Home
        </button>

        {/* Social Proof */}
        <p className="mt-4 text-xs text-slate-400">
          No credit card required.
        </p>
      </div>
    </div>
  );
}