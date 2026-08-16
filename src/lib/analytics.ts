// src/lib/analytics.ts

const GA_MEASUREMENT_ID = 'G-70J4RXZNLD'; // Your GA ID
const APOLLO_APP_ID = '6a5bddec44f44200101425fe'; // Your Apollo ID

// ─── GOOGLE ANALYTICS ──────────────────────────────────────────────
export function loadGoogleAnalytics() {
  const consent = localStorage.getItem('cookieConsent');
  if (consent !== 'accepted' || (window as any).gtag) return;

  // Load the GA script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = function() {
    (window as any).dataLayer.push(arguments);
  };
  (window as any).gtag('js', new Date());
  (window as any).gtag('config', GA_MEASUREMENT_ID);

  console.log('📊 Google Analytics loaded');
}

// ─── APOLLO AI TRACKING ────────────────────────────────────────────
export function loadApolloTracking() {
  const consent = localStorage.getItem('cookieConsent');
  if (consent !== 'accepted') return;

  // Check if already loaded
  if (document.querySelector('script[src*="apollo.io"]')) return;

  const script = document.createElement('script');
  script.src = `https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=${Math.random().toString(36).substring(7)}`;
  script.async = true;
  script.defer = true;
  script.onload = function() {
    if ((window as any).trackingFunctions) {
      (window as any).trackingFunctions.onLoad({ appId: APOLLO_APP_ID });
    }
  };
  document.head.appendChild(script);

  console.log('🔄 Apollo tracking loaded');
}

// ─── LOAD ALL ANALYTICS ────────────────────────────────────────────
export function loadAnalytics() {
  loadGoogleAnalytics();
  loadApolloTracking();
}