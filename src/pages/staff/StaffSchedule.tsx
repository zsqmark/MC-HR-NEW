import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DayOfWeek } from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const StaffSchedule: React.FC = () => {
  const { shifts, activeStaff, setCurrentPage } = useApp();
  const [mobileDayFilter, setMobileDayFilter] = useState<DayOfWeek | 'ALL'>('ALL');

  // Strictly filter to the active staff member's own assigned shifts
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
            My Schedule • Malaya Corner
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Weekly Schedule
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Week of Monday 7 September – Sunday 13 September 2026 • Start times shown (finish times depend on trade & closing)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Privacy Notice Badge */}
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-900 shadow-2xs">
            <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>My Shifts ({myShifts.length} Scheduled)</span>
          </div>

          <button
            onClick={() => setCurrentPage('My Availability')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer"
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">My Shifts</div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{myShifts.length} Scheduled</div>
          <div className="text-[10px] text-slate-500 mt-0.5 hidden xs:block">Lunch & dinner this week</div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Estimated Hours</div>
          <div className="text-lg sm:text-xl font-bold text-indigo-600 mt-0.5">{totalHours.toFixed(1)} hrs</div>
          <div className="text-[10px] text-slate-500 mt-0.5 hidden xs:block">Based on shift roster</div>
        </div>
      </div>

      {/* Weekly Calendar View (Strictly Personal Shifts Only) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span className="font-bold text-xs sm:text-sm text-slate-800">
              Personal Schedule for {activeStaff.firstName} {activeStaff.lastName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Confidential • Restricted to your personal shifts</span>
          </div>
        </div>

        {/* Mobile Horizontal Day Quick Switcher (< md) */}
        <div className="md:hidden p-2.5 bg-slate-100/60 border-b border-slate-200 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setMobileDayFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              mobileDayFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            All Days ({myShifts.length})
          </button>
          {DAYS.map((d) => {
            const hasShift = shifts.some((s) => s.day === d && s.assignedStaffId === activeStaff.id);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setMobileDayFilter(d)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                  mobileDayFilter === d
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{d}</span>
                {hasShift && (
                  <span className={`w-1.5 h-1.5 rounded-full ${mobileDayFilter === d ? 'bg-amber-300' : 'bg-indigo-600'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {DAYS.filter((day) => mobileDayFilter === 'ALL' || mobileDayFilter === day).map((day) => {
            // Only get shifts belonging to this staff member
            const myDayShifts = shifts.filter(
              (s) => s.day === day && s.assignedStaffId === activeStaff.id
            );

            return (
              <div key={day} className="flex flex-col min-h-auto md:min-h-[300px] bg-white">
                {/* Day Header */}
                <div className="p-2.5 sm:p-3 bg-slate-100/70 border-b border-slate-200 flex md:flex-col items-center justify-between md:justify-center text-center">
                  <div className="font-extrabold text-sm text-slate-800 tracking-wide">{day}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    {day === 'SAT' || day === 'SUN' ? 'Weekend' : 'Weekday'}
                  </div>
                </div>

                {/* Day Content */}
                <div className="p-2 sm:p-2.5 flex-1 flex flex-col gap-2">
                  {myDayShifts.length > 0 ? (
                    myDayShifts
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((shift) => (
                        <div
                          key={shift.id}
                          className="p-3 rounded-xl text-xs transition-all border bg-indigo-50/90 border-indigo-200 ring-1 ring-indigo-400/30 text-indigo-950 font-medium shadow-2xs"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white flex items-center gap-1">
                              {shift.shiftType === 'lunch' ? (
                                <Sun className="w-2.5 h-2.5" />
                              ) : (
                                <Moon className="w-2.5 h-2.5" />
                              )}
                              {shift.shiftType}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-200">
                              Confirmed
                            </span>
                          </div>

                          <div className="font-bold text-slate-900 text-xs">
                            {shift.roleRequired || activeStaff.position}
                          </div>

                          <div className="font-mono text-[11px] text-indigo-900 font-semibold flex items-center gap-1.5 mt-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Start: {shift.startTime}</span>
                          </div>

                          <div className="text-[10px] text-slate-500 mt-1">
                            Service:{' '}
                            {shift.shiftType === 'lunch' ? '11:00am – 2:30pm' : '4:30pm – 10:00pm'}
                          </div>

                          {shift.notes && (
                            <div className="text-[10px] text-indigo-700/80 italic mt-1 bg-white/70 p-1 rounded border border-indigo-100">
                              Note: {shift.notes}
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-3 md:py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 md:border-0 md:bg-transparent">
                      <span className="text-xs font-semibold text-slate-400">Rostered Off</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">No shift scheduled</span>
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
