// src/components/SMSCollector.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, HelpCircle } from 'lucide-react';
import ManualSendSection from './ManualSendSection';
import AutoSendSection from './AutoSendSection';
import type { SMSCollectorProps, ScheduledCustomer } from './sms.types';
import SMSMessagePreview from './SMSMessagePreview';
import QRCode from 'qrcode';

const SMSCollector: React.FC<SMSCollectorProps> = ({ userId, toast, onStartTour }) => {
  // ── Shared auto-send state ──────────────────────────────────────────────────
  const [autoSendEnabled, setAutoSendEnabled] = useState<boolean>(false);
  const [sendDelay, setSendDelay] = useState<number>(2);
  const [upcomingCount, setUpcomingCount] = useState<number>(0);
  const [sentCount, setSentCount] = useState<number>(0);
  const [responseRate, setResponseRate] = useState<number | null>(null);
  const [scheduledCustomers, setScheduledCustomers] = useState<ScheduledCustomer[]>([]);
  const [nextSendDate, setNextSendDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
 // const [profileData, setProfileData] = useState<{ placeId: string; contactEmail: string } | null>(null);
  const qrGeneratedRef = useRef<boolean>(false); // prevent double generation

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchAutoSendState = useCallback(async () => {
    try {
      const res = await fetch('/api/sms/auto-send/state', {
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) throw new Error('Failed to load auto-send state');
      const data: {
        enabled: boolean;
        delay: number;
        upcomingCount: number;
        sentCount: number;
        responseRate: number | null;
      } = await res.json();
      setAutoSendEnabled(data.enabled);
      setSendDelay(data.delay);
      setUpcomingCount(data.upcomingCount);
      setSentCount(data.sentCount);
      setResponseRate(data.responseRate);
    } catch (err: unknown) {
      console.error('[SMSCollector] fetchAutoSendState:', err);
    }
  }, [userId]);

  const fetchScheduledCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/sms/scheduled-customers', {
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) throw new Error('Failed to load scheduled customers');
      const data: { customers: ScheduledCustomer[] } = await res.json();
      setScheduledCustomers(data.customers);

      const pending = data.customers.filter((c) => c.status === 'pending');
      if (pending.length > 0) {
        const sorted = [...pending].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
        );
        setNextSendDate(sorted[0].scheduled_at);
      } else {
        setNextSendDate(null);
      }
    } catch (err: unknown) {
      console.error('[SMSCollector] fetchScheduledCustomers:', err);
    }
  }, [userId]);

  const refreshStats = useCallback(async () => {
    await Promise.all([fetchAutoSendState(), fetchScheduledCustomers()]);
  }, [fetchAutoSendState, fetchScheduledCustomers]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!userId) return;
      setIsLoading(true);
      await refreshStats();
      if (!cancelled) setIsLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, [userId, refreshStats]);


  // ── QR Code Generation (runs once using userId only) ─────────────────────
useEffect(() => {
  if (userId && !qrGeneratedRef.current) {
    qrGeneratedRef.current = true; // prevent re-run
    const url = `https://rewakely.com/review?business=${userId}`;
    console.log('[QR] Generating QR code for URL:', url);
    QRCode.toDataURL(url, { width: 200, margin: 2 }, (err, dataUrl) => {
      if (!err) {
        console.log('[QR] QR code generated successfully');
        setQrCodeDataUrl(dataUrl);
      } else {
        console.error('[QR] QR code generation error:', err);
      }
    });
  }
}, [userId]); // ✅ Only depends on userId – no fetch needed!

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <MessageSquare className="w-5 h-5 text-slate-700" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Send Text Invites</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Collect reviews via SMS — instantly or on autopilot.
          </p>
        </div>
        {/* ─── HELP BUTTON ─────────────────────────────── */}
        {onStartTour && (
          <button
            onClick={onStartTour}
            className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 transition border border-slate-200 group"
            title="Start tour"
          >
            <HelpCircle className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition" />
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition whitespace-nowrap">
              How it works
            </span>
          </button>
        )}
      </div>

      {/* ─── QR CODE SECTION ──────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">📱 QR Code</h3>
              <p className="text-xs text-slate-500">
                Print and display for instant customer feedback
              </p>
            </div>
            {qrCodeDataUrl && (
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = 'rewakely-review-qr.png';
                  link.href = qrCodeDataUrl;
                  link.click();
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Download
              </button>
            )}
          </div>
          {qrCodeDataUrl ? (
            <div className="flex items-center gap-4 mt-3">
              <img src={qrCodeDataUrl} alt="QR Code" className="w-20 h-20" />
              <span className="text-[10px] text-slate-400 break-all">
                rewakely.com/review?business={userId}
              </span>
            </div>
          ) : (
            <div className="text-sm text-slate-400 flex items-center gap-2">
              <span className="animate-pulse">⏳</span> Generating QR code...
            </div>
          )}
        </div>
      )}

      {/* ─── SMS MESSAGE PREVIEW ───────────────────────────────────────────── */}
      <div className="mb-6">
        <SMSMessagePreview />
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 animate-pulse"
            >
              <div className="h-5 bg-slate-100 rounded-lg w-1/2 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded-lg w-full" />
                <div className="h-9 bg-slate-100 rounded-xl w-full" />
                <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                <div className="h-9 bg-slate-100 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
          <ManualSendSection userId={userId} toast={toast} />
          <AutoSendSection
            userId={userId}
            toast={toast}
            autoSendEnabled={autoSendEnabled}
            setAutoSendEnabled={setAutoSendEnabled}
            sendDelay={sendDelay}
            setSendDelay={setSendDelay}
            upcomingCount={upcomingCount}
            sentCount={sentCount}
            responseRate={responseRate}
            scheduledCustomers={scheduledCustomers}
            nextSendDate={nextSendDate}
            refreshStats={refreshStats}
          />
        </div>
      )}
    </div>
  );
};

export default SMSCollector;