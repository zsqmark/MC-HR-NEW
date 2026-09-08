import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DayOfWeek, ShiftType } from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const StaffSchedule: React.FC = () => {
  const { shifts, activeStaff, staffUsers, setCurrentPage } = useApp();
  const [viewMode, setViewMode] = useState<'my_shifts' | 'full_roster'>('my_shifts');

  // Calculate my assigned shifts
  const myShifts = shifts.filter((s) => s.assignedStaffId === activeStaff.id);

  // Approximate total hours (~4h per service shift as finish time depends on trade)
  const totalHours = myShifts.reduce((acc, shift) => {
    if (shift.endTime) {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const hours = endH + endM / 60 - (startH + startM / 60);
      return acc + (hours > 0 ? hours : 4);
    }
    return acc + 4;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4" />
            Weekly Roster • Malaya Corner
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Weekly Schedule
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Week of Monday 7 September – Sunday 13 September 2026 • Published by Manager Mark Zhang • Start times shown (finish times depend on trade & closing)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('my_shifts')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'my_shifts'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Shifts ({myShifts.length})
            </button>
            <button
              onClick={() => setViewMode('full_roster')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'full_roster'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Restaurant Roster
            </button>
          </div>

          <button
            onClick={() => setCurrentPage('My Availability')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-200"
          >
            Update My Availability
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Shift Timing Information */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-700">Roster Service Windows:</span>
          <span className="text-slate-500">Scheduled start times adhere to restaurant service windows:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-medium text-[11px] flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-600" /> Lunch: 11:00am – 2:30pm
          </span>
          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-medium text-[11px] flex items-center gap-1">
            <Moon className="w-3 h-3 text-indigo-600" /> Dinner: 4:30pm – 10:00pm
          </span>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">My Scheduled Shifts</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{myShifts.length} Shifts</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across lunch & dinner</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Total Estimated Hours</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{totalHours.toFixed(1)} hrs</div>
          <div className="text-[11px] text-slate-500 mt-0.5">For this roster week</div>
        </div>
      </div>

      {/* Weekly Calendar View (Structured like File 1) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span className="font-bold text-sm text-slate-800">
              {viewMode === 'my_shifts'
                ? `Personal Roster for ${activeStaff.firstName} ${activeStaff.lastName}`
                : 'Team Shift Calendar (Lunch & Dinner)'}
            </span>
          </div>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {DAYS.map((day) => {
            // Shifts on this day
            const dayShifts = shifts.filter((s) => s.day === day);
            const myDayShifts = dayShifts.filter((s) => s.assignedStaffId === activeStaff.id);
            const displayedShifts = viewMode === 'my_shifts' ? myDayShifts : dayShifts;

            const lunchShifts = displayedShifts.filter((s) => s.shiftType === 'lunch');
            const dinnerShifts = displayedShifts.filter((s) => s.shiftType === 'dinner');

            return (
              <div key={day} className="flex flex-col min-h-[300px] bg-white">
                {/* Day Header */}
                <div className="p-3 bg-slate-100/70 border-b border-slate-200 text-center">
                  <div className="font-extrabold text-sm text-slate-800 tracking-wide">{day}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    {day === 'SAT' || day === 'SUN' ? 'Weekend' : 'Weekday'}
                  </div>
                </div>

                {/* Day Content */}
                <div className="p-2.5 flex-1 flex flex-col gap-2">
                  {displayedShifts.length > 0 ? (
                    displayedShifts
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((shift) => {
                        const assignedStaff = staffUsers.find((u) => u.id === shift.assignedStaffId);
                        const isMe = shift.assignedStaffId === activeStaff.id;

                        return (
                          <div
                            key={shift.id}
                            className={`p-2.5 rounded-xl text-xs transition-all border ${
                              isMe
                                ? 'bg-indigo-50/90 border-indigo-200 ring-1 ring-indigo-400/30 text-indigo-950 font-medium'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold flex items-center gap-1">
                                {isMe && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                                {assignedStaff?.firstName || 'Unassigned'}
                              </span>
                              {isMe && (
                                <span className="text-[9px] bg-indigo-600 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-slate-700 font-semibold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {shift.startTime} start
                              </span>
                              <span className="text-[10px] font-sans font-normal text-slate-500 capitalize flex items-center gap-1">
                                {shift.shiftType === 'lunch' ? (
                                  <Sun className="w-3 h-3 text-amber-500" />
                                ) : (
                                  <Moon className="w-3 h-3 text-indigo-500" />
                                )}
                                {shift.shiftType}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {shift.roleRequired}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-[11px] text-slate-300 italic text-center py-6">
                      {viewMode === 'my_shifts' ? 'No shift' : 'No shifts scheduled'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
