// src/components/SkeletonCard.tsx

import React from 'react';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="p-5 rounded-2xl border border-slate-200/50 bg-white/50 backdrop-blur-sm">
        {/* Customer name & rating */}
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded-lg" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-12 bg-slate-200 rounded-lg" />
              <div className="h-3 w-16 bg-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="h-5 w-16 bg-slate-200 rounded-full" />
        </div>

        {/* Review comment */}
        <div className="space-y-2 mb-4">
          <div className="h-3 w-full bg-slate-200 rounded-lg" />
          <div className="h-3 w-5/6 bg-slate-200 rounded-lg" />
          <div className="h-3 w-4/6 bg-slate-200 rounded-lg" />
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100/60 pt-3 flex items-center justify-between">
          <div className="h-3 w-20 bg-slate-200 rounded-lg" />
          <div className="h-4 w-16 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatsCard() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200/40 p-4 shadow-sm shadow-blue-100/20 animate-pulse">
      <div className="h-7 w-12 bg-slate-200 rounded-lg mb-1" />
      <div className="h-3 w-20 bg-slate-200 rounded-lg" />
      <div className="mt-2 h-0.5 w-8 rounded-full bg-slate-200" />
    </div>
  );
}

export function SkeletonReviewsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// src/components/SkeletonCard.tsx – Add this new component

export function SkeletonFeedbackItem() {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 animate-pulse">
      <div className="flex items-center gap-3 flex-1">
        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        
        <div className="flex-1 space-y-2">
          {/* Name placeholder */}
          <div className="h-4 w-32 bg-slate-200 rounded-lg" />
          
          {/* Comment placeholder */}
          <div className="h-3 w-48 bg-slate-200 rounded-lg" />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Rating placeholder */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-4 h-4 bg-slate-200 rounded" />
          ))}
        </div>
        {/* Date placeholder */}
        <div className="h-3 w-16 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonFeedbackList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonFeedbackItem key={i} />
      ))}
    </div>
  );
}