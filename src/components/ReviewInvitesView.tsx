// src/components/ReviewInvitesView.tsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, Smartphone, Upload, Send, Lock, Loader2, Clock, Sparkles, Trash2, Download
} from 'lucide-react';
import QRCode from 'qrcode';
import ReviewInvitesTour from './ReviewInvitesTour';
import ConfirmModal from './ConfirmModal'; // 👈 Import the existing modal

interface ReviewInvitesViewProps {
  userId: string;
  isPremium: boolean;
  toast: (message: string, type: 'success' | 'error' | 'warn' | 'info') => void;
}

export default function ReviewInvitesView({ userId, isPremium, toast }: ReviewInvitesViewProps) {
  // ── State for Email ──
  const [emailName, setEmailName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // ── State for SMS ──
  const [smsName, setSmsName] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);

  // ── State for Bulk Import ──
  const [bulkText, setBulkText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // ── State for scheduled invites ──
  const [scheduledInvites, setScheduledInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── State for Tour ──
  const [showTour, setShowTour] = useState(false);

  // ── State for QR Code ──
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const qrGeneratedRef = useRef<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // ── State for Delete Confirmation Modal ──
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    inviteId: string | null;
    customerName: string;
  }>({
    isOpen: false,
    inviteId: null,
    customerName: '',
  });

  // ── Fetch scheduled invites ──
  useEffect(() => {
    const fetchInvites = async () => {
      if (!userId) return;
      try {
        const res = await fetch('/api/invites/all', {
          headers: { 'x-user-id': userId }
        });
        if (res.ok) {
          const data = await res.json();
          setScheduledInvites(data.invites || []);
        }
      } catch (err) {
        console.error('Failed to fetch invites:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvites();
  }, [userId]);

  // ── QR Code Generation ──
  useEffect(() => {
    if (userId && !qrGeneratedRef.current) {
      qrGeneratedRef.current = true;
      const url = `https://rewakely.com/review?business=${userId}`;
      QRCode.toDataURL(url, { width: 200, margin: 2 }, (err, dataUrl) => {
        if (!err) {
          setQrCodeDataUrl(dataUrl);
        } else {
          console.error('[QR] QR code generation error:', err);
        }
      });
    }
  }, [userId]);

  // ─── Refresh Invites ────────────────────────────────────────────────
  const refreshInvites = async () => {
    try {
      const res = await fetch('/api/invites/all', {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setScheduledInvites(data.invites || []);
      }
    } catch (err) {
      console.error('Failed to refresh invites:', err);
    }
  };

  // ─── Open Delete Confirmation ────────────────────────────────────────
  const openDeleteModal = (inviteId: string, customerName: string) => {
    setDeleteModal({
      isOpen: true,
      inviteId,
      customerName,
    });
  };

  // ─── Confirm Delete ──────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteModal.inviteId) return;

    setIsDeleting(deleteModal.inviteId);
    try {
      const res = await fetch(`/api/sms/scheduled-customers/${deleteModal.inviteId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });

      if (res.ok) {
        toast('✅ Invite deleted successfully!', 'success');
        await refreshInvites();
      } else {
        const data = await res.json();
        toast(data.error || 'Failed to delete invite', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to delete invite', 'error');
    } finally {
      setIsDeleting(null);
      setDeleteModal({ isOpen: false, inviteId: null, customerName: '' });
    }
  };

  // ─── Send Email Invite ──────────────────────────────────────────────
  const handleSendEmail = async () => {
    if (!emailName.trim() || !emailAddress.trim()) {
      toast('Please fill in both fields', 'error');
      return;
    }
    if (!emailAddress.includes('@') || !emailAddress.includes('.')) {
      toast('Please enter a valid email', 'error');
      return;
    }
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/email/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ customerName: emailName.trim(), email: emailAddress.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      toast('✅ Email invite sent successfully!', 'success');
      setEmailName('');
      setEmailAddress('');
      await refreshInvites();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // ─── Send SMS Invite ──────────────────────────────────────────────────
  const handleSendSms = async () => {
    if (!isPremium) {
      toast('💎 SMS invites are available on the Premium plan', 'warn');
      return;
    }
    if (!smsName.trim() || !smsPhone.trim()) {
      toast('Please fill in both fields', 'error');
      return;
    }
    setIsSendingSms(true);
    try {
      const res = await fetch('/api/sms/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ customerName: smsName.trim(), phoneNumber: smsPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      toast('✅ SMS invite sent successfully!', 'success');
      setSmsName('');
      setSmsPhone('');
      await refreshInvites();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setIsSendingSms(false);
    }
  };

  // ─── Bulk Import ──────────────────────────────────────────────────────
  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      toast('Please paste some customer data', 'error');
      return;
    }
    setIsImporting(true);
    try {
      const parseRes = await fetch('/api/sms/parse-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: bulkText }),
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok || !parseData.customers) throw new Error('Failed to parse');
      const customers = parseData.customers;
      const scheduleRes = await fetch('/api/sms/schedule-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ customers }),
      });
      if (!scheduleRes.ok) {
        const errData = await scheduleRes.json();
        throw new Error(errData.error || 'Failed to schedule');
      }
      toast(`✅ ${customers.length} customers imported successfully!`, 'success');
      setBulkText('');
      await refreshInvites();
    } catch (err: any) {
      toast(err.message || 'Import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // ─── Download QR Code ────────────────────────────────────────────────
  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.download = 'rewakely-review-qr.png';
    link.href = qrCodeDataUrl;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6" id="invites-header">
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Mail className="w-5 h-5 text-slate-700" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Review Invites</h1>
          <p className="text-sm text-slate-500 mt-0.5">Send review requests via email or SMS</p>
        </div>
        <button
          onClick={() => setShowTour(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 transition border border-slate-200 group"
        >
          <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition" />
          <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition whitespace-nowrap">
            How it works
          </span>
        </button>
        {isPremium && (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
            👑 Premium
          </span>
        )}
      </div>

      {/* ─── TOUR ────────────────────────────────────────────────────────── */}
      {showTour && (
        <ReviewInvitesTour
          isOpen={showTour}
          onComplete={() => {
            setShowTour(false);
            toast('✅ Tour complete! You\'re ready to collect reviews.', 'success');
          }}
          onSkip={() => setShowTour(false)}
        />
      )}

      {/* ─── QR CODE SECTION ───────────────────────────────────────────── */}
      {/* ─── QR CODE SECTION ───────────────────────────────────────────── */}
<div id="qr-code-section" className="mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-semibold text-slate-800">📱 QR Code</h3>
      <p className="text-xs text-slate-500">
        Print and display for instant customer feedback!
      </p>
    </div>
    {qrCodeDataUrl && (
      <button
        onClick={handleDownloadQR}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        <Download className="w-4 h-4" />
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

      {/* ─── TWO-COLUMN GRID: Email + SMS ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ─── EMAIL INVITES ──────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 email-invite-card">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-800">✉️ Email Invite</h3>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={emailName}
              onChange={(e) => setEmailName(e.target.value)}
              placeholder="Customer Name"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="Email Address"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition"
            >
              {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSendingEmail ? 'Sending...' : 'Send Email Invite'}
            </button>
          </div>
        </div>

        {/* ─── SMS INVITES ────────────────────────────────────────────── */}
        <div className={`bg-white border rounded-2xl shadow-sm p-6 sms-invite-card ${isPremium ? 'border-slate-200' : 'border-slate-200 opacity-80'}`}>
            
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-slate-800">📱 SMS Invite</h3>
            </div>
            {!isPremium && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                Premium Feature
              </span>
            )}
          </div>

          {!isPremium ? (
            <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200">
              <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">SMS Invites Locked</p>
              <p className="text-xs text-slate-500 mt-1">Upgrade to Premium to send SMS invites</p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={smsName}
                onChange={(e) => setSmsName(e.target.value)}
                placeholder="Customer Name"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <input
                type="tel"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                onClick={handleSendSms}
                disabled={isSendingSms}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-sm font-semibold transition"
              >
                {isSendingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSendingSms ? 'Sending...' : 'Send SMS Invite'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── BULK IMPORT ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6 bulk-import-section">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-slate-800">📥 Import Customer List</h3>
          <span className="text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">AI Parsing</span>
        </div>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Name, Email, Phone, Date\nJohn, john@example.com, +15551234567, 2026-07-01"
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition min-h-[100px]"
        />
        <button
          onClick={handleBulkImport}
          disabled={isImporting}
          className="mt-4 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-sm font-semibold transition"
        >
          {isImporting ? 'Importing...' : 'Import & Schedule'}
        </button>
      </div>

      {/* ─── SCHEDULED INVITES ──────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 scheduled-invites-section">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-800">📋 Scheduled Invites</h3>
          <span className="text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {scheduledInvites.length} pending
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
        ) : scheduledInvites.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No scheduled invites yet.</div>
        ) : (
          <div className="space-y-2">
            {scheduledInvites.map((invite, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  {invite.type === 'email' ? (
                    <Mail className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{invite.customer_name}</p>
                    <p className="text-[10px] text-slate-400">
                      {invite.type === 'email' ? invite.email : invite.phone_number}
                      {invite.scheduled_at && ` • ${new Date(invite.scheduled_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                    invite.status === 'sent' ? 'bg-green-50 text-green-600' :
                    invite.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {invite.status}
                  </span>
                  {/* ─── DELETE BUTTON ────────────────────────────────── */}
                  <button
                    onClick={() => openDeleteModal(invite.id, invite.customer_name)}
                    disabled={isDeleting === invite.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition disabled:opacity-50"
                    title="Delete invite"
                  >
                    {isDeleting === invite.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── DELETE CONFIRMATION MODAL ──────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Invite"
        message={`Are you sure you want to delete the invite for "${deleteModal.customerName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, inviteId: null, customerName: '' })}
        isDestructive={true}
      />
    </div>
  );
}