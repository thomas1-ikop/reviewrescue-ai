/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlusCircle, MessageSquareShare, Sparkles, Pencil, CheckCircle2, ShieldX, CornerDownRight, ThumbsUp, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Review, Profile, ReviewSource } from '../types';


interface ReviewsViewProps {
  profile: Profile;
  reviews: Review[];
  onImportReview: (reviewData: { customerName: string; rating: number; comment: string; source: ReviewSource }) => Promise<void>;
  onGenerateReply: (review: Review) => Promise<string | null>;
  onPostReply: (reviewId: string, replyText: string) => Promise<void>;
  isLoadingReviews: boolean;
  repliedCountThisMonth: number;
  onDeleteReview: (reviewId: string) => Promise<void>;      // ✅ NEW
  onClearAllReviews: () => Promise<void>;                   // ✅ NEW
}

function PlatformIllustration({ source }: { source: ReviewSource }) {
  switch (source) {
    case 'google':
      return (
        <div className="relative h-28 w-full rounded-2xl bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 p-0.5 shadow-md overflow-hidden">
          <div className="h-full w-full bg-slate-950 rounded-[14px] flex flex-col justify-center p-4 relative">
            <div className="absolute right-3 bottom-0 opacity-15 text-white font-sans text-5xl font-black select-none pointer-events-none">
              GOOGLE
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight">Google Reviews</span>
            <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">Official Google Profile Connection</span>
          </div>
        </div>
      );
    case 'yelp':
      return (
        <div className="relative h-28 w-full rounded-2xl bg-gradient-to-br from-red-650 via-rose-500 to-orange-500 p-0.5 shadow-md overflow-hidden">
          <div className="h-full w-full bg-slate-950 rounded-[14px] flex flex-col justify-center p-4 relative">
            <div className="absolute right-3 bottom-0 opacity-15 text-white font-sans text-5xl font-black select-none pointer-events-none">
              YELP
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight">Yelp Marketplace</span>
            <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">Local Business & Food Reviews</span>
          </div>
        </div>
      );
    case 'facebook':
      return (
        <div className="relative h-28 w-full rounded-2xl bg-gradient-to-br from-blue-800 via-blue-600 to-sky-400 p-0.5 shadow-md overflow-hidden">
          <div className="h-full w-full bg-slate-950 rounded-[14px] flex flex-col justify-center p-4 relative">
            <div className="absolute right-3 bottom-0 opacity-15 text-white font-sans text-5xl font-black select-none pointer-events-none">
              META
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight">Facebook Business Page</span>
            <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">Social Media Integration Hub</span>
          </div>
        </div>
      );
    default:
      return (
        <div className="relative h-28 w-full rounded-2xl bg-gradient-to-br from-slate-700 via-slate-600 to-slate-450 p-0.5 shadow-md overflow-hidden">
          <div className="h-full w-full bg-slate-950 rounded-[14px] flex flex-col justify-center p-4 relative">
            <div className="absolute right-3 bottom-0 opacity-15 text-white font-sans text-5xl font-black select-none pointer-events-none">
              MANUAL
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight">Direct Upload / Manual</span>
            <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">Custom Input Workspace Form</span>
          </div>
        </div>
      );
  }
}

