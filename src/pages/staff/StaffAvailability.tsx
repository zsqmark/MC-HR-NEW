import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DayOfWeek, DayAvailability } from '../../types';
import {
  Calendar as CalendarIcon,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  HelpCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const StaffAvailability: React.FC = () => {
  const { activeStaff, availabilities, submitAvailability, setCurrentPage } = useApp();

  // Get current saved availability for this staff
  const existingRecord = availabilities[activeStaff.id];

  const defaultState: Record<DayOfWeek, DayAvailability> = {
    MON: { lunch: false, dinner: false },
    TUE: { lunch: false, dinner: false },
    WED: { lunch: false, dinner: false },
    THU: { lunch: false, dinner: false },
    FRI: { lunch: false, dinner: false },
    SAT: { lunch: false, dinner: false },
    SUN: { lunch: false, dinner: false },
  };

  const [formAvail, setFormAvail] = useState<Record<DayOfWeek, DayAvailability>>(() => {
    return existingRecord?.availabilities || defaultState;
  });

  const [submittedAlert, setSubmittedAlert] = useState(false);

  useEffect(() => {
    if (existingRecord?.availabilities) {
      setFormAvail(existingRecord.availabilities);
    }
  }, [existingRecord, activeStaff.id]);

  const toggleShift = (day: DayOfWeek, shift: 'lunch' | 'dinner') => {
    setFormAvail((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [shift]: !prev[day][shift],
      },
    }));
    setSubmittedAlert(false);
  };

  const selectAll = (shiftType?: 'lunch' | 'dinner') => {
    setFormAvail((prev) => {
      const next = { ...prev };
      DAYS.forEach((d) => {
        next[d] = {
          lunch: shiftType ? (shiftType === 'lunch' ? true : prev[d].lunch) : true,
          dinner: shiftType ? (shiftType === 'dinner' ? true : prev[d].dinner) : true,
        };
      });
      return next;
    });
    setSubmittedAlert(false);
  };

  const clearAll = () => {
    setFormAvail(defaultState);
    setSubmittedAlert(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAvailability(activeStaff.id, '2026-09-07', formAvail);
    setSubmittedAlert(true);
    setTimeout(() => {
      setSubmittedAlert(false);
    }, 6000);
  };

  // Count total selected shifts
  const totalSelectedShifts = DAYS.reduce((acc, day) => {
    let count = 0;
    if (formAvail[day].lunch) count++;
    if (formAvail[day].dinner) count++;
    return acc + count;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4" />
            Weekly Shift Availability
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Availability Calendar
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Submit your available lunch and dinner shifts for the upcoming week. Shifts indicate start times; finish times are flexible suggestions based on trade volume and closing duties.
          </p>
        </div>

        {existingRecord && (
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <span className="font-semibold text-slate-900 block">Last Submitted:</span>
            <span>{existingRecord.submittedAt}</span>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {submittedAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-900 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Availability Submitted Successfully!</span> Your selected {totalSelectedShifts} shifts have been updated in the database and are now live on Manager Mark’s Weekly Schedule planner.
          </div>
        </div>
      )}

      {/* Quick Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Quick Select:</span>
          <button
            type="button"
            onClick={() => selectAll()}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            All Shifts (14)
          </button>
          <button
            type="button"
            onClick={() => selectAll('lunch')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium transition-colors border border-amber-200"
          >
            All Lunches (7)
          </button>
          <button
            type="button"
            onClick={() => selectAll('dinner')}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-medium transition-colors border border-indigo-200"
          >
            All Dinners (7)
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></span>
            <span>Unavailable</span>
          </div>
          <span className="font-bold text-slate-900 bg-indigo-50 px-2.5 py-1 rounded-lg text-indigo-800 border border-indigo-200">
            {totalSelectedShifts} Shifts Selected
          </span>
        </div>
      </div>

      {/* Weekly Calendar Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-800">
              Weekly Shift Selection: Everyday has 2 shifts (Lunch & Dinner)
            </span>
            <span className="text-xs text-slate-500 hidden sm:block">
              Click any shift slot to toggle your availability
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {DAYS.map((day) => {
              const dayData = formAvail[day];
              const isWeekend = day === 'SAT' || day === 'SUN';

              return (
                <div key={day} className="flex flex-col bg-white">
                  {/* Day Header */}
                  <div
                    className={`p-3 border-b border-slate-200 text-center ${
                      isWeekend ? 'bg-orange-50/60' : 'bg-slate-100/70'
                    }`}
                  >
                    <div className="font-extrabold text-sm text-slate-800">{day}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">
                      {isWeekend ? 'Peak Trading' : 'Standard'}
                    </div>
                  </div>

                  {/* Shifts Toggles */}
                  <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Shift 1: Lunch */}
                    <button
                      type="button"
                      onClick={() => toggleShift(day, 'lunch')}
                      className={`w-full p-3 rounded-xl border text-left transition-all relative ${
                        dayData.lunch
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs ring-2 ring-emerald-400/30'
                          : 'bg-slate-50/80 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Sun className={`w-3.5 h-3.5 ${dayData.lunch ? 'text-amber-600' : 'text-slate-400'}`} />
                          Lunch
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            dayData.lunch ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {dayData.lunch ? 'CAN WORK' : 'OFF'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 font-medium">
                        11:15 start
                      </div>
                    </button>

                    {/* Shift 2: Dinner */}
                    <button
                      type="button"
                      onClick={() => toggleShift(day, 'dinner')}
                      className={`w-full p-3 rounded-xl border text-left transition-all relative ${
                        dayData.dinner
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs ring-2 ring-emerald-400/30'
                          : 'bg-slate-50/80 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Moon className={`w-3.5 h-3.5 ${dayData.dinner ? 'text-indigo-600' : 'text-slate-400'}`} />
                          Dinner
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            dayData.dinner ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {dayData.dinner ? 'CAN WORK' : 'OFF'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 font-medium">
                        16:45 start
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900 block">How Roster Allocation Works</span>
              Submitting more available shifts gives manager flexibility to schedule optimal hours while respecting your availability. Submitting updates will automatically sync with Manager Mark Zhang’s Weekly Schedule dashboard.
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Send className="w-4 h-4" />
            Submit Weekly Availability
          </button>
        </div>
      </form>
    </div>
  );
};
