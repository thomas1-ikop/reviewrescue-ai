// src/components/SmsTour.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, Check, 
  Sparkles, Smartphone, Bot, Upload, Zap, Rocket, ThumbsUp
} from 'lucide-react';

interface SmsTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
}

const SmsTour: React.FC<SmsTourProps> = ({ isOpen, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [highlightRect, setHighlightRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  const steps: TourStep[] = [
    {
      id: 'intro',
      title: '📱 Send Review Invites',
      description: 'Collect more reviews automatically. Send SMS invites to customers after their visit. Happy customers go to Google Maps, unhappy customers contact you directly.',
      icon: <Smartphone className="w-6 h-6 text-blue-500" />,
      target: '#tour-sidebar-sms',
    },
    {
      id: 'manual',
      title: '✉️ Manual Send',
      description: 'Send a one-off invite instantly. Enter a customer name and phone number, then click "Send Invite". Perfect for testing or special occasions.',
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      target: '.manual-send-section',
    },
    {
      id: 'autosend',
      title: '🤖 Auto-Send',
      description: 'Automatically send invites X days after a visit. Toggle it ON, set your delay, and let the system do the work. Your customers will receive invites without you lifting a finger.',
      icon: <Bot className="w-6 h-6 text-purple-500" />,
      target: '.auto-send-section',
    },
    {
      id: 'import',
      title: '📥 Import Customers',
      description: 'Paste your customer list or upload a file. AI will extract names, phones, and visit dates automatically. No formatting needed – just paste and go.',
      icon: <Upload className="w-6 h-6 text-emerald-500" />,
      target: '.customer-importer',
    },
    {
      id: 'stats',
      title: '📊 Track Your Progress',
      description: 'See your upcoming sends, sent invites, and response rate. All your SMS performance at a glance.',
      icon: <Sparkles className="w-6 h-6 text-blue-500" />,
      target: '.controls-stats-block',
    },
    {
    id: 'feedback',
    title: '📋 Customer Feedback',
    description: 'View all your customer responses in one place. See who gave you a 5-star review, who wasn\'t happy, and track your overall customer satisfaction.',
    icon: <ThumbsUp className="w-6 h-6 text-emerald-500" />,
    target: '#tour-sidebar-feedback',
  },
    {
      id: 'done',
      title: '🚀 You\'re Ready to Go!',
      description: 'You\'re all set to start collecting reviews via SMS. Import your first customers, set your delay, and let Rewakely do the rest.',
      icon: <Rocket className="w-6 h-6 text-emerald-500" />,
      target: undefined,
    },
  ];

  const totalSteps = steps.length;
  const step = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  // Function to update the highlight position
  const updateHighlight = () => {
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect({
          left: rect.left - 8,
          top: rect.top - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        });
        setTargetElement(element);
        element.classList.add('tour-highlight');
        // Scroll into view if not fully visible
        if (rect.top < 0 || rect.bottom > window.innerHeight || rect.left < 0 || rect.right > window.innerWidth) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return element;
      } else {
        // If element not found, try again after a short delay
        if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
        updateTimerRef.current = setTimeout(updateHighlight, 300);
      }
    } else {
      setHighlightRect(null);
      setTargetElement(null);
    }
    return null;
  };

  // Update highlight on step change and on resize/scroll
  useEffect(() => {
    // Remove previous highlight
    if (targetElement) {
      targetElement.classList.remove('tour-highlight');
    }
    // Clear any pending timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    // Use requestAnimationFrame to ensure layout is stable
    requestAnimationFrame(() => {
      updateHighlight();
    });

    // Recalculate on window resize or scroll
    const handleRecalc = () => {
      if (step.target) {
        updateHighlight();
      }
    };
    window.addEventListener('resize', handleRecalc);
    window.addEventListener('scroll', handleRecalc, true);

    return () => {
      if (targetElement) {
        targetElement.classList.remove('tour-highlight');
      }
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      window.removeEventListener('resize', handleRecalc);
      window.removeEventListener('scroll', handleRecalc, true);
    };
  }, [currentStep, step.target]);

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
    if (targetElement) {
      targetElement.classList.remove('tour-highlight');
    }
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (targetElement) {
      targetElement.classList.remove('tour-highlight');
    }
    onSkip();
  };

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" />

      {/* Spotlight effect */}
      {highlightRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: highlightRect.left,
            top: highlightRect.top,
            width: highlightRect.width,
            height: highlightRect.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.4), 0 0 0 2px #3b82f6, 0 8px 30px rgba(0,0,0,0.15)',
            borderRadius: '12px',
            transition: 'left 0.2s ease, top 0.2s ease, width 0.2s ease, height 0.2s ease',
          }}
        />
      )}

      {/* Tour card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pointer-events-auto max-w-md w-full mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50"
          >
            {/* Progress bar */}
            <div className="h-1 bg-slate-100 w-full">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">SMS Tour</span>
                </div>
                <button onClick={handleSkip} className="text-slate-400 hover:text-slate-600 transition p-1">
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/50">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>

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
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={goToNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-slate-900/20 hover:shadow-slate-800/30"
                >
                  {isLastStep ? (
                    <>
                      <Check size={16} /> Get Started
                    </>
                  ) : (
                    <>Next <ChevronRight size={16} /></>
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

export default SmsTour;