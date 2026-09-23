import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  FileText,
  Wine,
  Utensils,
} from 'lucide-react';

export const StaffHome: React.FC = () => {
  const {
    activeStaff,
    shifts,
    clockRecords,
    tasks,
    setCurrentPage,
    clockIn,
    clockOut,
    confirmTaskDone,
  } = useApp();

  // Active clock record
  const activeRecord = clockRecords.find(
    (r) => r.staffId === activeStaff.id && r.status === 'clocked_in'
  );

  // Today's scheduled shifts for this staff
  const todayShifts = shifts.filter(
    (s) => s.assignedStaffId === activeStaff.id
  );

  // My tasks (assigned directly or open to team, excluding weekly recurring tasks)
  const myTasks = tasks.filter(
    (t) =>
      t.taskType !== 'recurring_weekly' &&
      (t.assignedToStaffId === activeStaff.id ||
        !t.assignedToStaffId ||
        t.assignedToStaffId === 'unassigned')
  );
  const pendingTasks = myTasks.filter((t) => !t.isCompleted);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Malaya Corner Operations
              </div>
              {(activeStaff.staffType || 'wait_staff') === 'bar_staff' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-semibold backdrop-blur-xs border border-amber-400/30">
                  <Wine className="w-3.5 h-3.5 text-amber-400" />
                  Bar Staff Station • Cross-Duty Qualified
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 text-xs font-semibold backdrop-blur-xs border border-sky-400/30">
                  <Utensils className="w-3.5 h-3.5 text-sky-400" />
                  Wait Staff Station • Floor & Dining
                </div>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Good day, {activeStaff.firstName}!
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              You are assigned as <strong className="text-white font-semibold">{activeStaff.position}</strong>. Check your shifts for the week, submit availability, and track your daily role checklist below.
            </p>
          </div>

          {/* Quick Action Punch Status */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 min-w-[260px]">
            <div className="text-xs font-medium text-slate-300 mb-1">Time Clock Status</div>
            {activeRecord ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Clocked In ({activeRecord.shiftType.toUpperCase()})
                  </span>
                  <span className="text-xs font-mono text-slate-300">Started {activeRecord.clockInTime}</span>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => clockOut(activeStaff.id)}
                    className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
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
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200"
                >
                  <Clock className="w-4 h-4" />
                  Go to Time Clock
                </button>
              </div>
            )}
          </div>
        </div>
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

      {/* Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: My Next Shifts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Upcoming Shifts
              </span>
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {todayShifts.length} Shifts Scheduled
            </div>
            <p className="text-xs text-slate-500">
              Across lunch (11:15/11:30) and dinner (16:45/17:15) services this week.
            </p>

            <div className="mt-4 space-y-2">
              {todayShifts.slice(0, 2).map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-800">
                    {s.day} • {s.shiftType.toUpperCase()}
                  </span>
                  <span className="font-mono text-indigo-700 font-semibold">
                    {s.startTime} start
                  </span>
                </div>
              ))}
              {todayShifts.length === 0 && (
                <div className="text-xs text-slate-400 italic py-2">No assigned shifts yet. Check My Schedule.</div>
              )}
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('My Schedule')}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-2 border-t border-slate-100"
          >
            View Weekly Roster <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: My Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Assigned Tasks
              </span>
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {pendingTasks.length} Pending
            </div>
            <p className="text-xs text-slate-500">
              {myTasks.length - pendingTasks.length} completed today. Assigned by Supervisor Mark Zhang.
            </p>

            <div className="mt-4 space-y-2">
              {pendingTasks.slice(0, 2).map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium text-slate-800 truncate">{t.title}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 shrink-0">
                      Shift Task
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-slate-600">
                      {t.assignedToStaffId === activeStaff.id ? 'Assigned to you' : 'Open Team Task'}
                    </span>
                    <span className="text-slate-400 font-mono truncate max-w-[120px]">{t.dueDate}</span>
                  </div>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-xs text-emerald-700 font-medium py-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  All assigned and team tasks are completed!
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('My Task')}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-2 border-t border-slate-100"
          >
            Manage Tasks <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
