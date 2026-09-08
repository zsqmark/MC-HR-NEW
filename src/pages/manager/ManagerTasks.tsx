import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskItem, TaskType, StaffType, canPerformJob, ChecklistItem } from '../../types';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Pencil,
  User,
  Users,
  Filter,
  Search,
  RotateCcw,
  Calendar,
  Repeat,
  Sparkles,
  Wine,
  Utensils,
  Lock,
  X,
  Check,
  ClipboardList,
  Camera,
  Image as ImageIcon,
  Eye,
  ZoomIn,
} from 'lucide-react';

const WEEK_DAYS: { key: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'; label: string }[] = [
  { key: 'MON', label: 'Mon' },
  { key: 'TUE', label: 'Tue' },
  { key: 'WED', label: 'Wed' },
  { key: 'THU', label: 'Thu' },
  { key: 'FRI', label: 'Fri' },
  { key: 'SAT', label: 'Sat' },
  { key: 'SUN', label: 'Sun' },
];

export const ManagerTasks: React.FC = () => {
  const {
    tasks,
    staffUsers,
    createTask,
    updateTask,
    deleteTask,
    resetTask,
    confirmTaskDone,
    checklists,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
  } = useApp();

  // Active top view tab: 'tasks' | 'checklists'
  const [activeViewTab, setActiveViewTab] = useState<'tasks' | 'checklists'>('tasks');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  // Filter states for Tasks
  const [filterType, setFilterType] = useState<'all' | 'one_off' | 'recurring_weekly'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'bar_staff' | 'wait_staff'>('all');
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for Create / Edit
  const [taskType, setTaskType] = useState<TaskType>('one_off');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'bar_staff' | 'wait_staff'>('all');
  const [assignedToStaffId, setAssignedToStaffId] = useState('unassigned');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [shift, setShift] = useState<'lunch' | 'dinner' | 'all'>('dinner');
  const [oneOffDueDate, setOneOffDueDate] = useState('2026-09-08 18:00');
  const [recurringDays, setRecurringDays] = useState<('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[]>([
    'MON',
    'THU',
  ]);
  const [recurringTime, setRecurringTime] = useState('18:00');

  // Checklist management state
  const [selectedChecklistRoleSet, setSelectedChecklistRoleSet] = useState<'bar_staff' | 'wait_staff'>('bar_staff');
  const [showCreateChecklistModal, setShowCreateChecklistModal] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistCategory, setNewChecklistCategory] = useState<'Opening' | 'Mid-Shift Food Safety' | 'Closing'>('Opening');
  const [newChecklistInstructions, setNewChecklistInstructions] = useState('');
  const [newChecklistRequiresTemp, setNewChecklistRequiresTemp] = useState(false);
  const [newChecklistAllowPhoto, setNewChecklistAllowPhoto] = useState(false);
  const [newChecklistRequiresPhoto, setNewChecklistRequiresPhoto] = useState(false);
  const [newChecklistMaxPhotos, setNewChecklistMaxPhotos] = useState<number>(2);

  // Edit checklist modal state
  const [editingChecklistItem, setEditingChecklistItem] = useState<ChecklistItem | null>(null);
  const [editChecklistTitle, setEditChecklistTitle] = useState('');
  const [editChecklistCategory, setEditChecklistCategory] = useState<'Opening' | 'Mid-Shift Food Safety' | 'Closing'>('Opening');
  const [editChecklistInstructions, setEditChecklistInstructions] = useState('');
  const [editChecklistRequiresTemp, setEditChecklistRequiresTemp] = useState(false);
  const [editChecklistAllowPhoto, setEditChecklistAllowPhoto] = useState(false);
  const [editChecklistRequiresPhoto, setEditChecklistRequiresPhoto] = useState(false);
  const [editChecklistMaxPhotos, setEditChecklistMaxPhotos] = useState<number>(2);

  // Photo lightbox preview
  const [previewingPhoto, setPreviewingPhoto] = useState<{
    url: string;
    title: string;
    uploader?: string;
    date?: string;
  } | null>(null);

  const toggleDay = (day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN') => {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setTaskType('one_off');
    setTargetRole('all');
    setAssignedToStaffId('unassigned');
    setPriority('medium');
    setShift('dinner');
    setOneOffDueDate('2026-09-08 18:00');
    setRecurringDays(['MON', 'THU']);
    setRecurringTime('18:00');
    setShowCreateModal(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setTaskType(task.taskType);
    setTargetRole(task.targetRole || 'all');
    setAssignedToStaffId(task.assignedToStaffId || 'unassigned');
    setPriority(task.priority);
    setShift(task.shift);
    setOneOffDueDate(task.dueDate || '2026-09-08 18:00');
    setRecurringDays(task.recurringDays || ['MON', 'THU']);
    setRecurringTime(task.dueDate?.match(/\d{2}:\d{2}/)?.[0] || '18:00');
    setShowCreateModal(true);
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();

    const isUnassigned = assignedToStaffId === 'unassigned' || !assignedToStaffId;
    const staff = !isUnassigned ? staffUsers.find((s) => s.id === assignedToStaffId) : null;
    const staffName = staff ? `${staff.firstName} ${staff.lastName}` : 'Unassigned (Open Team Task)';

    let formattedDueDate = oneOffDueDate;
    if (taskType === 'recurring_weekly') {
      const daysStr =
        recurringDays.length > 0
          ? recurringDays.map((d) => WEEK_DAYS.find((w) => w.key === d)?.label || d).join(', ')
          : 'Weekly';
      formattedDueDate = `Every ${daysStr} by ${recurringTime}`;
    }

    if (editingTask) {
      // Edit existing task
      updateTask(editingTask.id, {
        title,
        description,
        taskType,
        targetRole,
        recurringDays: taskType === 'recurring_weekly' ? recurringDays : undefined,
        assignedToStaffId: isUnassigned ? undefined : assignedToStaffId,
        assignedStaffName: staffName,
        priority,
        shift,
        dueDate: formattedDueDate,
      });
    } else {
      // Create new task
      createTask({
        title,
        description,
        taskType,
        targetRole,
        recurringDays: taskType === 'recurring_weekly' ? recurringDays : undefined,
        assignedToStaffId: isUnassigned ? undefined : assignedToStaffId,
        assignedStaffName: staffName,
        assignedByManager: 'Mark Zhang',
        priority,
        shift,
        dueDate: formattedDueDate,
      });
    }

    setShowCreateModal(false);
    setEditingTask(null);
  };

  const handleDeleteConfirmed = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  const handleCreateChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;

    createChecklistItem({
      title: newChecklistTitle.trim(),
      category: newChecklistCategory,
      roleSet: selectedChecklistRoleSet,
      instructions: newChecklistInstructions.trim() || undefined,
      requiresTemp: newChecklistRequiresTemp,
      requiresPhoto: newChecklistAllowPhoto ? newChecklistRequiresPhoto : false,
      maxPhotos: newChecklistAllowPhoto ? Math.max(1, Math.min(5, Number(newChecklistMaxPhotos) || 1)) : undefined,
    });

    setNewChecklistTitle('');
    setNewChecklistInstructions('');
    setNewChecklistRequiresTemp(false);
    setNewChecklistAllowPhoto(false);
    setNewChecklistRequiresPhoto(false);
    setNewChecklistMaxPhotos(2);
    setShowCreateChecklistModal(false);
  };

  const openEditChecklistItemModal = (item: ChecklistItem) => {
    setEditingChecklistItem(item);
    setEditChecklistTitle(item.title);
    setEditChecklistCategory(item.category);
    setEditChecklistInstructions(item.instructions || '');
    setEditChecklistRequiresTemp(Boolean(item.requiresTemp));
    setEditChecklistAllowPhoto(Boolean(item.requiresPhoto || (item.maxPhotos && item.maxPhotos > 0)));
    setEditChecklistRequiresPhoto(Boolean(item.requiresPhoto));
    setEditChecklistMaxPhotos(item.maxPhotos || 2);
  };

  const handleUpdateChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChecklistItem || !editChecklistTitle.trim()) return;

    updateChecklistItem(editingChecklistItem.id, {
      title: editChecklistTitle.trim(),
      category: editChecklistCategory,
      instructions: editChecklistInstructions.trim() || undefined,
      requiresTemp: editChecklistRequiresTemp,
      requiresPhoto: editChecklistAllowPhoto ? editChecklistRequiresPhoto : false,
      maxPhotos: editChecklistAllowPhoto ? Math.max(1, Math.min(5, Number(editChecklistMaxPhotos) || 1)) : undefined,
    });

    setEditingChecklistItem(null);
  };

  // Staff users categorized by staff type
  const barStaffList = staffUsers.filter(
    (u) => (u.staffType || (u.position?.toLowerCase().includes('bar') ? 'bar_staff' : 'wait_staff')) === 'bar_staff'
  );
  const waitStaffList = staffUsers.filter(
    (u) => (u.staffType || (u.position?.toLowerCase().includes('bar') ? 'bar_staff' : 'wait_staff')) === 'wait_staff'
  );

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterType !== 'all' && t.taskType !== filterType) return false;
    if (filterRole !== 'all') {
      const role = t.targetRole || 'all';
      if (role !== 'all' && role !== filterRole) return false;
    }
    if (filterStaff === 'unassigned') {
      if (t.assignedToStaffId && t.assignedToStaffId !== 'unassigned') return false;
    } else if (filterStaff !== 'all') {
      if (t.assignedToStaffId !== filterStaff) return false;
    }
    if (filterShift !== 'all' && t.shift !== filterShift) return false;
    if (filterStatus === 'pending' && t.isCompleted) return false;
    if (filterStatus === 'completed' && !t.isCompleted) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchStaff = (t.assignedStaffName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchStaff) return false;
    }

    return true;
  });

  const oneOffTasks = tasks.filter((t) => t.taskType === 'one_off');
  const recurringTasks = tasks.filter((t) => t.taskType === 'recurring_weekly');
  const pendingCount = tasks.filter((t) => !t.isCompleted).length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            Operations & Task Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Restaurant Tasks & Checklists
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create, edit, and delete one-off or weekly recurring tasks. Manage role-based assignments with Bar Staff / Wait Staff qualifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setActiveViewTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeViewTab === 'tasks'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Duties & Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveViewTab('checklists')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewTab === 'checklists'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Daily Checklists ({checklists.length})
            </button>
          </div>

          {activeViewTab === 'tasks' ? (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs shadow-indigo-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create New Task
            </button>
          ) : (
            <button
              onClick={() => setShowCreateChecklistModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs shadow-indigo-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Checklist Item
            </button>
          )}
        </div>
      </div>

      {activeViewTab === 'tasks' ? (
        <>
          {/* KPI Counters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
                <span>One-Off Tasks</span>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{oneOffTasks.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {oneOffTasks.filter((t) => !t.isCompleted).length} pending / {oneOffTasks.filter((t) => t.isCompleted).length} done
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
                <span>Weekly Recurring</span>
                <Repeat className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-900 mt-1">{recurringTasks.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Repeats weekly on scheduled days</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
                <span>Bar & Cross-Duty Tasks</span>
                <Wine className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-700 mt-1">
                {tasks.filter((t) => t.targetRole === 'bar_staff').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Strictly Bar Staff certified</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
                <span>Pending Completion</span>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{completedCount} confirmed finished</div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Type:
                </span>
                <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-md transition-all text-xs cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-white text-indigo-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({tasks.length})
                  </button>
                  <button
                    onClick={() => setFilterType('one_off')}
                    className={`px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1 cursor-pointer ${
                      filterType === 'one_off'
                        ? 'bg-white text-indigo-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-amber-500" />
                    One-Off ({oneOffTasks.length})
                  </button>
                  <button
                    onClick={() => setFilterType('recurring_weekly')}
                    className={`px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1 cursor-pointer ${
                      filterType === 'recurring_weekly'
                        ? 'bg-white text-indigo-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Repeat className="w-3 h-3 text-indigo-500" />
                    Weekly ({recurringTasks.length})
                  </button>
                </div>

                {/* Role Filter */}
                <span className="font-bold text-slate-700 ml-2">Role Target:</span>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as any)}
                  className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="bar_staff">🍸 Bar Staff Only</option>
                  <option value="wait_staff">🍽️ Wait Staff / Floor</option>
                </select>

                {/* Assignee Filter */}
                <span className="font-bold text-slate-700 ml-2">Assignee:</span>
                <select
                  value={filterStaff}
                  onChange={(e) => setFilterStaff(e.target.value)}
                  className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="all">All Assignees</option>
                  <option value="unassigned">Unassigned (Open Team Tasks)</option>
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.position})
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <span className="font-bold text-slate-700 ml-2">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Task Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const isUnassigned = !task.assignedToStaffId || task.assignedToStaffId === 'unassigned';
                const isRecurring = task.taskType === 'recurring_weekly';

                return (
                  <div
                    key={task.id}
                    className={`p-5 rounded-2xl border transition-all bg-white flex flex-col justify-between ${
                      task.isCompleted
                        ? 'border-slate-200 opacity-90'
                        : 'border-slate-200 hover:border-indigo-300 shadow-xs'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges & Edit / Delete Actions */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Task Type Badge */}
                          {isRecurring ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <Repeat className="w-3 h-3 text-indigo-600" />
                              Weekly Recurring
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-700" />
                              One-Off Task
                            </span>
                          )}

                          {/* Target Role Badge */}
                          {task.targetRole === 'bar_staff' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                              <Wine className="w-3 h-3 text-amber-700" />
                              Bar Staff Only
                            </span>
                          )}
                          {task.targetRole === 'wait_staff' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 border border-sky-300">
                              <Utensils className="w-3 h-3 text-sky-700" />
                              Wait Staff / Cross-Duty
                            </span>
                          )}

                          {/* Priority Badge */}
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : task.priority === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {task.priority}
                          </span>

                          {/* Shift Badge */}
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {task.shift} shift
                          </span>
                        </div>

                        {/* Action buttons: EDIT, RESET, DELETE */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Task"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {task.isCompleted && (
                            <button
                              onClick={() => resetTask(task.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Re-open / Reset task"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setTaskToDelete(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title and Description */}
                      <div>
                        <h3 className={`font-bold text-sm ${task.isCompleted ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                          {task.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      </div>

                      {/* Assignee and Due Schedule */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 gap-1">
                        <div className="flex items-center gap-1.5">
                          {isUnassigned ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Users className="w-3 h-3 text-emerald-600" />
                              Unassigned (Open Team Task)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                              <User className="w-3 h-3 text-indigo-600" />
                              Assigned: <strong className="text-slate-900">{task.assignedStaffName}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 font-mono text-slate-600">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{task.dueDate}</span>
                        </div>
                      </div>

                      {/* Completion status confirmation */}
                      {task.isCompleted ? (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                          <div className="font-bold flex items-center justify-between text-emerald-900">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Completed by {task.completedByStaffName || task.assignedStaffName}</span>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-normal">{task.completedAt}</span>
                          </div>
                          {task.completionNote && (
                            <div className="text-[11px] text-emerald-800 italic pt-0.5">
                              Note: "{task.completionNote}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Pending floor execution</span>
                          </div>
                          <button
                            onClick={() => confirmTaskDone(task.id, 'Approved & marked done by manager Mark Zhang.')}
                            className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer"
                          >
                            Mark Done
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs space-y-2">
                <CheckSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">No tasks matching current filter</p>
                <p>Try clearing your filters or create a new task above.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Daily Checklist Management View for Manager */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedChecklistRoleSet('bar_staff')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedChecklistRoleSet === 'bar_staff'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Wine className="w-4 h-4" />
                <span>Bar Staff Checklist ({checklists.filter((c) => (c.roleSet || 'bar_staff') === 'bar_staff').length})</span>
              </button>

              <button
                onClick={() => setSelectedChecklistRoleSet('wait_staff')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedChecklistRoleSet === 'wait_staff'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>Wait Staff Checklist ({checklists.filter((c) => (c.roleSet || 'wait_staff') === 'wait_staff').length})</span>
              </button>
            </div>

            <button
              onClick={() => setShowCreateChecklistModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Item to {selectedChecklistRoleSet === 'bar_staff' ? 'Bar' : 'Wait'} Checklist
            </button>
          </div>

          <div className="space-y-3">
            {checklists
              .filter((item) => (item.roleSet || 'bar_staff') === selectedChecklistRoleSet)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-4"
                >
                    <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                      {item.requiresTemp && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                          Temp Log Required
                        </span>
                      )}
                      {item.requiresPhoto ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                          <Camera className="w-3 h-3 text-purple-600" />
                          Photo Mandatory (Limit: {item.maxPhotos || 1} {item.maxPhotos === 1 ? 'pic' : 'pics'})
                        </span>
                      ) : item.maxPhotos && item.maxPhotos > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <Camera className="w-3 h-3 text-indigo-500" />
                          Photo Allowed (Limit: {item.maxPhotos} {item.maxPhotos === 1 ? 'pic' : 'pics'})
                        </span>
                      ) : null}
                      {item.isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Completed: {item.completedBy} ({item.completedAt})
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                    {item.instructions && (
                      <p className="text-xs text-slate-500">{item.instructions}</p>
                    )}

                    {/* Photo evidence gallery if uploaded */}
                    {item.photos && item.photos.length > 0 && (
                      <div className="pt-2 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Uploaded Pictures ({item.photos.length} / {item.maxPhotos || item.photos.length} allowed):</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.photos.map((photoUrl, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => setPreviewingPhoto({
                                url: photoUrl,
                                title: item.title,
                                uploader: item.completedBy,
                                date: item.completedAt,
                              })}
                              className="relative group rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-500 transition-all shadow-2xs hover:shadow-xs cursor-pointer bg-slate-100"
                              title="Click to view full-size photo"
                            >
                              <img
                                src={photoUrl}
                                alt={`Photo ${pIdx + 1}`}
                                className="w-12 h-12 object-cover transition-transform group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Eye className="w-4 h-4" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditChecklistItemModal(item)}
                      className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit Checklist Item & Photo Limit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteChecklistItem(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Checklist Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingTask ? 'Edit Restaurant Task' : 'Create New Restaurant Task'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure assignment, role qualification rules, and recurrence
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTask(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-4 text-xs">
              {/* Task Type Toggle */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Task Type:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTaskType('one_off')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      taskType === 'one_off'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Clock className="w-4 h-4 text-amber-600" />
                      One-Off Task
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Single occurrence duty for a specific date and time.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskType('recurring_weekly')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      taskType === 'recurring_weekly'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Repeat className="w-4 h-4 text-indigo-600" />
                      Weekly Recurring Task
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Repeats automatically every week on designated days.
                    </p>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Task Title:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wipe down booth partitions and sanitize condiment trays"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description & Instructions:</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific requirements, chemicals/supplies needed, or station location..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Role Qualification Setting */}
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Station / Role Qualification Requirement:</label>
                  <span className="text-[10px] text-slate-500">Enforces staffing rules</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetRole('all')}
                    className={`p-2 rounded-lg text-center border font-bold text-[11px] cursor-pointer ${
                      targetRole === 'all'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Open to All Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetRole('wait_staff')}
                    className={`p-2 rounded-lg text-center border font-bold text-[11px] cursor-pointer ${
                      targetRole === 'wait_staff'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🍽️ Wait Staff / Floor
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetRole('bar_staff')}
                    className={`p-2 rounded-lg text-center border font-bold text-[11px] cursor-pointer ${
                      targetRole === 'bar_staff'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🍸 Bar Staff Only
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {targetRole === 'bar_staff'
                    ? '⚠️ Strictly Bar Staff certified. Wait staff cannot perform bar duties.'
                    : targetRole === 'wait_staff'
                    ? 'ℹ️ Both Wait Staff and Bar Staff (cross-duty) can execute this task.'
                    : 'Any team member can be assigned or claim this task.'}
                </p>
              </div>

              {/* Assignee Selection (Enforcing Bar/Wait qualifications) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Assign Staff Member:</label>
                  <span className="text-[10px] text-slate-500 font-medium">Or leave unassigned for team claim</span>
                </div>
                <select
                  value={assignedToStaffId}
                  onChange={(e) => setAssignedToStaffId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                >
                  <option value="unassigned">
                    👥 Unassigned (Open Team Task — Eligible staff can pick up)
                  </option>
                  <optgroup label="🍸 Bar Staff (Can do both Bar and Floor tasks)">
                    {barStaffList.map((u) => (
                      <option key={u.id} value={u.id}>
                        🍸 {u.firstName} {u.lastName} ({u.position}) — Fully Qualified
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🍽️ Wait Staff (Floor tasks only)">
                    {waitStaffList.map((u) => {
                      const disabled = targetRole === 'bar_staff';
                      return (
                        <option key={u.id} value={u.id} disabled={disabled}>
                          🍽️ {u.firstName} {u.lastName} ({u.position})
                          {disabled ? ' — [NOT QUALIFIED for Bar]' : ''}
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
              </div>

              {/* Scheduling Details */}
              {taskType === 'one_off' ? (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Due Date & Target Time:</label>
                  <input
                    type="text"
                    value={oneOffDueDate}
                    onChange={(e) => setOneOffDueDate(e.target.value)}
                    placeholder="2026-09-08 18:00"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Specify target completion date and time</span>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <label className="font-bold text-indigo-950 block">Recurring Days of the Week:</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {WEEK_DAYS.map((day) => {
                      const isSelected = recurringDays.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleDay(day.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <label className="font-bold text-indigo-950 block mb-1">Target Completion Time:</label>
                    <input
                      type="time"
                      value={recurringTime}
                      onChange={(e) => setRecurringTime(e.target.value)}
                      className="p-2 border border-slate-300 rounded-lg font-mono bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Shift and Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Shift:</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="lunch">Lunch Shift</option>
                    <option value="dinner">Dinner Shift</option>
                    <option value="all">Full Day / All Shifts</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Priority Level:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs shadow-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Checklist Item Modal */}
      {showCreateChecklistModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Add Daily Checklist Item</h3>
                <p className="text-xs text-slate-500">
                  Adding to <strong>{selectedChecklistRoleSet === 'bar_staff' ? 'Bar Staff' : 'Wait Staff'}</strong> set
                </p>
              </div>
              <button
                onClick={() => setShowCreateChecklistModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChecklistItem} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Checklist Item Title:</label>
                <input
                  type="text"
                  required
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="e.g. Inspect draft beer lines and sanitize drip tray"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category / Time Slot:</label>
                <select
                  value={newChecklistCategory}
                  onChange={(e) => setNewChecklistCategory(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Opening">Opening Checklist</option>
                  <option value="Mid-Shift Food Safety">Mid-Shift Food Safety</option>
                  <option value="Closing">Closing Checklist</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Instructions (Optional):</label>
                <textarea
                  rows={2}
                  value={newChecklistInstructions}
                  onChange={(e) => setNewChecklistInstructions(e.target.value)}
                  placeholder="Specific standards or chemicals to use..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="requiresTemp"
                  checked={newChecklistRequiresTemp}
                  onChange={(e) => setNewChecklistRequiresTemp(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="requiresTemp" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Requires temperature reading log (Food Safety requirement)
                </label>
              </div>

              {/* Photo Upload Configuration & Limit */}
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowPhoto"
                      checked={newChecklistAllowPhoto}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNewChecklistAllowPhoto(checked);
                        if (!checked) setNewChecklistRequiresPhoto(false);
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="allowPhoto" className="text-xs font-bold text-purple-900 cursor-pointer flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-purple-600" />
                      Allow Picture Uploads for this Question
                    </label>
                  </div>
                </div>

                {newChecklistAllowPhoto && (
                  <div className="space-y-2 pl-6 pt-1 border-t border-purple-100">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="font-bold text-slate-800 text-[11px] block">
                          Upload Limit (Max pictures allowed):
                        </label>
                        <p className="text-[10px] text-slate-500">
                          Staff cannot upload more than this number of pictures.
                        </p>
                      </div>
                      <select
                        value={newChecklistMaxPhotos}
                        onChange={(e) => setNewChecklistMaxPhotos(Number(e.target.value))}
                        className="p-1.5 px-3 border border-purple-300 rounded-lg bg-white font-bold text-purple-900 text-xs focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={1}>1 picture limit</option>
                        <option value={2}>2 pictures limit</option>
                        <option value={3}>3 pictures limit</option>
                        <option value={4}>4 pictures limit</option>
                        <option value={5}>5 pictures limit</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="requirePhoto"
                        checked={newChecklistRequiresPhoto}
                        onChange={(e) => setNewChecklistRequiresPhoto(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="requirePhoto" className="text-[11px] text-purple-950 font-medium cursor-pointer">
                        <strong>Mandatory:</strong> Staff must upload at least 1 photo to complete this item
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateChecklistModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs shadow-indigo-200 transition-colors cursor-pointer"
                >
                  Add Checklist Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Checklist Item Modal */}
      {editingChecklistItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Daily Checklist Item</h3>
                <p className="text-xs text-slate-500">
                  Configuring {editingChecklistItem.roleSet === 'bar_staff' ? 'Bar Staff' : 'Wait Staff'} question
                </p>
              </div>
              <button
                onClick={() => setEditingChecklistItem(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateChecklistItem} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Checklist Item Title:</label>
                <input
                  type="text"
                  required
                  value={editChecklistTitle}
                  onChange={(e) => setEditChecklistTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category / Time Slot:</label>
                <select
                  value={editChecklistCategory}
                  onChange={(e) => setEditChecklistCategory(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Opening">Opening Checklist</option>
                  <option value="Mid-Shift Food Safety">Mid-Shift Food Safety</option>
                  <option value="Closing">Closing Checklist</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Instructions (Optional):</label>
                <textarea
                  rows={2}
                  value={editChecklistInstructions}
                  onChange={(e) => setEditChecklistInstructions(e.target.value)}
                  placeholder="Specific standards or instructions..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="editRequiresTemp"
                  checked={editChecklistRequiresTemp}
                  onChange={(e) => setEditChecklistRequiresTemp(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="editRequiresTemp" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Requires temperature reading log (Food Safety requirement)
                </label>
              </div>

              {/* Photo Upload Configuration & Limit */}
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editAllowPhoto"
                      checked={editChecklistAllowPhoto}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditChecklistAllowPhoto(checked);
                        if (!checked) setEditChecklistRequiresPhoto(false);
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="editAllowPhoto" className="text-xs font-bold text-purple-900 cursor-pointer flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-purple-600" />
                      Allow Picture Uploads for this Question
                    </label>
                  </div>
                </div>

                {editChecklistAllowPhoto && (
                  <div className="space-y-2 pl-6 pt-1 border-t border-purple-100">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="font-bold text-slate-800 text-[11px] block">
                          Upload Limit (Max pictures allowed):
                        </label>
                        <p className="text-[10px] text-slate-500">
                          Limit how many pictures staff are allowed to attach.
                        </p>
                      </div>
                      <select
                        value={editChecklistMaxPhotos}
                        onChange={(e) => setEditChecklistMaxPhotos(Number(e.target.value))}
                        className="p-1.5 px-3 border border-purple-300 rounded-lg bg-white font-bold text-purple-900 text-xs focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={1}>1 picture limit</option>
                        <option value={2}>2 pictures limit</option>
                        <option value={3}>3 pictures limit</option>
                        <option value={4}>4 pictures limit</option>
                        <option value={5}>5 pictures limit</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="editRequirePhoto"
                        checked={editChecklistRequiresPhoto}
                        onChange={(e) => setEditChecklistRequiresPhoto(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="editRequirePhoto" className="text-[11px] text-purple-950 font-medium cursor-pointer">
                        <strong>Mandatory:</strong> Staff must upload at least 1 photo to complete this item
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingChecklistItem(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs shadow-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox / Preview Modal */}
      {previewingPhoto && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-700/30 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                  {previewingPhoto.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewingPhoto(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-center overflow-auto max-h-[60vh]">
              <img
                src={previewingPhoto.url}
                alt={previewingPhoto.title}
                className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                {previewingPhoto.uploader && (
                  <span className="font-semibold text-slate-900">
                    Uploaded by: {previewingPhoto.uploader}
                  </span>
                )}
                {previewingPhoto.date && (
                  <span className="ml-2 text-slate-500">at {previewingPhoto.date}</span>
                )}
              </div>
              <button
                onClick={() => setPreviewingPhoto(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Delete Restaurant Task?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete <strong>"{taskToDelete.title}"</strong>?
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs shadow-xs"
              >
                Yes, Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
