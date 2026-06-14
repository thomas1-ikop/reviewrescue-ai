/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlusCircle, MessageSquareShare, Sparkles, Pencil, CheckCircle2, ShieldX, CornerDownRight, ThumbsUp } from 'lucide-react';
import { Review, Profile, ReviewSource } from '../types';

interface ReviewsViewProps {
  profile: Profile;
  reviews: Review[];
  onImportReview: (reviewData: { customerName: string; rating: number; comment: string; source: ReviewSource }) => Promise<void>;
  onGenerateReply: (review: Review) => Promise<string | null>;
  onPostReply: (reviewId: string, replyText: string) => Promise<void>;
  isLoadingReviews: boolean;
  repliedCountThisMonth: number;
}

export default function ReviewsView({
  profile,
  reviews,
  onImportReview,
  onGenerateReply,
  onPostReply,
  isLoadingReviews,
  repliedCountThisMonth
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
  const quotaLimit = profile.subscription_plan === 'starter' ? 50 : 200;
  const isUnlimited = profile.subscription_plan === 'pro';
  const usedGenerations = repliedCountThisMonth;
  const isQuotaExceeded = !isUnlimited && usedGenerations >= quotaLimit;

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
            Paste review comments received externally or simulate incoming reviews to generate, edit and save professional replies.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {!isUnlimited && (
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Plan Usage</span>
              <span className={`text-sm font-bold ${isQuotaExceeded ? 'text-red-600' : 'text-slate-700'}`}>
                {usedGenerations} / {quotaLimit} Replies Used
              </span>
              <div className="w-32 bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${isQuotaExceeded ? 'bg-red-500' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min(100, (usedGenerations / quotaLimit) * 100)}%` }} 
                />
              </div>
            </div>
          )}
          {isUnlimited && (
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Plan Usage</span>
              <span className="text-sm font-bold text-emerald-600">Unlimited AI Replies</span>
            </div>
          )}

          <button
            onClick={() => setShowImportForm(!showImportForm)}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold transition shadow-sm"
          >
            <PlusCircle size={18} />
            Import Review
          </button>
        </div>
      </div>

      {/* Review Import Form (Draw-down modal/card) */}
      {showImportForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Import Customer Review</h3>
            <button 
              onClick={() => setShowImportForm(false)}
              className="text-slate-400 hover:text-slate-600 text-sm"
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
                      className="text-2xl transition hover:scale-115"
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
              className="rounded-xl bg-slate-800 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-900 transition disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Save Review'}
            </button>
          </form>
        </div>
      )}

      {/* Main Review Section Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 items-start">
        
        {/* Left Column: Review Feed list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Target Reviews Feed ({reviews.length})</h3>
              <span className="text-xs text-slate-400">Click a review to focus generator</span>
            </div>

            {isLoadingReviews ? (
              <div className="p-8 text-center" id="reviews-loader">
                <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs text-slate-400">Fetching reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-sans">
                <MessageSquareShare size={36} className="mx-auto text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700 text-sm">Your feedback log is empty!</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Click 'Import Review' to paste feedback from Google, Yelp or social networks. All AI capabilities are active once loaded.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
                {reviews.map((rev) => {
                  const isSelected = selectedReview?.id === rev.id;
                  const isReplied = rev.status === 'replied';

                  return (
                    <div
                      key={rev.id}
                      onClick={() => {
                        setSelectedReview(rev);
                        setAiResponse(rev.reply_text || '');
                        setAiError(null);
                      }}
                      className={`p-5 cursor-pointer transition relative hover:bg-slate-50 ${
                        isSelected ? 'bg-blue-50/10 border-l-4 border-blue-600' : ''
                      }`}
                      id={`review-item-${rev.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-extrabold text-slate-950 text-sm">{rev.customer_name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-amber-500 font-bold text-xs">★ {rev.rating}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                              {rev.source}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] ml-auto font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          isReplied 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {isReplied ? 'Replied' : 'Pending Action'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mt-2 font-sans">
                        "{rev.comment}"
                      </p>

                      {rev.is_autopilot && (
                        <div className="mt-2 flex items-center gap-1 bg-emerald-50 text-[10px] font-bold text-emerald-700 px-1.5 py-0.5 rounded w-max">
                          <Sparkles size={10} /> Auto-Pilot Responded
                        </div>
                      )}

                      <span className="text-[9px] text-slate-400 block mt-2">
                        {new Date(rev.created_at).toLocaleDateString()} at {new Date(rev.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Generator and Editor workspace */}
        <div className="lg:col-span-2">
          {selectedReview ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5" id="ai-workspace">
              
              {/* Target review summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 font-sans">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-400">Review Focus</span>
                  <span className={`text-xs font-semibold ${selectedReview.rating >= 4 ? 'text-emerald-600' : 'text-red-500'}`}>
                    ★ {selectedReview.rating} Star Rating
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedReview.customer_name}</h4>
                <p className="text-xs text-slate-600 mt-2 font-light italic leading-relaxed">
                  "{selectedReview.comment}"
                </p>
              </div>

              {/* Generating Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    AI Rescue Assistant
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Tone: {profile.tone || 'Friendly'}
                  </span>
                </div>

                {isQuotaExceeded ? (
                  <div className="bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-100 text-xs">
                    <span className="font-bold">Quota Reached!</span> You've consumed all monthly replies for your Starter plan. Please upgrade to Growth or Pro to generate more.
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGenerating || isQuotaExceeded}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-3 shadow-sm transition"
                    id="btn-generate-ai-reply"
                  >
                    <Sparkles size={14} className="animate-pulse" />
                    {isGenerating ? 'Generative AI Thinking...' : 'Generate Smart AI Reply'}
                  </button>
                )}

                {aiError && (
                  <div className="bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-100 text-xs font-sans">
                    {aiError}
                  </div>
                )}
              </div>

              {/* Reply workspace Editor */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Reply Workspace
                </label>
                <textarea
                  placeholder="The generated response will populate here. Customize or review text freely prior to publishing..."
                  rows={6}
                  value={aiResponse}
                  onChange={(e) => setAiResponse(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-xs text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 bg-white"
                />

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CornerDownRight size={14} className="text-slate-400" />
                  <span>The final reply will be stored securely.</span>
                </div>
              </div>

              {/* Reply Publication Actions */}
              <button
                onClick={handlePostReplySubmit}
                disabled={isSavingReply || !aiResponse}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 shadow-md transition disabled:opacity-50"
                id="btn-publish-reply"
              >
                <CheckCircle2 size={14} />
                {isSavingReply ? 'Publishing Reply...' : 'Post & Save Reply'}
              </button>

            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 font-sans min-h-[300px] flex flex-col justify-center items-center">
              <Sparkles size={28} className="text-slate-300 mb-2" />
              <h4 className="font-semibold text-slate-700 text-sm">No Review Active</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Select any customer feedback card in the list to trigger generative responses and customize replies.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
