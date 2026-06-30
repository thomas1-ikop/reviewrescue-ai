// src/components/WaitlistModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Check } from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
}

export default function WaitlistModal({ isOpen, onClose, planName }: WaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.plan === 'premium') {
        // This is triggered by the button click
      }
    };
    window.addEventListener('showWaitlist', handler);
    return () => window.removeEventListener('showWaitlist', handler);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) throw new Error('Failed to join waitlist');
      
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setEmail('');
      }, 3000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg transition"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Get Early Access</h2>
          <p className="text-sm text-slate-500 mt-1">
            {planName} is in development. Join the waitlist to be notified when it launches.
          </p>
        </div>

        {submitted ? (
          <div className="mt-6 text-center py-6">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-slate-900">You're on the list!</h3>
            <p className="text-xs text-slate-500 mt-1">We'll notify you when {planName} launches.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl text-sm font-semibold transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Waitlist'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}