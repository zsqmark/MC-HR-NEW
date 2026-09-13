import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DayOfWeek, ShiftType, ShiftSlot } from '../../types';
import {
  Calendar as CalendarIcon,
  Plus,
  Sun,
  Moon,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  UserCheck,
  AlertCircle,
  FileSpreadsheet,
  Download,
  LayoutGrid,
  Sparkles,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  SHIFT_WINDOWS,
  validateShiftStartTime,
  formatTime12h,
} from '../../utils/shiftTimes';
import { WeeklyTimesheetExportModal } from '../../components/timesheet/WeeklyTimesheetExportModal';

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const ManagerSchedule: React.FC = () => {
  const {
    shifts,
    staffUsers,
    availabilities,
    assignStaffToShift,
    unassignStaffFromShift,
    createShift,
    updateShift,
    deleteShift,
  } = useApp();

  const [showWeeklyExportModal, setShowWeeklyExportModal] = useState(false);
  const [activeView, setActiveView] = useState<'csv_grid' | 'calendar_board'>('csv_grid');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MON');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShiftDay, setNewShiftDay] = useState<DayOfWeek>('MON');
  const [newShiftType, setNewShiftType] = useState<ShiftType>('lunch');
  const [newShiftStart, setNewShiftStart] = useState('11:15');
  const [newShiftStaffId, setNewShiftStaffId] = useState<string>('');

  // Editing existing shift start time
  const [editingShift, setEditingShift] = useState<ShiftSlot | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');

  // Validation
  const createTimeValidation = validateShiftStartTime(newShiftType, newShiftStart);
  const editTimeValidation = editingShift
    ? validateShiftStartTime(editingShift.shiftType, editStartTime)
    : null;

  // Quick helper to check if a staff is available on day & shift
  const checkStaffAvailable = (staffId: string, day: DayOfWeek, shiftType: ShiftType): boolean => {
    const record = availabilities[staffId];
    if (!record || !record.availabilities || !record.availabilities[day]) return false;
    return Boolean(record.availabilities[day][shiftType]);
  };

  // Handle assigning staff
  const handleAssignChange = (shiftId: string, staffId: string) => {
    if (!staffId) {
      unassignStaffFromShift(shiftId);
    } else {
      assignStaffToShift(shiftId, staffId);
    }
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTimeValidation.isValid) return;

    createShift({
      day: newShiftDay,
      dateStr: '2026-09-07',
      shiftType: newShiftType,
      startTime: createTimeValidation.formattedTime || newShiftStart,
      assignedStaffId: newShiftStaffId || undefined,
      roleRequired: 'Wait Staff',
      status: 'published',
    });
    setShowAddModal(false);
  };

  const openEditModal = (shift: ShiftSlot) => {
    setEditingShift(shift);
    setEditStartTime(shift.startTime);
  };

  const handleSaveShiftTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift || !editTimeValidation?.isValid) return;

    updateShift(editingShift.id, {
      startTime: editTimeValidation.formattedTime || editStartTime,
    });
    setEditingShift(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4" />
            Workforce Scheduling & Roster Planning
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Manager Weekly Schedule
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Modeled after 7shifts & Malaya Corner roster. Staff availabilities reflect shift start times; finish times are flexible suggestions based on trade & closing duties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveView('csv_grid')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeView === 'csv_grid'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              File 1 Grid View
            </button>
            <button
              onClick={() => setActiveView('calendar_board')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeView === 'calendar_board'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Weekly Day Columns
            </button>
          </div>

          <button
            onClick={() => setShowWeeklyExportModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Weekly Timesheet (Excel)
          </button>

          <button
            onClick={() => {
              setNewShiftType('lunch');
              setNewShiftStart('11:15');
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Shift Slot
          </button>
        </div>
      </div>

      {/* Shift Timing Window Constraints Banner */}
      <div className="bg-gradient-to-r from-amber-50/90 to-indigo-50/80 border border-amber-200/80 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>Shift Start Window Policy:</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                Enforced
              </span>
            </div>
            <div className="text-slate-600 font-medium mt-0.5">
              Lunch shifts can <strong>only start between 11:00am to 2:30pm</strong>. Dinner shifts can <strong>only start between 4:30pm to 10:00pm</strong>.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-amber-950 font-bold text-xs shadow-2xs">
            <Sun className="w-3.5 h-3.5 text-amber-600" />
            <span>Lunch: 11:00am – 2:30pm</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-indigo-950 font-bold text-xs shadow-2xs">
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dinner: 4:30pm – 10:00pm</span>
          </div>
        </div>
      </div>

      {/* Staff Availability Submissions Tracker Banner */}
      <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-indigo-950">
              Live Staff Availability Submissions Reflected:
            </div>
            <div className="text-indigo-900/80 font-medium">
              {Object.keys(availabilities).length} staff members have submitted weekly preferences. Staff showing with a green dot indicate they opted-in to work that shift.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {Object.keys(availabilities).map((staffId) => {
            const staff = staffUsers.find((s) => s.id === staffId);
            return (
              <span
                key={staffId}
                className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-indigo-950 font-semibold text-[11px] flex items-center gap-1.5 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {staff?.firstName || 'Staff'} (Submitted)
              </span>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: Full Employee Matrix matching File 1 attached CSV */}
      {activeView === 'csv_grid' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                Staff Weekly Roster & Availability Grid (File 1 Architecture)
              </span>
            </div>
            <span className="text-xs text-slate-500 hidden sm:block">
              Lunch shifts: 11:00am – 2:30pm • Dinner shifts: 4:30pm – 10:00pm. Click any time to adjust start time.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <th className="p-3 border-r border-slate-200 w-36 sticky left-0 bg-slate-100 z-10">
                    Employee
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      colSpan={2}
                      className="p-3 text-center border-r border-slate-200 min-w-[170px]"
                    >
                      <div className="text-sm font-black">{day}</div>
                      <div className="text-[10px] text-slate-500 font-normal uppercase flex justify-around mt-1">
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <Sun className="w-2.5 h-2.5 text-amber-600" /> Lunch (11:00-14:30)
                        </span>
                        <span className="text-indigo-800 font-semibold flex items-center gap-1">
                          <Moon className="w-2.5 h-2.5 text-indigo-600" /> Dinner (16:30-22:00)
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staffUsers.map((staff) => {
                  const staffShifts = shifts.filter((s) => s.assignedStaffId === staff.id);

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Employee name column */}
                      <td className="p-3 font-bold text-slate-900 border-r border-slate-200 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] uppercase">
                            {staff.firstName[0]}
                          </div>
                          <div>
                            <div>{staff.firstName}</div>
                            <div className="text-[10px] text-slate-400 font-normal truncate">
                              {staff.position}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 7 Days: Lunch & Dinner for this employee */}
                      {DAYS.map((day) => {
                        const lunchShift = staffShifts.find((s) => s.day === day && s.shiftType === 'lunch');
                        const dinnerShift = staffShifts.find((s) => s.day === day && s.shiftType === 'dinner');

                        const isLunchAvail = checkStaffAvailable(staff.id, day, 'lunch');
                        const isDinnerAvail = checkStaffAvailable(staff.id, day, 'dinner');

                        return (
                          <React.Fragment key={day}>
                            {/* Lunch cell */}
                            <td className="p-2 border-r border-slate-100 align-top">
                              {lunchShift ? (
                                <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-[11px] space-y-0.5 group">
                                  <div className="font-bold flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(lunchShift)}
                                      className="font-mono hover:text-amber-700 underline decoration-dotted flex items-center gap-1 cursor-pointer"
                                      title="Click to edit start time (allowed: 11:00am – 2:30pm)"
                                    >
                                      <span>{lunchShift.startTime}</span>
                                      <span className="font-sans font-normal text-[9px] text-amber-800">start</span>
                                      <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-amber-700" />
                                    </button>
                                    <button
                                      onClick={() => unassignStaffFromShift(lunchShift.id)}
                                      className="text-slate-400 hover:text-red-600 text-[10px] font-bold px-1"
                                      title="Unassign shift"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-1 text-center">
                                  {isLunchAvail ? (
                                    <span
                                      className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-emerald-100 text-emerald-800 font-semibold"
                                      title="Staff submitted availability for Lunch"
                                    >
                                      Avail
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-300">-</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Dinner cell */}
                            <td className="p-2 border-r border-slate-200 align-top bg-slate-50/30">
                              {dinnerShift ? (
                                <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 text-[11px] space-y-0.5 group">
                                  <div className="font-bold flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(dinnerShift)}
                                      className="font-mono hover:text-indigo-700 underline decoration-dotted flex items-center gap-1 cursor-pointer"
                                      title="Click to edit start time (allowed: 4:30pm – 10:00pm)"
                                    >
                                      <span>{dinnerShift.startTime}</span>
                                      <span className="font-sans font-normal text-[9px] text-indigo-800">start</span>
                                      <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-indigo-700" />
                                    </button>
                                    <button
                                      onClick={() => unassignStaffFromShift(dinnerShift.id)}
                                      className="text-slate-400 hover:text-red-600 text-[10px] font-bold px-1"
                                      title="Unassign shift"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-1 text-center">
                                  {isDinnerAvail ? (
                                    <span
                                      className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-emerald-100 text-emerald-800 font-semibold"
                                      title="Staff submitted availability for Dinner"
                                    >
                                      Avail
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-300">-</span>
                                  )}
                                </div>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Weekly Day Columns (Interactive Assignment Board) */}
      {activeView === 'calendar_board' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">
              Interactive Shift Assigner: Assign Staff Based on Availability
            </span>
            <span className="text-xs text-slate-500">
              Lunch window: 11:00am – 2:30pm • Dinner window: 4:30pm – 10:00pm
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {DAYS.map((day) => {
              const dayShifts = shifts.filter((s) => s.day === day);
              const lunchShifts = dayShifts.filter((s) => s.shiftType === 'lunch');
              const dinnerShifts = dayShifts.filter((s) => s.shiftType === 'dinner');

              return (
                <div key={day} className="flex flex-col bg-white min-h-[350px]">
                  {/* Day Header */}
                  <div className="p-3 bg-slate-100 border-b border-slate-200 text-center font-bold text-sm text-slate-800">
                    {day}
                  </div>

                  <div className="p-2.5 space-y-4 flex-1">
                    {/* Lunch shifts */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-600" /> Lunch
                        </span>
                        <span className="text-[10px] text-amber-700 font-mono">11:00–14:30</span>
                      </div>

                      {lunchShifts.map((shift) => (
                        <div key={shift.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 group">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 font-semibold">
                            <button
                              type="button"
                              onClick={() => openEditModal(shift)}
                              className="hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                              title="Edit start time"
                            >
                              <span>{shift.startTime} start</span>
                              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-slate-400" />
                            </button>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-sans">{shift.roleRequired}</span>
                              <button
                                type="button"
                                onClick={() => deleteShift(shift.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove shift slot"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Assign dropdown */}
                          <select
                            value={shift.assignedStaffId || ''}
                            onChange={(e) => handleAssignChange(shift.id, e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">-- Unassigned --</option>
                            {staffUsers.map((u) => {
                              const isAvail = checkStaffAvailable(u.id, day, 'lunch');
                              return (
                                <option key={u.id} value={u.id}>
                                  {isAvail ? '✓ ' : ''}{u.firstName} {u.lastName} {isAvail ? '(Available)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Dinner shifts */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Moon className="w-3 h-3 text-indigo-600" /> Dinner
                        </span>
                        <span className="text-[10px] text-indigo-700 font-mono">16:30–22:00</span>
                      </div>

                      {dinnerShifts.map((shift) => (
                        <div key={shift.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 group">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 font-semibold">
                            <button
                              type="button"
                              onClick={() => openEditModal(shift)}
                              className="hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                              title="Edit start time"
                            >
                              <span>{shift.startTime} start</span>
                              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-slate-400" />
                            </button>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-sans">{shift.roleRequired}</span>
                              <button
                                type="button"
                                onClick={() => deleteShift(shift.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove shift slot"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Assign dropdown */}
                          <select
                            value={shift.assignedStaffId || ''}
                            onChange={(e) => handleAssignChange(shift.id, e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">-- Unassigned --</option>
                            {staffUsers.map((u) => {
                              const isAvail = checkStaffAvailable(u.id, day, 'dinner');
                              return (
                                <option key={u.id} value={u.id}>
                                  {isAvail ? '✓ ' : ''}{u.firstName} {u.lastName} {isAvail ? '(Available)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Custom Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Shift Slot</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Day of Week:</label>
                <select
                  value={newShiftDay}
                  onChange={(e) => setNewShiftDay(e.target.value as DayOfWeek)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Shift Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewShiftType('lunch');
                      setNewShiftStart('11:15');
                    }}
                    className={`p-2 rounded-lg border text-center font-bold ${
                      newShiftType === 'lunch'
                        ? 'bg-amber-50 border-amber-500 text-amber-900'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    Lunch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewShiftType('dinner');
                      setNewShiftStart('16:45');
                    }}
                    className={`p-2 rounded-lg border text-center font-bold ${
                      newShiftType === 'dinner'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    Dinner
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Roster Start Time:</label>
                  <span className="text-[10px] text-slate-500">
                    Window: <strong className="text-slate-700">{SHIFT_WINDOWS[newShiftType].displayWindow}</strong>
                  </span>
                </div>
                <input
                  type="text"
                  value={newShiftStart}
                  onChange={(e) => setNewShiftStart(e.target.value)}
                  placeholder={SHIFT_WINDOWS[newShiftType].defaultStart}
                  className={`w-full p-2 border rounded-lg font-mono text-xs ${
                    createTimeValidation.isValid
                      ? 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      : 'border-red-400 bg-red-50/50 text-red-900 focus:border-red-500'
                  }`}
                />
                {!createTimeValidation.isValid && (
                  <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                    <span>⚠️</span> {createTimeValidation.errorMessage}
                  </p>
                )}
                {createTimeValidation.isValid && (
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span>✓</span> Validated start time: {formatTime12h(createTimeValidation.formattedTime || newShiftStart)}
                  </p>
                )}

                {/* Quick Presets */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1">
                    {SHIFT_WINDOWS[newShiftType].presets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewShiftStart(preset)}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                          newShiftStart === preset
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 pt-1">
                  Finish time is not fixed — shifts conclude based on customer rush & closing duties.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assign Staff:</label>
                <select
                  value={newShiftStaffId}
                  onChange={(e) => setNewShiftStaffId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="">-- Leave Open / Unassigned --</option>
                  {staffUsers.map((u) => {
                    const isAvail = checkStaffAvailable(u.id, newShiftDay, newShiftType);
                    return (
                      <option key={u.id} value={u.id}>
                        {isAvail ? '✓ ' : ''}{u.firstName} {u.lastName} {isAvail ? '(Available)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!createTimeValidation.isValid}
                  className={`px-5 py-2 font-bold rounded-xl shadow-xs transition-colors cursor-pointer ${
                    createTimeValidation.isValid
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Create Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shift Start Time Modal */}
      {editingShift && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Edit Shift Start Time
                </h3>
                <p className="text-xs text-slate-500">
                  {editingShift.day} • {editingShift.shiftType.toUpperCase()} shift • {editingShift.roleRequired}
                </p>
              </div>
              <button
                onClick={() => setEditingShift(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShiftTime} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[11px] font-bold text-slate-700">Enforced Shift Timing Policy:</div>
                <div className="text-[11px] text-slate-600">
                  {editingShift.shiftType === 'lunch' ? (
                    <span>
                      <Sun className="w-3.5 h-3.5 text-amber-600 inline mr-1" />
                      Lunch shifts can <strong>only start between 11:00am and 2:30pm</strong> (11:00 – 14:30).
                    </span>
                  ) : (
                    <span>
                      <Moon className="w-3.5 h-3.5 text-indigo-600 inline mr-1" />
                      Dinner shifts can <strong>only start between 4:30pm and 10:00pm</strong> (16:30 – 22:00).
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Roster Start Time (24h or 12h):</label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Window: {SHIFT_WINDOWS[editingShift.shiftType].displayWindow}
                  </span>
                </div>
                <input
                  type="text"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  placeholder={SHIFT_WINDOWS[editingShift.shiftType].defaultStart}
                  className={`w-full p-2 border rounded-lg font-mono text-xs ${
                    editTimeValidation?.isValid
                      ? 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      : 'border-red-400 bg-red-50/50 text-red-900 focus:border-red-500'
                  }`}
                />
                {!editTimeValidation?.isValid && (
                  <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                    <span>⚠️</span> {editTimeValidation?.errorMessage}
                  </p>
                )}
                {editTimeValidation?.isValid && (
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span>✓</span> Converted to: {formatTime12h(editTimeValidation.formattedTime || editStartTime)} ({editTimeValidation.formattedTime})
                  </p>
                )}

                {/* Quick Presets */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Select Preset:</span>
                  <div className="flex flex-wrap gap-1">
                    {SHIFT_WINDOWS[editingShift.shiftType].presets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditStartTime(preset)}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                          editStartTime === preset
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    deleteShift(editingShift.id);
                    setEditingShift(null);
                  }}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Shift Slot
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingShift(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editTimeValidation?.isValid}
                    className={`px-5 py-2 font-bold rounded-xl shadow-xs transition-colors cursor-pointer ${
                      editTimeValidation?.isValid
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weekly Timesheet Excel Export Modal */}
      <WeeklyTimesheetExportModal
        isOpen={showWeeklyExportModal}
        onClose={() => setShowWeeklyExportModal(false)}
      />
    </div>
  );
};
