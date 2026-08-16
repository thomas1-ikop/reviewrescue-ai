// src/components/CookieBanner.tsx
import React, { useState, useEffect } from 'react';
import { Check, Shield } from 'lucide-react';
import { loadAnalytics } from '../lib/analytics';

interface CookieBannerProps {
  navigate: (route: string) => void; // ✅ Accept the navigate function
}

export default function CookieBanner({ navigate }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  const acceptCookies = () => {
  localStorage.setItem('cookieConsent', 'accepted');
  setIsVisible(false);
  
  // ✅ Load analytics immediately after consent
  loadAnalytics();
};

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl p-4 md:p-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-blue-50 rounded-full shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">
              We use cookies to improve your experience.
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              By continuing, you agree to our use of cookies.{' '}
              {/* ✅ REPLACED <a> with a button using navigate */}
              <button
                onClick={() => navigate('cookie-policy')}
                className="text-blue-600 hover:underline font-medium inline-block"
              >
                Learn more
              </button>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
  <button
    onClick={declineCookies}
    className="flex-1 md:flex-none px-6 py-2.5 border-2 border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
  >
    Reject All
  </button>
  <button
    onClick={acceptCookies}
    className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
  >
    Accept All
  </button>
</div>  
      </div>
    </div>
  );
}