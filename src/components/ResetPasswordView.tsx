// src/components/ResetPasswordView.tsx
import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPasswordView: React.FC = () => {
  const [mode, setMode] = useState<'request' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // In ResetPasswordView.tsx, update the useEffect to check for token in URL
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    setResetToken(token);
    setMode('reset');
  }
}, []);

  
  
const handleRequestReset = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email.trim()) {
    setMessage({ text: 'Please enter your email address.', type: 'error' });
    return;
  }

  setLoading(true);
  setMessage(null);

  try {
    const response = await fetch('/api/auth/reset-password-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send reset email');
    }

    setMode('success');
    setMessage({
      text: `Password reset email sent to ${email}. Check your inbox (and spam folder).`,
      type: 'success',
    });
  } catch (err: any) {
    setMessage({ text: err.message || 'Failed to send reset email. Please try again.', type: 'error' });
  } finally {
    setLoading(false);
  }
};

const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();

  if (newPassword.length < 6) {
    setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
    return;
  }

  if (newPassword !== confirmPassword) {
    setMessage({ text: 'Passwords do not match.', type: 'error' });
    return;
  }

  setLoading(true);
  setMessage(null);

  // Get the token from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    setMessage({ text: 'Invalid reset link. Please request a new one.', type: 'error' });
    setLoading(false);
    return;
  }

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }

    setMessage({ text: 'Password updated successfully! You can now log in.', type: 'success' });
    setTimeout(() => {
      window.location.href = '/#currentRoute=signin';
    }, 2500);
  } catch (err: any) {
    setMessage({ text: err.message || 'Failed to reset password. Please try again.', type: 'error' });
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 md:p-8">
        {/* Back link – uses a plain <a> tag with a full reload */}
        <a
          href="/"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 hover:underline transition mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home Page
        </a>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'request' && 'Reset Password'}
            {mode === 'reset' && 'Set New Password'}
            {mode === 'success' && 'Check Your Email'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'request' && 'Enter your email and we\'ll send you a reset link.'}
            {mode === 'reset' && 'Enter your new password below.'}
            {mode === 'success' && 'We\'ve sent a reset link to your email address.'}
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-sm font-medium flex items-start gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : message.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {mode === 'request' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3.5 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Sending...' : (
                <>
                  <Mail size={16} />
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3.5 transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        {mode === 'success' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              <p>We've sent a password reset link to <strong>{email}</strong>.</p>
              <p className="mt-1">Click the link in the email to set a new password. If you don't see it, check your spam folder.</p>
            </div>

            <a
              href="/"
              className="w-full block text-center rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm py-3 transition"
            >
              Return to Sign In
            </a>
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-6">
          {mode === 'request' && 'You\'ll receive an email with a link to reset your password.'}
          {mode === 'reset' && 'Make sure your new password is secure and unique.'}
          {mode === 'success' && 'The link expires in 1 hour for security.'}
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordView;