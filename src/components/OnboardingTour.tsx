/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface OnboardingTourProps {
  userId: string;
  onComplete: () => void;
  onStepChange?: (stepId: string) => void;
}

export default function OnboardingTour({ userId, onComplete, onStepChange }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // All 6 dashboard tabs in the correct order (matches sidebar)
  const steps = [
    {
      id: 'dashboard',
      title: 'Review Center',
      description: 'Manually import reviews from any platform (Google, Yelp, Facebook, etc.). Generate AI replies, edit them, and save them to your review history. This is where you manage all your reviews in one place.',
    },
    {
      id: 'sms',
      title: 'Send Text Invites',
      description: 'Send SMS invitations to your customers asking them to leave a review. Track who you\'ve invited and see delivery status. All customer responses appear in the Customer Feedback tab.',
    },
    {
      id: 'autopilot',
      title: 'Auto-Reply',
      description: 'Connect your Google Business Profile and turn on the toggle. We\'ll automatically reply to new 4-5 star Google reviews with a warm, professional response. Negative reviews (1-3 stars) will appear as alerts so you can handle them personally.',
    },
    {
      id: 'feedback',
      title: 'Customer Feedback',
      description: 'See all responses from your SMS invites. View customer names, ratings, and happiness scores. Track your average rating and see how many customers are happy vs unhappy.',
    },
    {
      id: 'support',
      title: 'Questions & Comments',
      description: 'Have a question or want to share feedback? Use this tab to contact us directly or submit your thoughts. We\'re here to help!',
    },
    {
      id: 'dashboardSettings',
      title: 'Settings',
      description: 'Update your business name, industry, AI tone, and contact email. Manage your subscription, upgrade, or cancel your plan. This is your control center.',
    },
  ];

  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (onStepChange) {
        onStepChange(steps[nextStep].id);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (onStepChange) {
        onStepChange(steps[prevStep].id);
      }
    }
  };

  const handleComplete = async () => {
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  // Highlight the current sidebar item when step changes
  useEffect(() => {
    const targetId = steps[currentStep].id;
    const element = document.getElementById(`tour-sidebar-${targetId}`);
    if (element) {
      element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      // Add a glowing effect
      element.style.transition = 'all 0.3s ease';
      element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
      setTimeout(() => {
        element.style.boxShadow = 'none';
      }, 2000);
    }
  }, [currentStep]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/20 pointer-events-auto" onClick={handleSkip} />

      {/* Tooltip */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="pointer-events-auto max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 mx-4 transform transition-all duration-300 animate-fade-in">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Step number */}
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
            Step {currentStep + 1} of {totalSteps}
          </span>

          {/* Content */}
          <h3 className="text-lg font-bold text-slate-900 mt-1">{steps[currentStep].title}</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed font-sans">
            {steps[currentStep].description}
          </p>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSkip}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 transition"
              >
                Skip tour
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
              >
                {currentStep === totalSteps - 1 ? (
                  <>
                    <Check size={14} />
                    Got it!
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}