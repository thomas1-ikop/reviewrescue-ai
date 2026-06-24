// ─── SMS Collector Types ──────────────────────────────────────────────────────

export interface ScheduledCustomer {
  id: string;
  customer_name: string;
  phone_number: string;
  visit_date: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface ParsedCustomer {
  customer_name: string;
  phone_number: string;
  visit_date: string;
  // local only – used for table row keys before they're scheduled
  _localId?: string;
}

export interface AutoSendState {
  enabled: boolean;
  delay: number;
  upcomingCount: number;
  sentCount: number;
  responseRate: number | null;
}

export interface ToastFn {
  (message: string, type?: 'success' | 'error' | 'info'): void;
}

export interface SMSCollectorProps {
  userId: string;
  toast: ToastFn;
}

export interface ManualSendSectionProps {
  userId: string;
  toast: ToastFn;
}

export interface AutoSendSectionProps {
  userId: string;
  toast: ToastFn;
  // shared state lifted to parent
  autoSendEnabled: boolean;
  setAutoSendEnabled: (v: boolean) => void;
  sendDelay: number;
  setSendDelay: (v: number) => void;
  upcomingCount: number;
  sentCount: number;
  responseRate: number | null;
  scheduledCustomers: ScheduledCustomer[];
  nextSendDate: string | null;
  refreshStats: () => Promise<void>;
}

export interface SMSCollectorProps {
  userId: string;
  toast: ToastFn;
  onStartTour?: () => void;  // ← ADD THIS LINE
}