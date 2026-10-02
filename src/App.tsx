import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { OnboardingGuard } from './components/OnboardingGuard';
import { AccessDenied } from './components/AccessDenied';
import { Shield, User, Lock, KeyRound, LogOut, AlertCircle } from 'lucide-react';

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
  const {
    currentRole,
    currentPage,
    activeStaff,
    authenticateManager,
    switchRole,
    staffUsers,
    switchUser,
    isTerminalLocked,
    setIsTerminalLocked,
    lockTerminal,
  } = useApp();
  const [showManagerPinModal, setShowManagerPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Terminal Lock / Traditional Sign-In State
  const [terminalUserId, setTerminalUserId] = useState('');
  const [terminalPin, setTerminalPin] = useState('');
  const [terminalError, setTerminalError] = useState('');

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

  const handleTerminalUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setTerminalError('');

    if (!terminalUserId) {
      setTerminalError('Please select your employee name to sign in.');
      return;
    }

    const selectedUser = staffUsers.find((u) => u.id === terminalUserId);
    if (!selectedUser) return;

    const cleanPin = terminalPin.trim();
    // Verify against the employee's personal PIN or manager master override PIN (1234)
    const isCorrect = selectedUser.pin === cleanPin || cleanPin === '1234';

    if (!isCorrect) {
      setTerminalError(`Incorrect Security PIN for ${selectedUser.firstName}. Please enter the 4-digit PIN configured for this employee.`);
      return;
    }

    if (selectedUser.role === 'manager') {
      authenticateManager(terminalPin);
    } else {
      switchUser(terminalUserId);
    }

    setIsTerminalLocked(false);
    setTerminalPin('');
    setTerminalUserId('');
  };

  const renderContent = () => {
    if (effectiveRole === 'staff') {
      // If a staff user attempts to view manager administrative pages, trigger AccessDenied
      const managerOnlyPages = ['Weekly Schedule', 'Timesheet', 'Task', 'Staffs', 'Onboarding Progress'];
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
        case 'Staffs':
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
        {/* Top RBAC Security Status Strip (Desktop persistent view; mobile has clean unified header) */}
        <div className="hidden md:flex bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 items-center justify-between text-xs">
          {effectiveRole === 'manager' ? (
            <div className="flex items-center gap-1.5 text-indigo-900 font-semibold min-w-0">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0"></span>
              <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate text-xs">Manager Console</span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="hidden sm:inline font-normal text-slate-600 truncate">Admin: {activeStaff.firstName} {activeStaff.lastName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-700 font-medium min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Verified Session"></span>
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900 truncate text-xs">
                {activeStaff.firstName} {activeStaff.lastName}
              </span>
              <span className="text-slate-500 font-normal hidden sm:inline">({activeStaff.position})</span>
              <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold border border-slate-200 uppercase tracking-wider">
                <Shield className="w-2.5 h-2.5 text-slate-400" />
                Verified
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {effectiveRole === 'staff' ? (
              <>
                <button
                  onClick={() => {
                    setShowManagerPinModal(true);
                    setPinInput('');
                    setPinError('');
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3 h-3 text-indigo-600" />
                  <span className="hidden sm:inline">Manager</span> PIN
                </button>
                <button
                  onClick={() => {
                    setTerminalUserId(activeStaff.id);
                    setTerminalPin('');
                    setTerminalError('');
                    setIsTerminalLocked(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-[11px] transition-colors cursor-pointer"
                  title="Sign out of current session"
                >
                  <LogOut className="w-3 h-3 text-red-600" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full hidden sm:inline">
                  Admin Authorized
                </span>
                {activeStaff.role === 'manager' && currentRole === 'staff' && (
                  <button
                    onClick={() => switchRole('manager')}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Exit Preview
                  </button>
                )}
                <button
                  onClick={() => {
                    setTerminalUserId(activeStaff.id);
                    setTerminalPin('');
                    setTerminalError('');
                    setIsTerminalLocked(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer ml-1"
                  title="Sign out of manager console"
                >
                  <LogOut className="w-3 h-3 text-slate-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <OnboardingGuard>
            {renderContent()}
          </OnboardingGuard>
        </main>

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200 py-3.5 px-4 sm:px-6 text-xs text-slate-500 pb-20 md:pb-3.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span>Restaurant HR, Workforce Roster, & Operations</span>
            </div>
            <div className="text-slate-400">
              Sunnybank Market Square, QLD • Malaya Corner
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

      {/* Workforce Terminal Sign-In Screen */}
      {isTerminalLocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200 text-left space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Terminal Header */}
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 mb-3">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Workforce Terminal Sign-In
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sunnybank Market Square • Employee Authentication
              </p>
            </div>

            {/* Terminal Sign-In Form */}
            <form onSubmit={handleTerminalUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Select Employee Profile
                </label>
                <select
                  value={terminalUserId}
                  onChange={(e) => setTerminalUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
                >
                  <option value="">-- Choose Employee Profile --</option>
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.position} • {u.role === 'manager' ? 'Manager' : 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>4-Digit Security PIN</span>
                  {terminalUserId && (
                    <span className="text-[11px] font-normal text-indigo-600 font-sans">
                      PIN configured for this employee
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={terminalPin}
                  onChange={(e) => setTerminalPin(e.target.value)}
                  maxLength={4}
                  placeholder="••••"
                  autoFocus
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-center text-xl font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                {terminalUserId && (
                  <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                    Security PIN (Demo: <strong className="text-indigo-600 font-mono">{staffUsers.find((s) => s.id === terminalUserId)?.pin || '1234'}</strong>)
                  </p>
                )}
              </div>

              {/* Quick Keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (terminalPin.length < 4) setTerminalPin((p) => p + num);
                    }}
                    className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition-colors cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTerminalPin('')}
                  className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (terminalPin.length < 4) setTerminalPin((p) => p + '0');
                  }}
                  className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition-colors cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setTerminalPin((p) => p.slice(0, -1))}
                  className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  ⌫
                </button>
              </div>

              {terminalError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{terminalError}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTerminalLocked(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
                >
                  Authenticate & Sign In
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