export default function ReviewsView({
  profile,
  reviews,
  onImportReview,
  onGenerateReply,
  onPostReply,
  isLoadingReviews,
  repliedCountThisMonth,
  onDeleteReview,        // ✅ NEW
  onClearAllReviews      // ✅ NEW
}: ReviewsViewProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  // Import form state
  const [showImportForm, setShowImportForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [source, setSource] = useState<ReviewSource>('google');
  const [isImporting, setIsImporting] = useState(false);

  // Generative AI response edit state
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Quota indicators
  const isUnlimited = true;
  const isQuotaExceeded = false;

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !comment) return;
    setIsImporting(true);
    try {
      await onImportReview({ customerName, rating, comment, source });
      setCustomerName('');
      setComment('');
      setRating(5);
      setShowImportForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedReview) return;
    setIsGenerating(true);
    setAiError(null);
    try {
      const generated = await onGenerateReply(selectedReview);
      if (generated) {
        setAiResponse(generated);
      }
    } catch (err: any) {
      setAiError(err.message || 'AI Reply generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostReplySubmit = async () => {
    if (!selectedReview || !aiResponse) return;
    setIsSavingReply(true);
    try {
      await onPostReply(selectedReview.id, aiResponse);
      setSelectedReview({
        ...selectedReview,
        status: 'replied',
        reply_text: aiResponse,
        replied_at: new Date().toISOString()
      });
      setAiResponse('');
      setSelectedReview(null); // Close the drawer for clean UX on success!
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action header and quota counter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">Review Center</h2>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Paste review comments received externally or view Google synced records to manage reviews.
          </p>
        </div>
        
        <div className="flex items-center gap-4 shrink-0 font-sans">
  <div className="text-right">
    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Plan Usage</span>
    <span className="text-sm font-bold text-emerald-600">Pro Plan • Unlimited AI Replies</span>
  </div>

  {reviews.length > 0 && (
    <button
  onClick={() => onClearAllReviews()} // This now triggers the modal
  className="flex items-center gap-2 rounded-xl border border-red-300 hover:bg-red-50 text-red-600 px-4 py-2.5 text-xs font-semibold transition"
>
  <Trash2 size={14} />
  Clear All
</button>
  )}

  <button
    onClick={() => setShowImportForm(!showImportForm)}
    className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold transition shadow-sm cursor-pointer"
  >
    <PlusCircle size={18} />
    Import Review
  </button>
</div>
      </div>

      {/* Review Import Form (Draw-down modal/card) */}
      {showImportForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Import Customer Review</h3>
            <button 
              onClick={() => setShowImportForm(false)}
              className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Liam Henderson"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Review Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as ReviewSource)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
                >
                  <option value="google">Google Business</option>
                  <option value="yelp">Yelp</option>
                  <option value="facebook">Facebook Pages</option>
                  <option value="manual">Other / Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Star Rating (1 - 5)
                </label>
                <div className="flex items-center gap-1 h-[42px]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-2xl transition hover:scale-115 cursor-pointer"
                    >
                      <span className={star <= rating ? 'text-amber-500' : 'text-slate-200'}>★</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Review Comments *
              </label>
              <textarea
                placeholder="Paste the review comment here..."
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isImporting}
              className="rounded-xl bg-slate-800 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-900 transition disabled:opacity-50 cursor-pointer"
            >
              {isImporting ? 'Importing...' : 'Save Review'}
            </button>
          </form>
        </div>
      )}

      {/* Main Review Section (A clean, spacious full-width list representation) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="workspace-reviews-list-container">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm">Target Reviews Feed ({reviews.length})</h3>
          <span className="text-xs text-slate-400">Click any card to edit & generate replies in detail focus drawer</span>
        </div>

        {isLoadingReviews ? (
          <div className="p-12 text-center" id="reviews-loader">
            <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-400 font-medium">Fetching active reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-sans">
            <MessageSquareShare size={40} className="mx-auto text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-700 text-sm">Your review feed is empty!</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click 'Import Review' to add reviews from Google, Yelp or select manual sync.
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((rev) => {
                const isReplied = rev.status === 'replied';

                return (
                  <div
  key={rev.id}
  onClick={() => {
    setSelectedReview(rev);
    setAiResponse(rev.reply_text || '');
    setAiError(null);
  }}
  className={`p-5 rounded-2xl border border-slate-200 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-slate-350 bg-white relative flex flex-col justify-between ${
    selectedReview?.id === rev.id ? 'ring-2 ring-blue-600/10 border-blue-600 bg-blue-50/5' : ''
  }`}
  id={`review-card-item-${rev.id}`}
>
  <div>
    <div className="flex justify-between items-start mb-3 gap-2">
      <div>
        <span className="font-extrabold text-slate-950 text-sm">{rev.customer_name}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-amber-500 font-bold text-xs">★ {rev.rating}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
            {rev.source}
          </span>
        </div>
      </div>

      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
        isReplied 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
          : 'bg-amber-50 text-amber-700 border-amber-100'
      }`}>
        {isReplied ? 'Replied' : 'Pending'}
      </span>
    </div>

    <p className="text-xs text-slate-600 leading-relaxed font-sans line-clamp-3 italic mb-4">
      "{rev.comment}"
    </p>
  </div>

  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400">
    <span>
      {new Date(rev.created_at).toLocaleDateString()}
    </span>
    {rev.is_autopilot && (
      <span className="flex items-center gap-1 text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">
        <Sparkles size={10} /> Auto-Reply
      </span>
    )}
  </div>

  {/* ✅ DELETE BUTTON */}
  <button
  onClick={(e) => {
    e.stopPropagation();
    onDeleteReview(rev.id); // This now triggers the modal
  }}
  className="absolute bottom-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
  title="Delete this review"
>
  <Trash2 size={14} />
</button>
</div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Slide-out details drawer focused experience */}
      <AnimatePresence>
        {selectedReview && (
          <>
            {/* Dark blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReview(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
            />

            {/* Slide-in container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 180 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg md:max-w-2xl bg-white shadow-2xl z-50 flex flex-col h-full overflow-hidden border-l border-slate-200"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-200 px-2.5 py-1 rounded-full">
                    {selectedReview.source} Review details
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-150 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Platform illustration panel */}
                <PlatformIllustration source={selectedReview.source} />

                {/* Review customer info */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-black text-slate-900">{selectedReview.customer_name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Received on {new Date(selectedReview.created_at).toLocaleDateString()} at {new Date(selectedReview.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-amber-500 text-lg font-black">★ {selectedReview.rating}</span>
                        <span className="text-xs text-slate-400">/5 Stars</span>
                      </div>
                      <span className={`inline-block text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full mt-1.5 border ${
                        selectedReview.status === 'replied' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {selectedReview.status === 'replied' ? 'Replied' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/60 pt-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Review Comment</span>
                    <p className="text-sm text-slate-700 leading-relaxed italic bg-white p-3.5 rounded-xl border border-slate-100 font-sans">
                      "{selectedReview.comment}"
                    </p>
                  </div>
                </div>

                {/* AI Assistant interface */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">AI Review Assistant</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">Tone: {profile.tone || 'Friendly'}</span>
                  </div>

                  <button
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-3 shadow transition disabled:opacity-50 cursor-pointer"
                    id="drawer-btn-generate-ai-reply"
                  >
                    <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
                    {isGenerating ? 'Generative AI Thinking...' : 'Generate Smart AI Reply'}
                  </button>

                  {aiError && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-xs font-sans">
                      {aiError}
                    </div>
                  )}
                </div>

                {/* Text response Editor */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-755 uppercase tracking-wider block">
                    Tailor Response (Edit Reply)
                  </label>
                  <textarea
                    placeholder="The AI-generated reply will populate here to tweak, or you can write your response from scratch prior to publishing."
                    rows={5}
                    value={aiResponse}
                    onChange={(e) => setAiResponse(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-4 text-xs text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 bg-white leading-relaxed"
                  />
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <CornerDownRight size={12} />
                    <span>Saving this reply updates status to "Replied".</span>
                  </div>
                </div>

                {selectedReview.is_autopilot && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3.5 rounded-xl font-medium">
                    <Sparkles size={14} className="text-emerald-600 shrink-0" />
                    <span>Auto-Reply replied to this review instantly.</span>
                  </div>
                )}
              </div>

              {/* Footer publication triggers */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="flex-1 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs py-3 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePostReplySubmit}
                  disabled={isSavingReply || !aiResponse}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 shadow-md transition disabled:opacity-50 cursor-pointer"
                  id="drawer-btn-publish"
                >
                  <CheckCircle2 size={14} />
                  {isSavingReply ? 'Saving Reply...' : 'Post & Save Reply'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
