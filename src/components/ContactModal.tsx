/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Mail, Send, ExternalLink, AlertCircle } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (message: string, type: 'success' | 'warn' | 'info') => void;
}

export default function ContactModal({ isOpen, onClose, triggerToast }: ContactModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit contact enquiry.');
      }

      // Success
      triggerToast('Thank you! We’ll get back to you soon.', 'success');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('contact@rewakely.com');
    triggerToast('Email address copied to clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" id="contact-modal-overlay">
      <div 
        className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-2xl flex flex-col relative animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        id="contact-modal-content"
      >
        {/* Close Button X */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1"
          aria-label="Close contact modal"
          id="contact-modal-close-x"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 shrink-0">
            <Mail size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Contact Rewakely</h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">We're here to answer your questions and assist with setups.</p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 bg-rose-50 text-rose-800 p-3 rounded-xl border border-rose-100 text-xs font-semibold flex items-start gap-2 font-sans">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
              Name <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text"
              required
              disabled={isLoading}
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white placeholder-slate-400"
              id="contact-form-name"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input 
              type="email"
              required
              disabled={isLoading}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white placeholder-slate-400"
              id="contact-form-email"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
              Message <span className="text-rose-500">*</span>
            </label>
            <textarea 
              required
              disabled={isLoading}
              rows={4}
              placeholder="How can we help your business today?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white placeholder-slate-400 resize-none font-sans"
              id="contact-form-message"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
              id="contact-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold transition shadow-sm disabled:opacity-75"
              id="contact-modal-submit"
            >
              {isLoading ? (
                <>Sending message...</>
              ) : (
                <>
                  <Send size={12} />
                  Submit Enquiry
                </>
              )}
            </button>
          </div>
        </form>

        {/* Fallbacks */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 bg-slate-50/50 rounded-xl p-4 border border-dashed border-slate-200">
          <p className="text-xs text-slate-400 mt-4 text-center">
  Want to contact us directly? You can email us at <strong className="text-slate-800">contact@rewakely.com</strong>.
</p>
          <div className="flex flex-wrap gap-2.5 pt-0.5">
            <button
              onClick={copyEmailToClipboard}
              className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition shadow-xs"
              id="contact-copy-email-btn"
            >
              Copy Email Address
            </button>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=contact@rewakely.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50/70 border border-blue-100 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition shadow-xs font-sans"
              id="contact-gmail-btn"
            >
              Send via Gmail
              <ExternalLink size={10} />
            </a>
            <a
              href="mailto:contact@rewakely.com"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition shadow-xs"
              id="contact-mailto-btn"
            >
              Default Mail Client
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
