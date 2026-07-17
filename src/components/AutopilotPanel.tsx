import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Activity, 
  ToggleLeft, 
  ToggleRight,
  ShieldAlert
} from 'lucide-react';
import { Profile } from '../types';
import DisconnectModal from './DisconnectModal';

interface AutopilotLog {
  id: string;
  review_customer_name: string;
  review_text: string;
  rating: number;
  generated_reply: string;
  status: string;
  timestamp: string;
}

interface AutopilotPanelProps {
  profile: Profile;
  onProfileUpdated: (updated: Profile) => void;
  toast: (message: string, type: 'success' | 'error' | 'warn' | 'info') => void; // 👈 Add this
}

export default function AutopilotPanel({ profile, onProfileUpdated, toast }: AutopilotPanelProps) {
  const [isEnabled, setIsEnabled] = useState(profile.autopilot_enabled || false);
  const [logs, setLogs] = useState<AutopilotLog[]>([]);
  const [totalReplies, setTotalReplies] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(profile.last_google_sync || null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const [gmbConnected, setGmbConnected] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
const [isDisconnecting, setIsDisconnecting] = useState(false);

  // States for unresolved Google Negative reviews
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [isReplyingToId, setIsReplyingToId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;

  const fetchGmbStatus = async () => {
    try {
      const res = await fetch('/api/google/status', {
        headers: { 'x-user-id': profile.id }
      });
      if (res.ok) {
        const data = await res.json();
        setGmbConnected(data.connected);
        setLocationName(data.location_name);
      }
    } catch (e) {
      console.error('Failed to get Google status:', e);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleConnectGmb = () => {
    const width = 600;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      `/api/auth/google?userId=${profile.id}`,
      'Connect Google My Business',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );

    const messageListener = (event: MessageEvent) => {
      if (event.data && event.data.type === 'OAUTH_AUTH_SUCCESS') {
        fetchGmbStatus();
        fetchStatsAndLogs();
      }
    };

    window.addEventListener('message', messageListener);
  };

  // ─── DISCONNECT HANDLERS ──────────────────────────────────────
const handleDisconnectClick = () => {
  setShowDisconnectModal(true);
};

const handleDisconnectConfirm = async () => {
  setIsDisconnecting(true);
  try {
    const response = await fetch('/api/google/disconnect', {
      method: 'POST',
      headers: { 'x-user-id': profile.id }
    });
    if (response.ok) {
      setGmbConnected(false);
      setLocationName(null);
      // Refresh stats after disconnect
      fetchStatsAndLogs();
    } else {
      console.error('Disconnect failed');
    }
  } catch (err) {
    console.error('Error disconnecting:', err);
  } finally {
    setIsDisconnecting(false);
    setShowDisconnectModal(false);
  }
};



  const fetchStatsAndLogs = async () => {
    setIsLoadingLogs(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`/api/autopilot/stats?userId=${profile.id}`, {
        headers: { 'x-user-id': profile.id }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setTotalReplies(statsData.totalAutoReplies);
        setLastSync(statsData.lastGoogleSync);
        setIsEnabled(statsData.autopilotEnabled);
      }

      // 2. Fetch Logs
      const logsRes = await fetch(`/api/autopilot/logs?userId=${profile.id}`, {
        headers: { 'x-user-id': profile.id }
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      // 3. Fetch All Reviews to find pending negative Google reviews (rating <= 3)
      const reviewsRes = await fetch('/api/reviews', {
        headers: { 'x-user-id': profile.id }
      });
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        const allReviews = reviewsData.reviews || [];
        const pendingNegatives = allReviews.filter((r: any) => 
          r.source === 'google' && r.rating <= 3 && r.status === 'pending' && !r.reply_text
        );
        setPendingReviews(pendingNegatives);
      }
    } catch (err) {
      console.error('Failed to resolve stats or logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSimulate = async () => {
  try {
    const res = await fetch('/api/reviews/simulate-google', {
      method: 'POST',
      headers: { 'x-user-id': profile.id }
    });
    const data = await res.json();
    if (data.reviews) {
      toast('🎉 4 Simulated Google Reviews added!', 'success');
      // Refresh stats and logs
      fetchStatsAndLogs();
    }
  } catch (err: any) {
    toast('Failed to simulate reviews', 'error');
    console.error(err);
  }
};

  const handleSendReply = async (reviewId: string) => {
    const draftText = replyDrafts[reviewId]?.trim();
    if (!draftText) return;
    setIsReplyingToId(reviewId);
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': profile.id
        },
        body: JSON.stringify({ reviewId, replyText: draftText })
      });
      if (res.ok) {
        // Clear draft
        setReplyDrafts(prev => {
          const next = { ...prev };
          delete next[reviewId];
          return next;
        });
        // Refetch everything immediately
        await fetchStatsAndLogs();
      } else {
        console.error('Failed to post reply');
      }
    } catch (err) {
      console.error('Network error posting reply:', err);
    } finally {
      setIsReplyingToId(null);
    }
  };

  useEffect(() => {
    setIsEnabled(profile.autopilot_enabled || false);
    fetchGmbStatus();
    fetchStatsAndLogs();
  }, [profile.id, profile.autopilot_enabled]);

  const handleToggleAutopilot = async () => {
    if (isToggling) return;
    setIsToggling(true);
    const nextState = !isEnabled;
    try {
      const res = await fetch('/api/user/autopilot-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': profile.id
        },
        body: JSON.stringify({ userId: profile.id, enabled: nextState })
      });

      if (res.ok) {
        const data = await res.json();
        setIsEnabled(nextState);
        onProfileUpdated({
          ...profile,
          autopilot_enabled: nextState
        });
        // Refetch logs & stats to show any updates immediately
        fetchStatsAndLogs();
      } else {
        console.error('Failed to toggle autopilot settings');
      }
    } catch (err) {
      console.error('Network failure on autopilot toggle:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/autopilot/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': profile.id
        },
        body: JSON.stringify({ userId: profile.id })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.lastGoogleSync) {
          setLastSync(data.lastGoogleSync);
        }
        // Force refresh recent reviews logs & stats count
        await fetchStatsAndLogs();
      } else {
        console.error('Force synchronization endpoint failed');
      }
    } catch (err) {
      console.error('Could not sync autopilot reviews:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Pagination logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) + ' at ' + d.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto" id="autopilot-tab-container">
      {/* Title Header area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles size={20} className={isEnabled ? "animate-spin" : ""} style={{ animationDuration: '4s' }} />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Auto-Reply to Positive Reviews</h1>
          </div>
          <p className="text-xs font-sans text-slate-500 max-w-xl">
            Streamline your reviews. When positive 4 or 5‑star reviews arrive on Google, our AI assistant acts instantly, crafting personalized, friendly replies in real time.
          </p>
        </div>

        {/* Dynamic toggle switch */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 bg-slate-50 border border-slate-100 p-4 rounded-xl min-w-[280px]">
          <div className="space-y-0.5 flex-1">
            <span className="text-xs font-bold text-slate-700 select-none block">
              {isEnabled && gmbConnected && profile.subscription_status === 'active' ? 'Auto-Reply Active' : 'Auto-Reply Suspended'}
            </span>
            {!gmbConnected ? (
              <span className="text-[10px] text-rose-500 font-sans block leading-none">
                Connect your Google Business Profile first to enable auto‑reply.
              </span>
            ) : profile.subscription_status !== 'active' ? (
              <span className="text-[10px] text-amber-500 font-sans block leading-none">
                Active Pro subscription required to enable automation.
              </span>
            ) : null}
          </div>
          <button 
            disabled={isToggling || !gmbConnected || profile.subscription_status !== 'active'}
            onClick={handleToggleAutopilot}
            className="focus:outline-none transition-transform active:scale-95 text-indigo-600 disabled:opacity-45 disabled:cursor-not-allowed"
            id="gmb-autopilot-toggle-btn"
            title={!gmbConnected ? "Reconnect Google Business Profile" : ""}
          >
            {isEnabled && gmbConnected && profile.subscription_status === 'active' ? (
              <ToggleRight size={44} className="text-indigo-600" />
            ) : (
              <ToggleLeft size={44} className="text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Google Business Profile Connection Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6" id="gmb-connection-panel">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-store">
              <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
              <path d="M21 7H3v2a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V7Z"/>
            </svg>
            {gmbConnected && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div className="space-y-1">
            {/* ✅ Tooltip with hover persistence */}
            
<div 
  className="relative"
  onMouseEnter={() => setIsTooltipOpen(true)}
  onMouseLeave={() => {
    // Small delay to allow moving the mouse to the tooltip itself
    setTimeout(() => {
      setIsTooltipOpen(false);
    }, 150);
  }}
>
  <h2 className="text-sm font-black text-slate-900 inline-flex items-center gap-1">
    Google My Business Integration
    <span className="text-slate-400 text-xs font-normal cursor-help">ⓘ</span>
  </h2>
  {isTooltipOpen && (
    <div 
      className="absolute left-0 top-full mt-1 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 z-50 shadow-lg"
      onMouseEnter={() => setIsTooltipOpen(true)}
      onMouseLeave={() => {
        setTimeout(() => {
          setIsTooltipOpen(false);
        }, 150);
      }}
    >
      Connect your Google Business Profile to automatically reply to new 4-5 star reviews. 
      <a 
        href="https://support.google.com/business#topic=4596754" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-300 underline block mt-1 hover:text-blue-200"
        onClick={(e) => {
          // Stop the tooltip from closing when the link is clicked
          e.stopPropagation();
        }}
      >
        Learn more about Google Business Profile →
      </a>
    </div>
  )}
</div>

            <p className="text-[11px] text-slate-500 font-sans max-w-lg">
              Authenticate with Google to grant Rewakely permission to monitor and dynamically publish AI-generated replies immediately.
            </p>
            {gmbConnected ? (
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-100 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Active Connection Linked
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {locationName || 'Retrieving Linked Location ID...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200">
                  Disconnected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Button group with Disconnect */}
        <div className="flex gap-2">
          <button
            onClick={handleConnectGmb}
            className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 ${
              gmbConnected 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-500/35 animate-pulse'
            }`}
            id="gmb-oauth-connect-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            {gmbConnected ? 'Reconnect Google Profile' : 'Connect Google Business Profile'}
          </button>
          {gmbConnected && (
            <button
              onClick={handleDisconnectClick}
              className="w-full md:w-auto inline-flex items-center justify-center px-5 py-3 rounded-xl text-xs font-black transition-all border border-red-300 hover:bg-red-50 text-red-600 shadow-sm active:scale-95"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="autopilot-metrics-grid">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Auto-Replies</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-subtle" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalReplies}</span>
            <span className="text-xs text-slate-500">processed</span>
          </div>
          <div className="text-[10px] text-slate-400 font-sans border-t border-slate-100 pt-2 flex items-center gap-1">
            <CheckCircle2 size={10} className="text-emerald-500" /> Monitored for incoming reviews
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Checked for Reviews</span>
            <Activity size={14} className="text-indigo-600" />
          </div>
          <div className="flex flex-col justify-end">
            <span className="text-sm font-extrabold text-slate-800 tracking-tight truncate">
              {lastSync ? formatDateTime(lastSync) : 'Never checked'}
            </span>
            <span className="text-xs text-slate-500 mt-1">Automatic interval: Every 6 hours</span>
          </div>
          <div className="text-[10px] text-slate-400 font-sans border-t border-slate-100 pt-2 flex items-center gap-1">
            <Calendar size={10} className="text-indigo-500" /> Checked automatically in the background
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Manual Check</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-mono font-bold uppercase">Ready</span>
          </div>

          {/* ─── DISCONNECT MODAL ─── */}
<DisconnectModal
  isOpen={showDisconnectModal}
  onClose={() => setShowDisconnectModal(false)}
  onConfirm={handleDisconnectConfirm}
  isDisconnecting={isDisconnecting}
/>

          <div className="space-y-2">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition shadow-sm active:scale-98 disabled:opacity-50 cursor-pointer"
              id="autopilot-sync-button"
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Checking Google Reviews...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Check for New Google Reviews
                </>
              )}
            </button>
            <p className="text-[9px] text-center text-slate-400 font-sans">
              Checks for new reviews immediately for testing.
            </p>
          </div>
        </div>
      </div>

      {pendingReviews.length > 0 && (
        <div className="bg-red-50/40 border border-red-200/80 rounded-2xl overflow-hidden shadow-sm p-6 space-y-4" id="pending-negative-reviews-panel">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase">
              Action Required
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">
              Pending Negative Google Reviews ({pendingReviews.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Auto-reply is purposely suspended for negative customer experiences so you can craft a careful, high-touch personal reply to win them back.
          </p>

          <div className="space-y-4 pt-2">
            {pendingReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-rose-100 p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-xs">{review.customer_name}</span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Received via Google • {formatDateTime(review.created_at)}
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        fill={i < review.rating ? "currentColor" : "none"} 
                        className={i < review.rating ? "text-amber-500" : "text-slate-200"} 
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed italic border border-slate-100">
                  "{review.comment || <span className="text-slate-400">Customer feedback text was blank.</span>}"
                </p>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Write your empathetic personal reply to post directly back to Google..."
                    value={replyDrafts[review.id] || ''}
                    onChange={(e) => setReplyDrafts(prev => ({ ...prev, [review.id]: e.target.value }))}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-sans leading-relaxed resize-none text-slate-700 bg-white"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSendReply(review.id)}
                      disabled={isReplyingToId === review.id || !(replyDrafts[review.id] || '').trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-[11px] font-black tracking-wide shadow-sm transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isReplyingToId === review.id ? (
                        <>
                          <RefreshCw size={10} className="animate-spin" />
                          Publishing to GMB...
                        </>
                      ) : (
                        'Post Reply to Google'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Logs Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm" id="autopilot-logs-panel">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Recent Automatic Replies</h3>
            <p className="text-[11px] text-slate-500">History of your automatic review responses</p>
          </div>
          {isLoadingLogs && (
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <RefreshCw size={10} className="animate-spin" /> Loading...
            </span>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-sans space-y-3">
            <MessageSquare size={36} className="mx-auto text-slate-300 opacity-80" />
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-slate-600">No Auto-Replies Sent Yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                As customer reviews arrive on Google, they will show up here along with automatic replies.
              </p>
            </div>
           
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Table layout of recent log activities */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Consumer Info</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4 max-w-xs">Review Comment Excerpt</th>
                    <th className="p-4 max-w-sm">Generated AI Reply</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/45 transition">
                      <td className="p-4 pl-6 space-y-0.5">
                        <div className="font-bold text-slate-800">{log.review_customer_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar size={10} className="shrink-0" /> {formatDateTime(log.timestamp)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              fill={i < log.rating ? "currentColor" : "none"} 
                              className={i < log.rating ? "text-amber-500" : "text-slate-200"} 
                            />
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 font-sans leading-relaxed text-[11px] max-w-xs truncate">
                        {log.review_text || <span className="text-slate-300 italic">No text content left</span>}
                      </td>
                      <td className="p-4 text-slate-600 font-sans leading-relaxed text-[11px] max-w-sm italic">
                        "{log.generated_reply}"
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                          log.status === 'success' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {log.status === 'success' ? (
                            <>
                              <CheckCircle2 size={8} /> Posted
                            </>
                          ) : (
                            <>
                              <XCircle size={8} /> Failed
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/20">
                <span className="text-[11px] text-slate-500">
                  Showing <span className="font-extrabold text-slate-700">{indexOfFirstLog + 1}</span> to{' '}
                  <span className="font-extrabold text-slate-700">
                    {Math.min(indexOfLastLog, logs.length)}
                  </span>{' '}
                  of <span className="font-bold text-slate-800">{logs.length}</span> activities
                </span>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => paginate(idx + 1)}
                      className={`px-2.5 py-1 text-xs rounded font-bold transition ${
                        currentPage === idx + 1 
                          ? 'bg-indigo-600 text-white' 
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button 
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety Info Alert Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-3 text-slate-600 text-xs font-sans leading-relaxed">
        <ShieldAlert size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-extrabold text-slate-800">Review Safety Settings</h4>
          <p className="text-slate-500 text-[11px]">
            To protect your business, automatic replies are only sent for positive reviews (4 and 5 stars). Reviews with 3 stars or fewer will be highlighted on your dashboard so you can reply to them personally.
          </p>
        </div>
      </div>
    </div>
  );
}