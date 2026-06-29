// src/components/PublicReviewView.tsx
import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle2, 
  ExternalLink, 
  Mail, 
  Smile, 
  Frown, 
  MessageSquare,
  AlertCircle,
  Loader2,
  MapPin
} from 'lucide-react';

interface BusinessData {
  business_name: string | null;
  place_id: string | null;
  contact_email: string | null;
}

export default function PublicReviewView() {
  const params = new URLSearchParams(window.location.search);
  const businessId = params.get('business') || '';
  const customerNameParam = params.get('customerName') || '';
  const placeIdParam = params.get('placeId') || '';
  const emailParam = params.get('email') || '';

  // ── STATE ──
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [customerName, setCustomerName] = useState<string>(customerNameParam);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── FETCH BUSINESS DATA ─────────────────────────────────────────
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!businessId) {
        setErrorMsg('Invalid business link. Please contact the business directly.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/business/${businessId}`);
        
        if (!res.ok) {
          throw new Error('Business not found');
        }

        const data = await res.json();
        setBusinessData({
          business_name: data.business_name || 'Our Business',
          place_id: data.place_id || null,
          contact_email: data.contact_email || null,
        });
      } catch (err) {
        console.error('Failed to fetch business:', err);
        setErrorMsg('Could not load business information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [businessId]);

  // ── HANDLE SUBMISSION ───────────────────────────────────────────
  const handleSelectRating = async (selectedRating: number) => {
    if (isSubmitted || isSubmitting) return;

    if (!customerName.trim()) {
      setErrorMsg('Please enter your name before submitting.');
      return;
    }

    setRating(selectedRating);
    setIsSubmitting(true);
    setErrorMsg(null);
    setDuplicateMessage(null);

    const businessName = businessData?.business_name || 'Our Business';
    const placeId = businessData?.place_id || placeIdParam;

    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          rating: selectedRating,
          place_id: placeId,
          customer_name: customerName.trim(),
          business_id: businessId,
        }),
      });

      const data = await res.json();

      // Duplicate check
      if (res.status === 409 && data.error === 'already_reviewed') {
        setDuplicateMessage(
          data.message || `You've already shared your feedback with ${businessName}. Thank you for your support!`
        );
        setIsSubmitted(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setIsSubmitted(false);
    setErrorMsg(null);
    setDuplicateMessage(null);
    setRating(null);
  };

  // ─── LOADING ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // ─── ERROR ───────────────────────────────────────────────────────
  if (errorMsg && !isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
          <p className="text-sm text-slate-500 mt-2">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const businessName = businessData?.business_name || 'Our Business';
  const placeId = businessData?.place_id || placeIdParam;
  const contactEmail = businessData?.contact_email || emailParam;

  // ─── DUPLICATE / ALREADY REVIEWED ──────────────────────────────
  if (isSubmitted && duplicateMessage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Already Reviewed!</h2>
            <p className="text-sm text-slate-500 mt-2">{duplicateMessage}</p>
            <p className="text-xs text-slate-400 mt-4">Thank you for being a valued customer.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── SUCCESS STATE ──────────────────────────────────────────────
  if (isSubmitted && rating !== null) {
    const isPositive = rating >= 4;
    
    // Build the Google Maps review link
    const googleReviewLink = placeId
      ? `https://search.google.com/local/writereview?placeid=${placeId}`
      : null;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
          <div className={`h-2 ${isPositive ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} />
          
          <div className="p-8 space-y-5">
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-slate-100">
                {isPositive ? (
                  <Smile className="w-8 h-8 text-emerald-500" />
                ) : (
                  <Frown className="w-8 h-8 text-amber-500" />
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Thank you, {customerName.trim() || 'valued customer'}!
              </h2>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    fill={star <= rating ? '#EAB308' : 'none'}
                    className={star <= rating ? 'text-yellow-500' : 'text-slate-300'}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                You rated {businessName} {rating} stars
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              {isPositive ? (
                // ─── 4-5 STARS: Google Maps Review Link ────────────────
                <div className="space-y-3">
                  {googleReviewLink ? (
                    <>
                      <p className="text-sm text-slate-600 text-center">
                        ⭐ You had a great experience! Would you mind sharing it publicly on Google Maps?
                      </p>
                      <a
                        href={googleReviewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-100"
                      >
                        <MapPin className="w-4 h-4" />
                        Write a Review on Google Maps
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <p className="text-[10px] text-slate-400 text-center">
                        This will open Google Maps where you can leave your review
                      </p>
                    </>
                  ) : (
                    // Fallback if no place_id
                    <div className="text-center">
                      <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl">
                        ⚠️ This business hasn't set up their Google Maps link yet.
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        Please search for {businessName} on Google Maps to leave your review.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // ─── 1-3 STARS: Contact Information ─────────────────────
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 text-center">
                    We're sorry your experience wasn't perfect. Please contact the business directly so they can make it right.
                  </p>
                  
                  {contactEmail ? (
                    <a
                      href={`mailto:${contactEmail}?subject=Feedback about my experience at ${encodeURIComponent(businessName)}`}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition text-white rounded-xl text-sm font-semibold shadow-lg shadow-slate-100"
                    >
                      <Mail className="w-4 h-4" />
                      Contact the Owner
                    </a>
                  ) : (
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500">
                        📧 The business owner will reach out to you directly to address your concerns.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Please expect a response within 1-2 business days.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
              {businessName} verified feedback channel &bull; Rewakely &copy; 2026
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN FORM ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="inline-block p-2.5 rounded-full bg-indigo-50 text-indigo-600 mb-2">
              <MessageSquare size={24} className="animate-pulse" style={{ animationDuration: '3s' }} />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Customer Feedback
            </h1>
            <p className="text-sm text-slate-500">
              How was your experience at{' '}
              <strong className="text-slate-900 font-extrabold">{businessName}</strong>?
            </p>
          </div>

          {/* Form */}
          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
            {/* Name input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = hoverRating !== null 
                  ? star <= hoverRating 
                  : rating !== null 
                    ? star <= rating 
                    : false;
                return (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => handleSelectRating(star)}
                    disabled={isSubmitting}
                    className="focus:outline-none transition-all active:scale-90 hover:scale-110 disabled:scale-100 disabled:opacity-50 cursor-pointer p-1"
                  >
                    <Star
                      size={36}
                      fill={isActive ? '#EAB308' : 'none'}
                      className={`transition-colors duration-200 ${
                        isActive ? 'text-yellow-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {!rating && !isSubmitting && (
              <p className="text-center text-[11px] text-slate-400 font-medium">
                Tap a star to submit your review
              </p>
            )}

            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-slate-500">Submitting...</span>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-center">
                <AlertCircle className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                {errorMsg}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4">
            <span className="font-semibold">{businessName} verified feedback channel</span>
            <span>&bull;</span>
            <span className="font-mono">Rewakely &copy; 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}