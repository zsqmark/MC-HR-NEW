import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { canPerformJob, StaffType } from '../../types';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Repeat,
  User,
  Users,
  MessageSquare,
  Send,
  Sparkles,
  Wine,
  Utensils,
  Lock,
} from 'lucide-react';

export const StaffTasks: React.FC = () => {
  const { activeStaff, tasks, confirmTaskDone } = useApp();

  const [scope, setScope] = useState<'all' | 'assigned_to_me' | 'open_team'>('all');
  const [filterType, setFilterType] = useState<'all' | 'one_off' | 'recurring_weekly'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');

  const userStaffType: StaffType =
    activeStaff.staffType ||
    (activeStaff.position?.toLowerCase().includes('bar') ? 'bar_staff' : 'wait_staff');

  // Tasks available to this staff member: either directly assigned, or unassigned/team tasks
  const relevantTasks = tasks.filter(
    (t) =>
      t.assignedToStaffId === activeStaff.id ||
      !t.assignedToStaffId ||
      t.assignedToStaffId === 'unassigned'
  );

  const assignedToMeTasks = tasks.filter((t) => t.assignedToStaffId === activeStaff.id);
  const openTeamTasks = tasks.filter(
    (t) => !t.assignedToStaffId || t.assignedToStaffId === 'unassigned'
  );

  const displayedTasks = relevantTasks.filter((t) => {
    // Scope filter
    if (scope === 'assigned_to_me' && t.assignedToStaffId !== activeStaff.id) return false;
    if (
      scope === 'open_team' &&
      t.assignedToStaffId &&
      t.assignedToStaffId !== 'unassigned'
    )
      return false;

    // Type filter
    if (filterType !== 'all' && t.taskType !== filterType) return false;

    // Status filter
    if (filterStatus === 'pending' && t.isCompleted) return false;
    if (filterStatus === 'completed' && !t.isCompleted) return false;

    return true;
  });

  const handleConfirmDone = (taskId: string) => {
    confirmTaskDone(
      taskId,
      completionNote || 'Completed on shift by staff.',
      { id: activeStaff.id, name: `${activeStaff.firstName} ${activeStaff.lastName}` }
    );
    setCompletingTaskId(null);
    setCompletionNote('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            Operations Task Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Shift & Team Tasks
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            One-off duties and weekly recurring tasks assigned to you or open for the floor crew.
          </p>
        </div>

        {/* Scope Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setScope('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              scope === 'all'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Available ({relevantTasks.length})
          </button>
          <button
            onClick={() => setScope('assigned_to_me')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              scope === 'assigned_to_me'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assigned to Me ({assignedToMeTasks.length})
          </button>
          <button
            onClick={() => setScope('open_team')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              scope === 'open_team'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Open Team ({openTeamTasks.length})
          </button>
        </div>
      </div>

      {/* Role Certification Info Banner */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
          userStaffType === 'bar_staff'
            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
            : 'bg-sky-50/70 border-sky-200 text-sky-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {userStaffType === 'bar_staff' ? (
            <Wine className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <Utensils className="w-4 h-4 text-sky-600 shrink-0" />
          )}
          <div>
            <span className="font-bold">
              {userStaffType === 'bar_staff' ? 'Bar Staff Profile' : 'Wait Staff Profile'}:
            </span>{' '}
            {userStaffType === 'bar_staff'
              ? 'Certified for Bar station equipment and qualified for cross-duty Wait Staff floor tasks.'
              : 'Qualified for dining room, table, and floor tasks. Bar station duties require Bar Staff certification.'}
          </div>
        </div>
      </div>

      {/* Sub-Filters: Type & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700">Type:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setFilterType('one_off')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer ${
              filterType === 'one_off'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            One-Off Tasks
          </button>
          <button
            onClick={() => setFilterType('recurring_weekly')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer ${
              filterType === 'recurring_weekly'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <Repeat className="w-3 h-3" />
            Weekly Recurring
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Only</option>
            <option value="completed">Completed Only</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {displayedTasks.length > 0 ? (
          displayedTasks.map((task) => {
            const isSelectedForDone = completingTaskId === task.id;
            const isUnassigned = !task.assignedToStaffId || task.assignedToStaffId === 'unassigned';
            const isRecurring = task.taskType === 'recurring_weekly';
            const isQualified = canPerformJob(userStaffType, task.targetRole);

            return (
              <div
                key={task.id}
                className={`bg-white p-5 rounded-2xl border transition-all ${
                  task.isCompleted
                    ? 'border-slate-200 opacity-80'
                    : 'border-slate-200 hover:border-indigo-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Station Target Role Badge */}
                      {task.targetRole === 'bar_staff' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          <Wine className="w-3 h-3 text-amber-700" />
                          Bar Station
                        </span>
                      ) : task.targetRole === 'wait_staff' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 border border-sky-200">
                          <Utensils className="w-3 h-3 text-sky-700" />
                          Wait Staff Floor
                        </span>
                      ) : null}

                      {/* Task Type Badge */}
                      {isRecurring ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Repeat className="w-3 h-3 text-indigo-600" />
                          Weekly Recurring
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-700" />
                          One-Off Task
                        </span>
                      )}

                      {/* Assignment Badge */}
                      {isUnassigned ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Users className="w-3 h-3 text-emerald-600" />
                          Open Team Task
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          <User className="w-3 h-3 text-indigo-600" />
                          Assigned to You
                        </span>
                      )}

                      {/* Priority */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          task.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {task.priority} priority
                      </span>

                      {/* Shift */}
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {task.shift} shift
                      </span>

                      {/* Completed Badge or Due Schedule */}
                      {task.isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Done at {task.completedAt}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                          <Calendar className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-base font-bold ${
                        task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="text-[11px] text-slate-400 pt-1">
                      Assigned by: <span className="font-semibold text-slate-700">{task.assignedByManager}</span>
                    </div>

                    {task.isCompleted && (
                      <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Completed by {task.completedByStaffName || 'Team Member'}
                        </div>
                        {task.completionNote && (
                          <div className="text-[11px] text-emerald-800 italic mt-0.5">
                            Note: "{task.completionNote}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {!task.isCompleted && (
                    <div className="sm:text-right shrink-0">
                      {!isQualified ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          Bar Staff Station Only
                        </div>
                      ) : !isSelectedForDone ? (
                        <button
                          onClick={() => setCompletingTaskId(task.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm Done
                        </button>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 space-y-2 w-full sm:w-64 text-left animate-in fade-in zoom-in-95">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Completion Note (Optional):
                          </label>
                          <input
                            type="text"
                            value={completionNote}
                            onChange={(e) => setCompletionNote(e.target.value)}
                            placeholder="e.g. Cleaned & restocked..."
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConfirmDone(task.id)}
                              className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                              Submit Done
                            </button>
                            <button
                              onClick={() => setCompletingTaskId(null)}
                              className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
            <p className="font-semibold text-slate-700 text-sm">No tasks in this view</p>
            <p>You have no pending or completed tasks matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
