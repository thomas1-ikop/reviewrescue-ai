/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, MessageSquare, Mail, ThumbsUp } from 'lucide-react';
import { Profile } from '../types';
import { Calendar } from 'lucide-react';

interface SupportViewProps {
  profile: Profile;
}

export default function SupportView({ profile }: SupportViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6" id="support-tab-container">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <HelpCircle size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Help & Support</h1>
            <p className="text-xs text-slate-500 font-sans">
              We value your feedback and are here to help with any questions.
            </p>
          </div>
        </div>
      </div>

      {/* ─── BOOK A DEMO CARD ────────────────────────────────────── */}
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-xl">
          <Calendar className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">📅 Book a Demo</h3>
          <p className="text-xs text-slate-500">Schedule a 20-minute call with Thomas, founder of Rewakely</p>
        </div>
        <a
          href="https://calendly.com/thomas-rewakely/30min-demo"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          Book Now
        </a>
      </div>
    </div>

      {/* Question Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm transition hover:shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <MessageSquare size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">Have a question?</h3>
            <p className="text-sm text-slate-500 mt-1 font-sans leading-relaxed">
              Need help with setup, billing, or anything else? We're here to help.
            </p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfmr8T_-yHq6E91ts4c3PeqXuE1aHNpDWW-CrohorikHXV9gA/viewform?usp=dialog"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Mail size={14} />
              Ask a Question →
            </a>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm transition hover:shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <ThumbsUp size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">Help us improve</h3>
            <p className="text-sm text-slate-500 mt-1 font-sans leading-relaxed">
              Take 3 minutes to let us know how we're doing. Your feedback helps us make Rewakely better for everyone.
            </p>
            <a
              href="https://forms.gle/hboNpZoRWyRYcXVd7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <ThumbsUp size={14} />
              Share Feedback →
            </a>
          </div>
        </div>
      </div>

      {/* Extra note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <p className="text-xs text-slate-500 font-sans text-center">
          All responses are sent directly to our team. We typically reply within 48 hours.
        </p>
      </div>

    </div>
  );
}