// src/components/CookiePolicy.tsx
import React from 'react';
import Logo from './Logo';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <Logo />
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/';
            }}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            ← Back to Home
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-sm">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Cookie Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Last Updated: August 2026</p>

          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            <p>
              Rewakely uses cookies and similar tracking technologies to improve your experience on our website. This Cookie Policy explains what cookies are, how we use them, and how you can control them.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">What Are Cookies?</h2>
            <p>
              Cookies are small text files that are stored on your device when you visit a website. They help us remember your preferences and understand how you interact with our site.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">How We Use Cookies</h2>
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800">Essential Cookies</h3>
                <p className="text-xs text-slate-500 mt-1">These are necessary for the website to function. They keep you logged in and remember your session.</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800">Analytics Cookies</h3>
                <p className="text-xs text-slate-500 mt-1">We use Google Analytics to understand how visitors use our site. This helps us improve the user experience.</p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-6">Your Choices</h2>
            <p>
              When you first visit our site, we ask for your consent to use non-essential cookies. You can:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Accept all</strong> – we'll use all cookies</li>
              <li><strong>Decline</strong> – we'll only use essential cookies</li>
              <li><strong>Change your mind</strong> – you can clear your cookies in your browser settings at any time</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">Contact Us</h2>
            <p>
              If you have any questions about this Cookie Policy, please contact us at{' '}
              <a href="mailto:contact.rescuereview@gmail.com" className="text-blue-600 hover:underline">
                contact.rescuereview@gmail.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}