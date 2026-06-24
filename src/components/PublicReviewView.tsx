import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle2, 
  ExternalLink, 
  Mail, 
  Smile, 
  Frown, 
  MapPin,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

export default function PublicReviewView() {
  // Parse query parameters
  const params = new URLSearchParams(window.location.search);
  const businessName = params.get('business') || params.get('Business') || 'Our Business';
  const yelpUrl = params.get('yelpUrl') || params.get('yelpurl') || params.get('YelpUrl') || '';
  const placeId = params.get('placeId') || '';
  const email = params.get('email') || '';
  const userId = params.get('userId') || '';
  const customerName = params.get('customerName') || '';

  // Ratings States
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-submit feedback to backend when user clicks a star
  const handleSelectRating = async (selectedRating: number) => {
    if (isSubmitted || isSubmitting) return;

    setRating(selectedRating);
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
  business_name: businessName,
  rating: selectedRating,
  place_id: placeId,    // ✅ Use place_id, not user_id
  customer_name: customerName
})
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const errorData = await res.json();
        console.warn('Backend feedback submission error:', errorData);
        setIsSubmitted(true);
      }
    } catch (err) {
      console.warn('Network error during feedback submission:', err);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
        
        {/* Top Accent Stripe */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

        {/* Content Area */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="inline-block p-2.5 rounded-full bg-indigo-50 text-indigo-600 mb-2">
              <MessageSquare size={24} className="animate-pulse" style={{ animationDuration: '3s' }} />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Customer Feedback
            </h1>
            <p className="text-sm text-slate-500 font-sans">
              How was your experience at{' '}
              <strong className="text-slate-950 font-black">{businessName}</strong>?
            </p>
          </div>

          {/* Core Interactive Card */}
          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl relative">
            
            {/* Stars Selection Row */}
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = hoverRating !== null ? star <= hoverRating : rating !== null ? star <= rating : false;
                return (
                  <button
                    key={star}
                    id={`review-star-btn-${star}`}
                    disabled={isSubmitted || isSubmitting}
                    onMouseEnter={() => !isSubmitted && setHoverRating(star)}
                    onMouseLeave={() => !isSubmitted && setHoverRating(null)}
                    onClick={() => handleSelectRating(star)}
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

            {/* Hint message when no rating is selected */}
            {rating === null && (
              <p className="text-center text-[11px] text-slate-400 font-medium">
                Tap your custom star score to submit review.
              </p>
            )}

            {/* Submitted Feedback States */}
            {isSubmitted && rating !== null && (
              <div className="space-y-4 border-t border-slate-200/60 pt-4 mt-2 text-center animate-fade-in">
                
                {/* Standard Thank You Banner */}
                <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-xs font-bold font-sans">
                  <CheckCircle2 size={14} className="shrink-0" />
                  Thanks for your feedback!
                </div>

                {/* POSITIVE CONVERSION STATE (Rating >= 4) */}
                {rating >= 4 ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="text-center space-y-1">
                      <div className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-yellow-100">
                        <Smile size={10} /> Outstanding score!
                      </div>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Since you had an exceptional experience, would you mind sharing your review publicly on Google to help potential customers find us? It takes under 30 seconds!
                      </p>
                    </div>

                    <div className="space-y-2">
                      {placeId ? (
                        <a
                          href={`https://search.google.com/local/writereview?placeid=${placeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 transition shadow duration-150 text-white rounded-xl text-xs font-black"
                          id="btn-public-review-google"
                        >
                          Leave review on Google Maps
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2 text-left">
                          <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-amber-700 font-sans leading-relaxed">
                            Please search for{' '}
                            <strong className="font-extrabold">{businessName}</strong> on Google
                            Maps directly to leave your review.
                          </p>
                        </div>
                      )}

                      {/* Optional Yelp Integration conversion */}
                      {yelpUrl && (
                        <a
                          href={yelpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 transition text-white rounded-xl text-xs font-extrabold"
                          id="btn-public-review-yelp"
                        >
                          Review us on Yelp
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  /* CRITICAL CONTACT MITIGATION STATE (Rating <= 3) */
                  <div className="space-y-4 animate-fade-in text-center">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-rose-100">
                        <Frown size={10} /> We missed the mark
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        We genuinely apologize that your visit fell short. Rather than updating Google, we prefer resolving this directly. Please contact our leadership so we can rectify this for you.
                      </p>
                    </div>

                    {email ? (
                      <div className="space-y-3">
                        <a
                          href={`mailto:${email}?subject=Feedback regarding my experience at ${encodeURIComponent(businessName)}`}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 transition text-white rounded-xl text-xs font-black shadow"
                          id="btn-contact-mitigation-email"
                        >
                          <Mail size={14} />
                          Contact Us Directly
                        </a>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Direct Line: <span className="font-extrabold text-slate-600">{email}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Our management team has been notified and will address this issue with priority.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subtle informational bottom bar */}
          <div className="text-center text-[10px] text-slate-400 font-sans flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4">
            <span className="font-semibold">{businessName} verified feedback channel</span>
            <span>&bull;</span>
            <span className="font-mono">Rewakely &copy; 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}