// src/components/DashboardLayout.tsx
import React, { ReactNode, useState } from 'react';
import Logo from './Logo';
import { 
  LayoutDashboard, MessageSquare, Smartphone, ShieldCheck, 
  ThumbsUp, HelpCircle, Settings, LogOut, Zap, 
  Sparkles, CheckCircle, AlertTriangle
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  user: any;
  onLogout: () => void;
  negativeAlerts?: string[];
  onDismissAlerts?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentRoute,
  setCurrentRoute,
  user,
  onLogout,
  negativeAlerts = [],
  onDismissAlerts,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Review Center', icon: <MessageSquare size={18} /> },
    { id: 'sms', label: 'Send Text Invites', icon: <Smartphone size={18} /> },
    { id: 'autopilot', label: 'Auto-Reply', icon: <ShieldCheck size={18} /> },
    { id: 'feedback', label: 'Customer Feedback', icon: <ThumbsUp size={18} /> },
    { id: 'support', label: 'Help & Support', icon: <HelpCircle size={18} /> },
    { id: 'dashboardSettings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  const handleLogoutClick = () => setShowConfirmModal(true);
  const handleConfirmLogout = () => { setShowConfirmModal(false); onLogout(); };
  const handleCancelLogout = () => setShowConfirmModal(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased">
      {/* ─── SIDEBAR (Dark gradient with glass) ─── */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col flex-shrink-0 shadow-2xl shadow-slate-900/20 relative overflow-hidden">
        {/* Subtle glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
        
        {/* ─── LOGO ─── */}
        <div className="px-6 py-5 border-b border-slate-700/50 relative z-10">
  <div className="[&_span]:text-white">
    <Logo />
  </div>
  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mt-1">AI Reputation</span>
</div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-slate-700/50 relative z-10">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Merchant</p>
            <p className="text-sm font-semibold text-white truncate">{user?.business_name || 'My Business'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${user?.subscription_status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${user?.subscription_status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {user?.subscription_status === 'active' ? 'Pro Active' : 'Free Plan'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto relative z-10">
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                id={`tour-sidebar-${item.id}`}  // ← ADD THIS LINE
                onClick={() => setCurrentRoute(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400 transition-colors'}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700/50 relative z-10">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
          >
            <LogOut size={18} className="text-red-400 group-hover:text-red-300 transition-colors" />
            Log Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50/80 p-6 md:p-8 relative">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNjYmQ1ZTEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2LTRoNHY0aC00em0wIDB2LTRoLTR2NGg0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          {/* Alerts */}
          {negativeAlerts.length > 0 && (
            <div className="bg-gradient-to-r from-rose-50 to-orange-50/80 backdrop-blur-sm border border-rose-200/50 rounded-2xl p-4 flex items-start gap-3 shadow-sm shadow-rose-200/20">
              <div className="bg-rose-100/70 p-1.5 rounded-full">
                <AlertTriangle size={16} className="text-rose-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-800">
                  {negativeAlerts[negativeAlerts.length - 1]}
                </p>
                <p className="text-xs text-rose-600 mt-0.5">Please respond to this negative review in the Review Center.</p>
              </div>
              <button
                onClick={onDismissAlerts}
                className="text-rose-400 hover:text-rose-600 text-sm font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Page Content */}
          {children}
        </div>
      </main>

      {/* ─── LOGOUT CONFIRMATION MODAL ─── */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white/90 backdrop-blur-md border border-white/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100/70 p-2 rounded-full">
                <LogOut size={18} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Log Out</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-lg shadow-red-600/25"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;