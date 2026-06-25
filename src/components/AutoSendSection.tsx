// src/components/AutoSendSection.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
  Bot,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  Sparkles,
  Check,
} from 'lucide-react';
import type { AutoSendSectionProps, ParsedCustomer, ScheduledCustomer } from './sms.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateDisplay(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function localId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ScheduledCustomer['status'] }> = ({ status }) => {
  const styles: Record<ScheduledCustomer['status'], string> = {
    pending: 'bg-amber-100 text-amber-700 border border-amber-200',
    sent:    'bg-green-100 text-green-700 border border-green-200',
    failed:  'bg-red-100 text-red-700 border border-red-200',
  };
  const labels: Record<ScheduledCustomer['status'], string> = {
    pending: 'Pending',
    sent:    'Sent',
    failed:  'Failed',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

// ─── Confirm Modal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
      <p className="text-sm text-slate-700 mb-5">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="border border-slate-300 text-slate-700 hover:bg-slate-50
                     rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-600 hover:bg-red-700 text-white
                     rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Block 2.1: Controls & Stats ──────────────────────────────────────────────

interface ControlsStatsBlockProps {
  userId: string;
  toast: AutoSendSectionProps['toast'];
  autoSendEnabled: boolean;
  setAutoSendEnabled: (v: boolean) => void;
  sendDelay: number;
  setSendDelay: (v: number) => void;
  upcomingCount: number;
  sentCount: number;
  responseRate: number | null;
  nextSendDate: string | null;
  scheduledCustomers: ScheduledCustomer[];
}

const ControlsStatsBlock: React.FC<ControlsStatsBlockProps> = ({
  userId,
  toast,
  autoSendEnabled,
  setAutoSendEnabled,
  sendDelay,
  setSendDelay,
  upcomingCount,
  sentCount,
  responseRate,
  nextSendDate,
}) => {
  const [isTogglingOrDelaying, setIsTogglingOrDelaying] = useState(false);

  const pushToggle = useCallback(
    async (enabled: boolean, delay: number) => {
      setIsTogglingOrDelaying(true);
      try {
        const res = await fetch('/api/sms/auto-send/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ enabled, sendDelay: delay }),
        });
        if (!res.ok) throw new Error('Failed to update settings');
      } catch (err: unknown) {
        toast(err instanceof Error ? err.message : 'Could not save setting', 'error');
      } finally {
        setIsTogglingOrDelaying(false);
      }
    },
    [userId, toast],
  );

  const handleToggle = async () => {
    const next = !autoSendEnabled;
    setAutoSendEnabled(next);
    await pushToggle(next, sendDelay);
  };

  const handleDelayChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = Number(e.target.value);
    setSendDelay(next);
    await pushToggle(autoSendEnabled, next);
  };

  return (
    <div className="flex flex-wrap gap-5 mb-5">
      {/* Left: toggle + delay + next-send */}
      <div className="flex flex-col gap-3 flex-1 min-w-[200px]">
        {/* Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            disabled={isTogglingOrDelaying}
            aria-label={autoSendEnabled ? 'Disable auto-send' : 'Enable auto-send'}
            className="relative flex items-center h-8 w-16 rounded-full border-2 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            style={{
              backgroundColor: autoSendEnabled ? '#1e293b' : '#cbd5e1',
              borderColor: autoSendEnabled ? '#1e293b' : '#cbd5e1',
            }}
          >
            <span
              className="absolute left-0.5 h-6 w-6 bg-white rounded-full shadow transition-transform duration-200"
              style={{ transform: autoSendEnabled ? 'translateX(32px)' : 'translateX(0)' }}
            />
          </button>
          <div className="flex items-center gap-1.5">
            {autoSendEnabled
              ? <ToggleRight className="w-4 h-4 text-green-600" />
              : <ToggleLeft className="w-4 h-4 text-slate-400" />
            }
            <span className={`text-sm font-semibold ${autoSendEnabled ? 'text-green-700' : 'text-slate-500'}`}>
              {autoSendEnabled ? 'Active' : 'Off'}
            </span>
          </div>
        </div>

        {/* Delay */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 whitespace-nowrap">Send after</label>
          <select
            value={sendDelay}
            onChange={handleDelayChange}
            disabled={isTogglingOrDelaying}
            className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d} {d === 1 ? 'day' : 'days'}
              </option>
            ))}
          </select>
        </div>

        {/* Next send info */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          {autoSendEnabled && nextSendDate
            ? <span>Next SMS: <strong className="text-slate-700">{formatDateDisplay(nextSendDate)}</strong></span>
            : <span>No upcoming sends</span>
          }
        </div>
      </div>

      {/* Right: stats cards */}
      <div className="flex flex-wrap gap-3">
        {/* Upcoming */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 min-w-[90px]">
          <div>
            <p className="text-2xl font-bold text-slate-800">{upcomingCount}</p>
            <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">Upcoming</p>
          </div>
        </div>

        {/* Sent */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 min-w-[90px]">
          <div>
            <p className="text-2xl font-bold text-slate-800">{sentCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Sent</p>
          </div>
        </div>

        {/* Response Rate */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 min-w-[90px]">
          <div>
            <p className="text-2xl font-bold text-slate-800">
              {responseRate !== null && responseRate > 0 ? `${responseRate}%` : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">Response Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Block 2.2: Customer Importer ─────────────────────────────────────────────

interface CustomerImporterBlockProps {
  userId: string;
  toast: AutoSendSectionProps['toast'];
  onScheduled: () => Promise<void>;
  onExpandScheduled: () => void;
  defaultOpen: boolean;
}

const CustomerImporterBlock: React.FC<CustomerImporterBlockProps> = ({
  userId,
  toast,
  onScheduled,
  onExpandScheduled,
  defaultOpen,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedCustomer[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: keyof ParsedCustomer } | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const handleParse = useCallback(async () => {
    if (!rawText.trim()) {
      toast('Paste some customer data first.', 'error');
      return;
    }
    setIsParsing(true);
    try {
      const res = await fetch('/api/sms/parse-customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ rawText }),
      });
      if (!res.ok) throw new Error('Parsing failed');
      const data: { customers: Omit<ParsedCustomer, '_localId'>[] } = await res.json();
      setParsedRows(data.customers.map((c) => ({ ...c, _localId: localId() })));
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not parse customers', 'error');
    } finally {
      setIsParsing(false);
    }
  }, [rawText, userId, toast]);

  const handleConfirm = useCallback(async () => {
    if (!parsedRows.length) {
      toast('No customers to schedule.', 'error');
      return;
    }
    setIsScheduling(true);
    try {
      const customers = parsedRows.map(({ customer_name, phone_number, visit_date }) => ({
        customer_name,
        phone_number,
        visit_date,
      }));
      const res = await fetch('/api/sms/schedule-customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ customers }),
      });
      if (!res.ok) throw new Error('Scheduling failed');
      toast(`${parsedRows.length} customer${parsedRows.length > 1 ? 's' : ''} scheduled!`, 'success');
      setParsedRows([]);
      setRawText('');
      await onScheduled();
      onExpandScheduled();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not schedule customers', 'error');
    } finally {
      setIsScheduling(false);
    }
  }, [parsedRows, userId, toast, onScheduled, onExpandScheduled]);

  const updateRow = (id: string, field: keyof ParsedCustomer, value: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r._localId === id ? { ...r, [field]: value } : r)),
    );
  };

  const deleteRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r._localId !== id));
  };

  const addRow = () => {
    setParsedRows((prev) => [
      ...prev,
      { customer_name: '', phone_number: '', visit_date: '', _localId: localId() },
    ]);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 customer-importer">
      {/* Accordion header */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3
                   bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-slate-700">
          Import Customers for the week for Auto‑Send
        </span>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-slate-500" />
          : <ChevronDown className="w-4 h-4 text-slate-500" />
        }
      </button>

      {/* Accordion body */}
      {isOpen && (
        <div className="p-4 space-y-4">
          
<div className="flex items-center gap-2">
  <input
    type="file"
    id="file-upload"
    accept=".csv,.txt,.xlsx,.xls"
    className="hidden"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setRawText(content);
          toast(`Loaded ${file.name}`, 'info');
        }
      };
      reader.readAsText(file);
      e.target.value = ''; // reset input so same file can be uploaded again
    }}
  />
  <label
    htmlFor="file-upload"
    className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition"
  >
    📄 Upload File 
  </label>
  <span className="text-xs text-slate-400">(.csv, .txt, .xlsx)</span>
