/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { OnboardingData } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onSave: (data: OnboardingData & { initialReview?: { customer: string; rating: number; comment: string } }) => void;
  isLoading: boolean;
}

export default function OnboardingModal({ isOpen, onSave, isLoading }: OnboardingModalProps) {
  if (!isOpen) return null;

  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('Restaurant');
  const [tone, setTone] = useState('Friendly');
  
  // Optional initial review
  const [hasInitialReview, setHasInitialReview] = useState(false);
  const [custName, setCustName] = useState('');
  const [custRating, setCustRating] = useState(5);
  const [custComment, setCustComment] = useState('');

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const data: any = {
        business_name: businessName,
        industry,
        tone,
      };
      if (hasInitialReview && custName && custComment) {
        data.initialReview = {
          customer: custName,
          rating: custRating,
          comment: custComment
        };
      }
      onSave(data);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-8 shadow-2xl transition-all">
        
        {/* Step indicators */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Step {step} of 3
          </span>
        </div>

        {/* Step 1: Business Identification */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Sparkles size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Let's setup your business details</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6 font-sans">
              ReviewRescue AI uses this metadata to customize response templates and tone parameters so your responses feel authentic.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deluxe Sushi Bar"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Primary Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="Restaurant">Restaurant & Cafe</option>
                  <option value="Retail">Retail & Boutiques</option>
                  <option value="Salon">Salon & Wellness Spa</option>
                  <option value="Hotel">Hotel & Hospitality</option>
                  <option value="Medical">Medical & Private Care</option>
                  <option value="Real Estate">Real Estate Agencies</option>
                  <option value="Other">Other Services</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pitch & Tone setup */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-4 font-sans">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Define your brand tone</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              How do you want to communicate with customers? Gemini AI will generate replies adhering to this voice guidelines.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  id: 'Friendly',
                  title: 'Friendly & Casual',
                  desc: 'Warm, personable, uses exclamation points with grace, values long-term connection.'
                },
                {
                  id: 'Professional',
                  title: 'Elegant & Professional',
                  desc: 'Respectful, polite, syntax is structured, premium brand alignment.'
                },
                {
                  id: 'Direct',
                  title: 'Clean & Direct',
                  desc: 'Brief, efficient, straightforward apology or appreciation, saves customer time.'
                }
              ].map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    tone === t.id
                      ? 'border-blue-600 bg-blue-50/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">{t.title}</span>
                    <input
                      type="radio"
                      checked={tone === t.id}
                      onChange={() => setTone(t.id)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Optional First Review Import */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <HelpCircle size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Import your first review (Optional)</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6 font-sans">
              Paste an old Google or Yelp review you received to see the Rescue Reply generator immediately in action. You can also skip this.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasInitial"
                  checked={hasInitialReview}
                  onChange={(e) => setHasInitialReview(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="hasInitial" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Yes, I want to import a real review right now.
                </label>
              </div>

              {hasInitialReview && (
                <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Reviewer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Star Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCustRating(star)}
                          className={`text-lg transition-colors ${
                            star <= custRating ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Review Comments
                    </label>
                    <textarea
                      placeholder="Paste the customer feedback here..."
                      value={custComment}
                      onChange={(e) => setCustComment(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white text-slate-900"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal actions */}
        <div className="mt-8 flex justify-between gap-4">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={step === 1 && !businessName || isLoading}
            className={`flex items-center gap-2 rounded-xl bg-slate-800 text-white font-semibold text-sm px-6 py-3 hover:bg-slate-900 transition ${
              step === 1 && !businessName ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Saving...' : step === 3 ? 'Save & Start' : 'Continue'}
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
