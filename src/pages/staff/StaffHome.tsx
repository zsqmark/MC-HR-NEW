import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  AlertCircle,
  Sparkles,
  FileText,
  Wine,
  Utensils,
  Calendar,
  ClipboardList,
  CheckSquare,
  ArrowRight,
} from 'lucide-react';

export const StaffHome: React.FC = () => {
  const {
    activeStaff,
    clockRecords,
    shifts,
    tasks,
    setCurrentPage,
    clockIn,
    clockOut,
  } = useApp();

  // Active clock record
  const activeRecord = clockRecords.find(
    (r) => r.staffId === activeStaff.id && r.status === 'clocked_in'
  );

  const myShifts = shifts.filter((s) => s.assignedStaffId === activeStaff.id);
  const myPendingTasks = tasks.filter((t) => !t.isCompleted && (!t.assignedStaffId || t.assignedStaffId === activeStaff.id));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Malaya Corner Operations
              </div>
              {(activeStaff.staffType || 'wait_staff') === 'bar_staff' ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-semibold backdrop-blur-xs border border-amber-400/30">
                  <Wine className="w-3.5 h-3.5 text-amber-400" />
                  Bar Station • Cross-Duty Qualified
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-200 text-xs font-semibold backdrop-blur-xs border border-sky-400/30">
                  <Utensils className="w-3.5 h-3.5 text-sky-400" />
                  Wait Station • Floor Operations
                </div>
              )}
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {activeStaff.firstName}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              You are signed in as <strong className="text-white font-semibold">{activeStaff.position}</strong>. Check your shifts, punch your timeclock, and complete opening & closing checklists.
            </p>
          </div>

          {/* Quick Action Punch Status */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 w-full md:w-auto md:min-w-[260px]">
            <div className="text-xs font-medium text-slate-300 mb-1">Time Clock Status</div>
            {activeRecord ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Clocked In ({activeRecord.shiftType.toUpperCase()})
                  </span>
                  <span className="text-xs font-mono text-slate-300">{activeRecord.clockInTime}</span>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => clockOut(activeStaff.id)}
                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Clock Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-300">Not currently clocked in.</div>
                <button
                  onClick={() => setCurrentPage('Clock In/Out')}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  Go to Time Clock
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Quick Action Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => setCurrentPage('My Schedule')}
          className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 text-left hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">My Schedule</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{myShifts.length} shifts scheduled</div>
        </button>

        <button
          onClick={() => setCurrentPage('Daily Checklist')}
          className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 text-left hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Station Checklist</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Opening, safety & closing</div>
        </button>

        <button
          onClick={() => setCurrentPage('My Availability')}
          className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 text-left hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">My Availability</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Weekly shift requests</div>
        </button>

        <button
          onClick={() => setCurrentPage('My Task')}
          className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 text-left hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Shift Tasks</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{myPendingTasks.length} pending duties</div>
        </button>
      </div>

      {/* Onboarding Notice if Incomplete */}
      {!activeStaff.onboardingCompleted && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900">
              <span className="font-bold">Onboarding Form Incomplete:</span> Please submit your personal details, bank details, and employee documents to finalize your employment records.
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('Onboarding')}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shrink-0 transition-colors shadow-xs"
          >
            Complete Form
          </button>
        </div>
      )}

      {/* Staff Operational Announcements & Shift Policy */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          Malaya Corner Staff Bulletin & Standard Reminders
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 text-sm block">
              1. Availability Submissions Deadline
            </span>
            <p>
              Please submit your weekly lunch & dinner shift preferences on the <strong className="text-slate-800 font-semibold">My Availability</strong> page by every Wednesday 17:00. Manager Mark publishes the finalized roster every Thursday morning.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 text-sm block">
              2. Food Safety Standard 3.2.2A Compliance
            </span>
            <p>
              Walk-in cooler and bain-marie broth temperatures must be logged twice daily. Wash hands at designated handwash sinks before plating dishes or entering front service stations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
