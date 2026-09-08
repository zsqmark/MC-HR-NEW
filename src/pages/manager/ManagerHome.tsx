import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Calendar,
  Clock,
  CheckSquare,
  FolderLock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Coffee,
  Sparkles,
  Building,
} from 'lucide-react';

export const ManagerHome: React.FC = () => {
  const {
    staffUsers,
    shifts,
    clockRecords,
    tasks,
    onboardingRecords,
    setCurrentPage,
    switchUser,
  } = useApp();

  // On-duty staff right now
  const onDutyRecords = clockRecords.filter(
    (r) => r.status === 'clocked_in'
  );

  // Today's total scheduled shifts
  const todayShifts = shifts.filter((s) => s.day === 'FRI'); // Simulated today: Friday

  // Pending onboarding
  const pendingOnboardingStaff = staffUsers.filter((s) => !s.onboardingCompleted);

  // Pending tasks
  const pendingTasks = tasks.filter((t) => !t.isCompleted);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-xs border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Malaya Corner • Manager Operations Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Restaurant Manager Dashboard
            </h1>
            <p className="text-slate-300 text-sm max-w-xl font-normal leading-relaxed">
              Welcome back, <strong className="text-white font-semibold">Mark Zhang</strong>. Roster scheduling, live timesheet punches, shift tasks, and new hire onboarding are summarized below.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
            <div>
              <div className="text-xs text-slate-300">Live Floor Crew</div>
              <div className="text-2xl font-black text-emerald-400">
                {onDutyRecords.length} Active
              </div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div>
              <div className="text-xs text-slate-300">Shift Coverage</div>
              <div className="text-2xl font-black text-indigo-300">100%</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>On-Duty Staff</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {onDutyRecords.length} Active On Duty
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Floor and kitchen team currently clocked in
          </p>
          <button
            onClick={() => setCurrentPage('Timesheet')}
            className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            Live Timesheet <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Weekly Roster</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {shifts.length} Shifts
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lunch & dinner services allocated
          </p>
          <button
            onClick={() => setCurrentPage('Weekly Schedule')}
            className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            Manage Schedule <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Shift Tasks</span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {pendingTasks.length} Incomplete
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {tasks.length - pendingTasks.length} of {tasks.length} duties completed today
          </p>
          <button
            onClick={() => setCurrentPage('Task')}
            className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            Manage Tasks <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Onboarding Submissions</span>
            <FolderLock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {pendingOnboardingStaff.length} New Hire
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {pendingOnboardingStaff.map((s) => s.firstName).join(', ') || 'All verified'}
          </p>
          <button
            onClick={() => setCurrentPage('Onboarding Progress')}
            className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            Review Forms <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Who is working now & Compliance Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live On-Duty Floor Staff */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="font-bold text-sm text-slate-900">
                Staff Clocked In Right Now (Floor & Kitchen)
              </h2>
            </div>
            <span className="text-xs text-slate-500">Live Sync</span>
          </div>

          <div className="divide-y divide-slate-100">
            {onDutyRecords.length > 0 ? (
              onDutyRecords.map((record) => {
                return (
                  <div
                    key={record.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                        {record.staffName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          {record.staffName}
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Active Duty
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {record.position} • Shift: {record.shiftType.toUpperCase()} (Punched in at {record.clockInTime})
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No staff are currently clocked in.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Operational Action Items */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-indigo-600" />
              Action Items & Alerts
            </h2>
            <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              {pendingTasks.length + pendingOnboardingStaff.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingOnboardingStaff.length > 0 && (
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/70 text-xs space-y-2">
                <div className="font-bold text-indigo-950 flex items-center justify-between">
                  <span>New Staff Onboarding Incomplete</span>
                  <span className="text-[9px] uppercase font-bold text-indigo-700 bg-indigo-200/80 px-1.5 py-0.2 rounded">
                    Action Required
                  </span>
                </div>
                <p className="text-indigo-800 text-[11px]">
                  Chloe Lin has been added but has not completed the 15-question onboarding submission and banking setup.
                </p>
                <button
                  onClick={() => setCurrentPage('Onboarding Progress')}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition-colors shadow-xs shadow-indigo-200 cursor-pointer"
                >
                  View Onboarding Status
                </button>
              </div>
            )}

            {pendingTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 text-xs space-y-1"
              >
                <div className="font-bold text-slate-900 flex items-center justify-between gap-2">
                  <span className="truncate">{task.title}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {task.taskType === 'recurring_weekly' ? 'Weekly' : 'One-Off'}
                    </span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-[11px] line-clamp-2">{task.description}</p>
                <div className="text-[10px] text-slate-400 font-medium">
                  {task.assignedStaffName || 'Unassigned (Open Team Task)'} • {task.dueDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
