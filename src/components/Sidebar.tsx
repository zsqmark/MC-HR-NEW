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
  RotateCcw,
  UserCheck2,
  Menu,
  X,
  MapPin,
  ShieldAlert,
  User,
  Users,
  LogOut,
  KeyRound,
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
    lockTerminal,
  } = useApp();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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
    { name: 'Staffs', icon: Users },
    { name: 'Documents', icon: FolderLock },
  ];

  const navItems: NavItem[] = effectiveRole === 'manager' ? managerNavItems : staffNavItems;

  const handleNavClick = (pageName: string) => {
    setCurrentPage(pageName);
    setMobileDrawerOpen(false);
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

      {/* 2. Active User Profile (Displays strictly active user's own profile) */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/70">
        <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                {activeStaff.firstName.charAt(0)}
                {activeStaff.lastName.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full" title="Active Profile" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate flex items-center gap-1.5">
                <span className="truncate">{activeStaff.firstName} {activeStaff.lastName}</span>
                {activeStaff.role === 'manager' ? (
                  <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold shrink-0">
                    Manager
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold shrink-0 border border-slate-200">
                    Staff
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1.5 mt-0.5">
                <span className="truncate">{activeStaff.position}</span>
              </div>
            </div>
          </div>
        </div>
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
          onClick={() => {
            setMobileDrawerOpen(false);
            lockTerminal();
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer font-bold shadow-2xs"
          title="Sign out of current session"
        >
          <LogOut className="w-3.5 h-3.5 text-red-600" />
          Sign Out
        </button>

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
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30 px-3 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-1.5 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 shadow-2xs flex items-center justify-center shrink-0 p-0.5">
              <MalayaLogo className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
                  Malaya Corner
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                  effectiveRole === 'manager'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {effectiveRole}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate -mt-0.5">
                {activeStaff.firstName} {activeStaff.lastName}
              </div>
            </div>
          </div>
        </div>

        {/* Right side controls on mobile */}
        <div className="flex items-center gap-1.5 shrink-0">
          {effectiveRole === 'staff' && activeClockRecord && (
            <button
              onClick={() => setCurrentPage('Clock In/Out')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold cursor-pointer shrink-0"
              title="Currently Clocked In"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>In</span>
            </button>
          )}

          <button
            onClick={() => lockTerminal()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span className="text-[11px] font-bold">Sign Out</span>
          </button>

          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs cursor-pointer shrink-0 ml-0.5"
            title="Open Profile Menu"
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

      {/* Mobile Sticky Bottom Navigation Bar (7shifts Native Style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 shadow-lg flex items-center justify-around select-none">
        {(effectiveRole === 'manager'
          ? [
              { name: 'Homepage', label: 'Home', icon: Home },
              { name: 'Weekly Schedule', label: 'Roster', icon: Calendar },
              { name: 'Timesheet', label: 'Timesheet', icon: Clock },
              { name: 'Staffs', label: 'Staffs', icon: Users },
              { name: 'More', label: 'More', icon: Menu, action: () => setMobileDrawerOpen(true) },
            ]
          : [
              { name: 'Homepage', label: 'Home', icon: Home },
              { name: 'My Schedule', label: 'Schedule', icon: Calendar },
              { name: 'Clock In/Out', label: 'Clock', icon: Clock },
              { name: 'Daily Checklist', label: 'Checklist', icon: ClipboardList },
              { name: 'More', label: 'More', icon: Menu, action: () => setMobileDrawerOpen(true) },
            ]
        ).map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.name;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  setCurrentPage(item.name);
                }
              }}
              className={`flex-1 py-1.5 px-0.5 flex flex-col items-center justify-center gap-0.5 transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 stroke-[2.3]' : 'text-slate-500'}`} />
                {item.name === 'Clock In/Out' && activeClockRecord && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white" />
                )}
              </div>
              <span className="text-[10px] leading-tight truncate max-w-[62px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Desktop Persistent Left Sidebar (visible on md: and above) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-30 shadow-xs">
        {sidebarContent}
      </aside>
    </>
  );
};
