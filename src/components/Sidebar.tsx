import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MalayaLogo } from './MalayaLogo';
import {
  Calendar,
  Clock,
  CheckSquare,
  ClipboardList,
  UserCheck,
  FolderLock,
  Home,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
  UserCheck2,
  Menu,
  X,
  MapPin,
  ShieldAlert,
  User,
  Lock,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const {
    currentRole,
    currentPage,
    setCurrentPage,
    switchRole,
    activeStaff,
    staffUsers,
    switchUser,
    authenticateManager,
    clockRecords,
    resetToDefaults,
  } = useApp();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showManagerPinModal, setShowManagerPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Is active logged in user a staff member?
  const isStaffUser = activeStaff.role === 'staff';

  // Effective role: If logged in as staff, role is strictly staff
  const effectiveRole = isStaffUser ? 'staff' : currentRole;

  // Check if current staff is currently clocked in
  const activeClockRecord = clockRecords.find(
    (r) => r.staffId === activeStaff.id && r.status === 'clocked_in'
  );

  const staffNavItems: NavItem[] = [
    { name: 'Homepage', icon: Home },
    { name: 'My Schedule', icon: Calendar },
    { name: 'My Availability', icon: Calendar },
    { name: 'Clock In/Out', icon: Clock, badge: activeClockRecord ? 'Active' : null },
    { name: 'My Task', icon: CheckSquare },
    { name: 'Daily Checklist', icon: ClipboardList },
    {
      name: 'Onboarding',
      icon: UserCheck2,
      badge: !activeStaff.onboardingCompleted ? 'Required' : 'Done',
      badgeColor: !activeStaff.onboardingCompleted ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
    },
    { name: 'Documents', icon: FolderLock },
  ];

  const managerNavItems: NavItem[] = [
    { name: 'Homepage', icon: Home },
    { name: 'Weekly Schedule', icon: Calendar },
    { name: 'Timesheet', icon: Clock },
    { name: 'Task', icon: CheckSquare },
    { name: 'Onboarding Progress', icon: UserCheck },
    { name: 'Documents', icon: FolderLock },
  ];

  const navItems: NavItem[] = effectiveRole === 'manager' ? managerNavItems : staffNavItems;

  const handleNavClick = (pageName: string) => {
    setCurrentPage(pageName);
    setMobileDrawerOpen(false);
  };

  const handleUserSelect = (userId: string, targetRole: 'staff' | 'manager') => {
    // If current user is a staff member and tries to select a manager account, require PIN authorization
    if (isStaffUser && targetRole === 'manager') {
      setUserDropdownOpen(false);
      setPinInput('');
      setPinError('');
      setShowManagerPinModal(true);
      return;
    }

    switchUser(userId);
    setUserDropdownOpen(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    const success = authenticateManager(pinInput);
    if (success) {
      setShowManagerPinModal(false);
      setPinInput('');
    } else {
      setPinError('Invalid Manager PIN. Access to Manager View is denied.');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-900 border-r border-slate-200 select-none">
      {/* 1. Brand & Branch Identity */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center shrink-0 p-1">
            <MalayaLogo className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-slate-900 text-base tracking-tight truncate">
                Malaya Corner
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              Sunnybank, QLD
            </p>
          </div>
        </div>
      </div>

      {/* 3. Active User Card & Switcher */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/70 relative">
        <button
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 transition-all text-left shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {activeStaff.firstName.charAt(0)}
              {activeStaff.lastName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate flex items-center gap-1">
                {activeStaff.firstName} {activeStaff.lastName}
                {activeStaff.role === 'manager' ? (
                  <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-medium shrink-0">
                    Manager
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium shrink-0">
                    Staff
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-medium truncate">
                {activeStaff.position}
              </div>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
              userDropdownOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>

        {/* User Switcher Dropdown Popover */}
        {userDropdownOpen && (
          <div
            className="absolute left-3 right-3 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
            onMouseLeave={() => setUserDropdownOpen(false)}
          >
            <div className="px-3 py-1.5 border-b border-slate-100">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Switch Active User
              </p>
              <p className="text-[11px] text-slate-500">
                {isStaffUser
                  ? 'Switch between staff profiles (Manager is PIN protected)'
                  : 'Toggle profiles for workforce testing'}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto py-1">
              {staffUsers.map((user) => {
                const isManagerAccount = user.role === 'manager';
                const isLockedForCurrentStaff = isStaffUser && isManagerAccount;

                return (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user.id, user.role)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                      user.id === activeStaff.id ? 'bg-indigo-50/70 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          user.role === 'manager'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {user.firstName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-900 flex items-center gap-1 font-medium truncate">
                          {user.firstName} {user.lastName}
                          {user.id === 'staff-chloe' && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold shrink-0">
                              New
                            </span>
                          )}
                          {isLockedForCurrentStaff && (
                            <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{user.position}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold shrink-0 ml-1 ${
                        isLockedForCurrentStaff
                          ? 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {isLockedForCurrentStaff ? 'PIN Req' : user.role}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-100 px-3 pt-2 mt-1">
              <button
                onClick={() => {
                  resetToDefaults();
                  setUserDropdownOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 cursor-pointer font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Live Clock Indicator (if Staff is actively clocked in) */}
      {effectiveRole === 'staff' && activeClockRecord && (
        <div className="px-3 pt-3">
          <button
            onClick={() => handleNavClick('Clock In/Out')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="truncate">
                Clocked In:{' '}
                <strong className="uppercase">{activeClockRecord.shiftType}</strong>
              </span>
            </div>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold shrink-0">
              Clock
            </span>
          </button>
        </div>
      )}

      {/* 5. Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {effectiveRole === 'manager' ? 'Manager Operations' : 'Staff Workspace'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.name;
          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.name)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.name}</span>
              </div>
              {'badge' in item && item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    isActive
                      ? 'bg-black/15 text-slate-950'
                      : item.badgeColor || 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 6. Sidebar Footer (Store info & quick actions) */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sunnybank Branch</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Store #104</span>
        </div>

        <button
          onClick={resetToDefaults}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer font-medium"
          title="Reset application to original sample data"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          Reset Demo Data
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header (only visible on mobile screens < md) */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 shadow-xs flex items-center justify-center shrink-0 p-0.5">
              <MalayaLogo className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                Malaya Corner
              </span>
              <span className="text-[10px] font-bold text-indigo-600 ml-1.5 uppercase">
                {effectiveRole}
              </span>
            </div>
          </div>
        </div>

        {/* Right side controls on mobile */}
        <div className="flex items-center gap-2">
          {effectiveRole === 'staff' && activeClockRecord && (
            <button
              onClick={() => setCurrentPage('Clock In/Out')}
              className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping mr-1"
              title="Clocked In"
            />
          )}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center font-bold text-xs uppercase"
          >
            {activeStaff.firstName.charAt(0)}
          </button>
        </div>
      </div>

      {/* Mobile Slide-over Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Left Sidebar (visible on md: and above) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Manager Authorization PIN Modal (required when staff attempts to switch to manager view) */}
      {showManagerPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Manager Authorization Required
                </h3>
                <p className="text-xs text-slate-500">
                  Restricted Access • General Manager Only
                </p>
              </div>
            </div>

            <form onSubmit={handlePinSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Staff members do not have permission to switch to <strong className="text-slate-900">Manager View</strong>. Enter the restaurant General Manager override PIN to authenticate.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  Manager Security PIN
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 4-digit PIN (Demo: 1234)"
                  maxLength={6}
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Default Demo Manager PIN: <strong className="text-indigo-600">1234</strong>
                </p>
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowManagerPinModal(false);
                    setPinInput('');
                    setPinError('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs shadow-indigo-200 cursor-pointer"
                >
                  Authenticate & Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