</div>

          {/* Textarea */}
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={5}
            placeholder={`Or paste your customer list here instead…\nExample: John, +1 555 123 4567, 2026-06-15`}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder:text-slate-400 resize-y font-mono"
          />

          

          {/* Parse button */}
          <button
            onClick={handleParse}
            disabled={isParsing}
            className="flex items-center gap-2 border border-slate-300 text-slate-700
                       hover:bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isParsing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Sparkles className="w-4 h-4 text-amber-500" />
            }
            {isParsing ? 'Parsing…' : 'Schedual SMS messages'}
          </button>

          {/* Preview table */}
          {parsedRows.length > 0 && (
            <div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2">Name</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2">Phone</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2">Visit Date</th>
                      <th className="w-16 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row) => (
                      <tr key={row._localId} className="hover:bg-slate-50">
                        {(['customer_name', 'phone_number', 'visit_date'] as const).map((field) => (
                          <td key={field} className="px-3 py-2">
                            {editingCell?.rowId === row._localId && editingCell?.field === field ? (
                              <input
                                ref={editRef}
                                autoFocus
                                defaultValue={row[field]}
                                onBlur={(e) => {
                                  updateRow(row._localId!, field, e.target.value);
                                  setEditingCell(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === 'Escape') {
                                    updateRow(row._localId!, field, (e.target as HTMLInputElement).value);
                                    setEditingCell(null);
                                  }
                                }}
                                className="border border-blue-400 rounded-lg px-2 py-1 text-sm w-full
                                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            ) : (
                              <span
                                onClick={() =>
                                  setEditingCell({ rowId: row._localId!, field })
                                }
                                className="cursor-pointer hover:text-blue-600 block min-w-[60px]"
                                title="Click to edit"
                              >
                                {row[field] || <span className="text-slate-400 italic">empty</span>}
                              </span>
                            )}
                          </td>
                        ))}
                        {/* Actions */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setEditingCell({ rowId: row._localId!, field: 'customer_name' })
                              }
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit row"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteRow(row._localId!)}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add row */}
              <button
                onClick={addRow}
                className="mt-2 flex items-center gap-1.5 text-sm text-slate-500
                           hover:text-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add row
              </button>

              {/* Confirm & Activate */}
              <button
  onClick={handleConfirm}
  disabled={isScheduling}
  className="mt-4 w-full flex items-center justify-center gap-2
             bg-slate-800 hover:bg-slate-900 text-white
             rounded-xl px-4 py-2.5 text-sm font-medium
             disabled:opacity-60 disabled:cursor-not-allowed
             transition-colors confirm-activate-btn"
>
                {isScheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scheduling…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm &amp; Activate Auto‑Send
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Block 2.3: Scheduled Customers List ──────────────────────────────────────

interface ScheduledCustomersBlockProps {
  userId: string;
  toast: AutoSendSectionProps['toast'];
  scheduledCustomers: ScheduledCustomer[];
  setScheduledCustomers: (customers: ScheduledCustomer[]) => void;
  refreshStats: () => Promise<void>;
  forceOpen?: boolean;
  onClearAll: () => Promise<void>;
}

const ScheduledCustomersBlock: React.FC<ScheduledCustomersBlockProps> = ({
  userId,
  toast,
  scheduledCustomers,
  setScheduledCustomers,
  refreshStats,
  forceOpen,
  onClearAll,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Force expand when parent tells us to (after scheduling)
  React.useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!confirmDelete) return;
    const id = confirmDelete;
    setConfirmDelete(null);
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/sms/scheduled-customers/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) throw new Error('Delete failed');
      setScheduledCustomers(scheduledCustomers.filter((c) => c.id !== id));
      await refreshStats();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not delete', 'error');
    } finally {
      setIsDeletingId(null);
    }
  }, [confirmDelete, userId, scheduledCustomers, setScheduledCustomers, refreshStats, toast]);

  const handleClearAll = async () => {
    setShowClearConfirm(false);
    setIsClearing(true);
    try {
      const res = await fetch('/api/sms/scheduled-customers/clear', {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Clear failed');
      }
      setScheduledCustomers([]);
      await refreshStats();
      toast('All pending scheduled customers cleared.', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not clear', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      {/* Confirm single delete modal */}
      {confirmDelete && (
        <ConfirmModal
          message="Remove this customer from the scheduled list? This cannot be undone."
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Confirm clear all modal */}
      {showClearConfirm && (
        <ConfirmModal
          message="Delete ALL pending scheduled customers? This cannot be undone."
          onConfirm={handleClearAll}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {/* Header (collapsible) */}
        <div className="flex items-center justify-between w-full bg-slate-50 hover:bg-slate-100 transition-colors">
          <button
            onClick={() => setIsOpen((o) => !o)}
            className="flex-1 flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold text-slate-700">
              📋 Scheduled Customers
              {scheduledCustomers.length > 0 && (
                <span className="ml-2 bg-slate-200 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {scheduledCustomers.length}
                </span>
              )}
            </span>
            {isOpen
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-500" />
            }
          </button>

          {/* Clear All button – only show if there are pending customers */}
          {scheduledCustomers.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={isClearing}
              className="mr-3 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
            >
              {isClearing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Clear All'}
            </button>
          )}
        </div>

        {/* Body */}
        {isOpen && (
          <div>
            {scheduledCustomers.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-400">
                  No customers scheduled yet. Import some above!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2">Name</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2">Phone</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2 hidden sm:table-cell">
                        Visit Date
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2 hidden md:table-cell">
                        Scheduled Send
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2">Status</th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scheduledCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-medium text-slate-800">{c.customer_name}</td>
                        <td className="px-3 py-2.5 text-slate-600 tabular-nums">{c.phone_number}</td>
                        <td className="px-3 py-2.5 text-slate-600 hidden sm:table-cell">
                          {c.visit_date || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 hidden md:table-cell whitespace-nowrap">
                          {formatDateDisplay(c.scheduled_at)}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-3 py-2.5">
                          {isDeletingId === c.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(c.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ─── Main AutoSendSection ──────────────────────────────────────────────────────

const AutoSendSection: React.FC<AutoSendSectionProps> = ({
  userId,
  toast,
  autoSendEnabled,
  setAutoSendEnabled,
  sendDelay,
  setSendDelay,
  upcomingCount,
  sentCount,
  responseRate,
  scheduledCustomers,
  nextSendDate,
  refreshStats,
}) => {
  const [scheduledCustomersLocal, setScheduledCustomersLocal] = useState<ScheduledCustomer[]>(scheduledCustomers);
  const [expandScheduled, setExpandScheduled] = useState(false);

  React.useEffect(() => {
    setScheduledCustomersLocal(scheduledCustomers);
  }, [scheduledCustomers]);

  const handleScheduled = useCallback(async () => {
    await refreshStats();
  }, [refreshStats]);

  // ✅ Clear All handler (only one declaration)
  const handleClearAll = useCallback(async () => {
    try {
      const res = await fetch('/api/sms/scheduled-customers/clear', {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Clear failed');
      }
      setScheduledCustomersLocal([]);
      await refreshStats();
      toast('All pending scheduled customers cleared.', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not clear', 'error');
    }
  }, [userId, refreshStats, toast]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 auto-send-section">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-slate-100 rounded-lg">
          <Bot className="w-4 h-4 text-slate-600" />
        </div>
        <h2 className="text-base font-semibold text-slate-800">Automated Review Invites</h2>
      </div>

      <ControlsStatsBlock
        userId={userId}
        toast={toast}
        autoSendEnabled={autoSendEnabled}
        setAutoSendEnabled={setAutoSendEnabled}
        sendDelay={sendDelay}
        setSendDelay={setSendDelay}
        upcomingCount={upcomingCount}
        sentCount={sentCount}
        responseRate={responseRate}
        nextSendDate={nextSendDate}
        scheduledCustomers={scheduledCustomersLocal}
      />

      <div className="border-t border-slate-100 my-5" />

      <CustomerImporterBlock
        userId={userId}
        toast={toast}
        onScheduled={handleScheduled}
        onExpandScheduled={() => setExpandScheduled(true)}
        defaultOpen={scheduledCustomersLocal.length === 0}
      />

      <ScheduledCustomersBlock
        userId={userId}
        toast={toast}
        scheduledCustomers={scheduledCustomersLocal}
        setScheduledCustomers={setScheduledCustomersLocal}
        refreshStats={refreshStats}
        forceOpen={expandScheduled}
        onClearAll={handleClearAll}
      />
    </div>
  );
};

export default AutoSendSection;