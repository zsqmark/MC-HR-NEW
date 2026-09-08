import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { OnboardingGuard } from './components/OnboardingGuard';
import { AccessDenied } from './components/AccessDenied';
import { Shield, User, Lock, KeyRound } from 'lucide-react';

// Staff Pages
import { StaffHome } from './pages/staff/StaffHome';
import { StaffSchedule } from './pages/staff/StaffSchedule';
import { StaffAvailability } from './pages/staff/StaffAvailability';
import { StaffClock } from './pages/staff/StaffClock';
import { StaffTasks } from './pages/staff/StaffTasks';
import { StaffChecklist } from './pages/staff/StaffChecklist';
import { StaffOnboarding } from './pages/staff/StaffOnboarding';
import { StaffDocuments } from './pages/staff/StaffDocuments';

// Manager Pages
import { ManagerHome } from './pages/manager/ManagerHome';
import { ManagerSchedule } from './pages/manager/ManagerSchedule';
import { ManagerTimesheet } from './pages/manager/ManagerTimesheet';
import { ManagerTasks } from './pages/manager/ManagerTasks';
import { ManagerOnboarding } from './pages/manager/ManagerOnboarding';
import { ManagerDocuments } from './pages/manager/ManagerDocuments';

const MainContent: React.FC = () => {
  const { currentRole, currentPage, activeStaff, authenticateManager, switchRole } = useApp();
  const [showManagerPinModal, setShowManagerPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Strict RBAC: Staff users are strictly locked to staff views
  const effectiveRole = activeStaff.role === 'staff' ? 'staff' : currentRole;

  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (authenticateManager(pinInput)) {
      setShowManagerPinModal(false);
      setPinInput('');
    } else {
      setPinError('Invalid Manager PIN. Access denied.');
    }
  };

  const renderContent = () => {
    if (effectiveRole === 'staff') {
      // If a staff user attempts to view manager administrative pages, trigger AccessDenied
      const managerOnlyPages = ['Weekly Schedule', 'Timesheet', 'Task', 'Onboarding Progress'];
      if (managerOnlyPages.includes(currentPage)) {
        return <AccessDenied attemptedPage={currentPage} />;
      }

      switch (currentPage) {
        case 'Homepage':
          return <StaffHome />;
        case 'My Schedule':
          return <StaffSchedule />;
        case 'My Availability':
          return <StaffAvailability />;
        case 'Clock In/Out':
          return <StaffClock />;
        case 'My Task':
          return <StaffTasks />;
        case 'Daily Checklist':
          return <StaffChecklist />;
        case 'Onboarding':
          return <StaffOnboarding />;
        case 'Documents':
          return <StaffDocuments />;
        default:
          return <StaffHome />;
      }
    } else {
      // Manager Pages
      switch (currentPage) {
        case 'Homepage':
          return <ManagerHome />;
        case 'Weekly Schedule':
          return <ManagerSchedule />;
        case 'Timesheet':
          return <ManagerTimesheet />;
        case 'Task':
          return <ManagerTasks />;
        case 'Onboarding Progress':
          return <ManagerOnboarding />;
        case 'Documents':
          return <ManagerDocuments />;
        default:
          return <ManagerHome />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 antialiased selection:bg-indigo-600 selection:text-slate-950" style={{ backgroundColor: '#f8fafc' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top RBAC Security Status Strip */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs">
          {effectiveRole === 'manager' ? (
            <div className="flex items-center gap-2 text-indigo-900 font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Manager Console • Full Operational & Administrative Access</span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="hidden sm:inline font-normal text-slate-600">Active Admin: {activeStaff.firstName} {activeStaff.lastName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Employee Portal • {activeStaff.firstName} {activeStaff.lastName} ({activeStaff.position})</span>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 uppercase">
                Staff Role
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {effectiveRole === 'staff' ? (
              <button
                onClick={() => {
                  setShowManagerPinModal(true);
                  setPinInput('');
                  setPinError('');
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                <KeyRound className="w-3 h-3 text-indigo-600" />
                Manager PIN Login
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Admin Authorized
                </span>
                {activeStaff.role === 'manager' && currentRole === 'staff' && (
                  <button
                    onClick={() => switchRole('manager')}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Exit Staff Preview
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <OnboardingGuard>
            {renderContent()}
          </OnboardingGuard>
        </main>

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Malaya Corner 7shifts Portal</span>
              <span>•</span>
              <span>Restaurant HR, Workforce Roster, & Operations</span>
            </div>
            <div className="text-slate-400">
              Sunnybank Plaza, QLD • Malaya Corner
            </div>
          </div>
        </footer>
      </div>

      {/* Manager PIN Modal (Accessible from top bar) */}
      {showManagerPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Lock className="w-4 h-4 text-indigo-600" />
                Manager Authentication
              </div>
              <button
                onClick={() => setShowManagerPinModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManagerLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Manager Security PIN (Demo: 1234)
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  maxLength={6}
                  placeholder="••••"
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {pinError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManagerPinModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-200"
                >
                  Unlock Manager View
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
