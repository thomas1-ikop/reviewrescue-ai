// src/components/AnimatedTour.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  image?: string;
}

interface AnimatedTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip?: () => void;
  initialStep?: number;
}

const AnimatedTour: React.FC<AnimatedTourProps> = ({
  steps,
  onComplete,
  onSkip,
  initialStep = 0,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isVisible, setIsVisible] = useState(true);

  const totalSteps = steps.length;
  const step = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  const goToNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (onSkip) onSkip();
    else onComplete();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay – no blur, just a dim background */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" />

      {/* Tour card – centered on screen */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pointer-events-auto max-w-md w-full mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Progress bar */}
            <div className="h-1 bg-slate-100 w-full">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Step indicator + close button */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <button
                  onClick={handleSkip}
                  className="text-slate-400 hover:text-slate-600 transition p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Icon/Emoji */}
              <div className="text-5xl mb-3">{step.image || '🚀'}</div>

              {/* Title */}
              <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={goToPrevious}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-1 text-sm font-medium transition ${
                    currentStep === 0
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ChevronLeft size={16} />
                  Back
                </button>

                <button
                  onClick={goToNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shadow-sm"
                >
                  {isLastStep ? (
                    <>
                      <Check size={16} />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnimatedTour;