/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThumbsUp, Star, Calendar, AlertCircle } from 'lucide-react';
import { Profile } from '../types';
import { SkeletonFeedbackList } from './SkeletonCard';

interface FeedbackSubmission {
  id: string;
  business_name: string;
  rating: number;
  customer_name?: string;
  customer_ip?: string;
  created_at: string;
}

interface FeedbackViewProps {
  profile: Profile;
}

export default function FeedbackView({ profile }: FeedbackViewProps) {
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/feedback/submissions', {
          headers: { 'x-user-id': profile.id }
        });
        const data = await res.json();
        if (res.ok) {
          setSubmissions(data.submissions || []);
        } else {
          setError(data.error || 'Failed to load feedback');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeedback();
  }, [profile.id]);

  const totalResponses = submissions.length;
  const averageRating = totalResponses > 0
    ? (submissions.reduce((sum, s) => sum + s.rating, 0) / totalResponses).toFixed(1)
    : '—';

  const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: submissions.filter(s => s.rating === rating).length
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6" id="feedback-tab-container">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <ThumbsUp size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Customer Feedback</h1>
            <p className="text-xs text-slate-500 font-sans">
              See what your customers said after receiving your SMS invites, so the results of the SMS messages to your customers.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Responses</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalResponses}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Rating</span>
          <div className="text-3xl font-black text-slate-900 mt-2 flex items-center gap-2">
            {averageRating}
            <Star size={20} className="text-amber-400 fill-amber-400" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Happiness Score</span>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {totalResponses > 0
              ? `${Math.round((submissions.filter(s => s.rating >= 4).length / totalResponses) * 100)}%`
              : '—'}
          </div>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 mb-4">Rating Breakdown</h3>
        <div className="space-y-2">
          {ratingBreakdown.map(({ rating, count }) => (
            <div key={rating} className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-600 w-6">{rating}★</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${rating >= 4 ? 'bg-emerald-500' : rating === 3 ? 'bg-amber-400' : 'bg-red-500'}`}
                  style={{ width: totalResponses > 0 ? `${(count / totalResponses) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-slate-500 w-10">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-extrabold text-slate-900">Recent Submissions</h3>
        </div>

        {isLoading ? (
          <SkeletonFeedbackList />
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No feedback yet</p>
            <p className="text-xs text-slate-400">Send SMS invites to start collecting feedback.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 pl-6 font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Rating</th>
                  <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 pl-6 font-medium text-slate-800">
                      {sub.customer_name || 'Anonymous'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-900">{sub.rating}</span>
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sub.rating >= 4
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {sub.rating >= 4 ? 'Happy' : 'Unhappy'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 text-center">
        Only feedback submitted via your SMS review invites appears here.
      </div>
    </div>
  );
}