// src/components/SMSMessagePreview.tsx
import React from 'react';
import { MessageSquare } from 'lucide-react';

interface SMSMessagePreviewProps {
  businessName?: string;
  customerName?: string; // optional, can be left as placeholder
}

const SMSMessagePreview: React.FC<SMSMessagePreviewProps> = ({
  businessName = '[Your Business Name]',
  customerName = '[Customer Name]',
}) => {
  const message = `Hi ${customerName}, ${businessName} values your feedback. Please leave a review here: [link]`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            SMS Message Preview
          </p>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Example</span>
      </div>
      <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
        <p className="text-sm text-slate-700 font-mono leading-relaxed break-words">
          {message}
        </p>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 italic">
        <strong>[Customer Name]</strong>, <strong>[Your Business Name]</strong>, and the review link are automatically replaced when the SMS is sent.
      </p>
    </div>
  );
};

export default SMSMessagePreview;