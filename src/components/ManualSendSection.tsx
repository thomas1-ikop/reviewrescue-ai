  // src/components/ManualSendSection.tsx
  import React, { useState, useCallback } from 'react';
  import { Send, Loader2 } from 'lucide-react';
  import type { ManualSendSectionProps } from './sms.types';

  const ManualSendSection: React.FC<ManualSendSectionProps> = ({ userId, toast }) => {
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = useCallback(async () => {
      if (!customerName.trim() || !phoneNumber.trim()) {
        toast('Please fill in both fields.', 'error');
        return;
      }

      setIsSending(true);
      try {
        const res = await fetch('/api/sms/send-invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ customerName, phoneNumber }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(err.message ?? 'Failed to send invite');
        }

        toast('Invite sent!', 'success');
        setCustomerName('');
        setPhoneNumber('');
      } catch (err: unknown) {
        toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
      } finally {
        setIsSending(false);
      }
    }, [customerName, phoneNumber, userId, toast]);

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 h-fit manual-send-section">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Send className="w-4 h-4 text-slate-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">Send a Review Invite Now</h2>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-5">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Doe"
              disabled={isSending}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed
                        transition-shadow"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 555 123 4567"
              disabled={isSending}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed
                        transition-shadow"
            />
          </div>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-sm text-amber-800 leading-snug">
            💡 Your customer will receive an SMS with a link to rate your business.{' '}
            <span className="font-medium">4–5★ → Google Maps</span>,{' '}
            <span className="font-medium">1–3★ → contact you directly</span>.
          </p>
        </div>


        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isSending}
          className="w-full sm:w-auto flex items-center justify-center gap-2
                    bg-slate-800 hover:bg-slate-900 text-white
                    rounded-xl px-4 py-2.5 text-sm font-medium
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-colors"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Invite
            </>
          )}
        </button>
      </div>
    );
  };

  export default ManualSendSection;