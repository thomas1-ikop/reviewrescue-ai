// src/components/DisconnectModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Shield, Zap } from 'lucide-react';

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDisconnecting: boolean;
}

const DisconnectModal: React.FC<DisconnectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDisconnecting,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/50 shadow-2xl shadow-slate-900/20 max-w-md w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 p-2 border border-amber-200/50">
                    <AlertTriangle size={20} className="text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Disconnect Google Business</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Are you sure you want to disconnect your Google Business Profile?
                </p>
                <div className="bg-amber-50/50 border border-amber-200/50 p-3 flex items-start gap-2">
                  <Shield size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>Auto-reply will stop working</strong> – you won't be able to automatically respond to new Google reviews until you reconnect.
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  You can reconnect at any time from the same page.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100/60">
                <button
                  onClick={onClose}
                  className="flex-1 border border-slate-200/60 text-slate-600 font-medium text-sm py-2.5 hover:bg-slate-50/50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDisconnecting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium text-sm py-2.5 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition disabled:opacity-50"
                >
                  {isDisconnecting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Disconnect
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DisconnectModal;