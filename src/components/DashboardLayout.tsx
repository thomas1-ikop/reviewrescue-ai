// src/components/DashboardLayout.tsx
import React, { ReactNode, useState } from 'react';
import Logo from './Logo';
import { 
  LayoutDashboard, MessageSquare, Smartphone, ShieldCheck, ThumbsUp, HelpCircle, Settings, LogOut, Zap
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

  const handleLogoutClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmLogout = () => {
    setShowConfirmModal(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100">
          <Logo size="md" />
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mt-1">AI Reputation</span>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Merchant</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.business_name || 'My Business'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${user?.subscription_status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {user?.subscription_status === 'active' ? 'Pro Active' : 'Free Plan'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentRoute(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={18} className="text-red-500" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
          {/* Alerts */}
          {negativeAlerts.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <div className="bg-red-100 p-1.5 rounded-full">
                <span className="text-red-500 text-sm">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  {negativeAlerts[negativeAlerts.length - 1]}
                </p>
                <p className="text-xs text-red-600 mt-0.5">Please respond to this negative review in the Review Center.</p>
              </div>
              <button
                onClick={onDismissAlerts}
                className="text-red-400 hover:text-red-600 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Page Content */}
          {children}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Log Out</h3>
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
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition"
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