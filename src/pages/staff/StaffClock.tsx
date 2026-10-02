import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShiftType } from '../../types';
import {
  Clock,
  MapPin,
  Calendar,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  ShieldCheck,
} from 'lucide-react';

export const StaffClock: React.FC = () => {
  const { activeStaff, clockRecords, clockIn, clockOut, toggleBreak } = useApp();

  // Active clock record
  const activeRecord = clockRecords.find(
    (r) => r.staffId === activeStaff.id && (r.status === 'clocked_in' || r.status === 'on_break')
  );

  // My recent punch history
  const myPunches = clockRecords.filter((r) => r.staffId === activeStaff.id);

  // Live time ticker
  const [currentTime, setCurrentTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  // Current suggested shift
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType>(() => {
    const hour = new Date().getHours();
    return hour >= 15 ? 'dinner' : 'lunch';
  });

  const [punchFeedback, setPunchFeedback] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    clockIn(activeStaff.id, selectedShiftType);
    setPunchFeedback(`Successfully clocked in for ${selectedShiftType.toUpperCase()} shift!`);
    setTimeout(() => setPunchFeedback(''), 4000);
  };

  const handleClockOut = () => {
    clockOut(activeStaff.id);
    setPunchFeedback('Shift completed! Clock out recorded and sent to manager timesheet.');
    setTimeout(() => setPunchFeedback(''), 4000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Digital Time Clock</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Shift Punch Station
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Malaya Corner • Sunnybank Market Square Location Terminal
          </p>
        </div>

        {/* Location badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium self-start sm:self-center">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Geofence: Market Square Verified</span>
        </div>
      </div>

      {/* Interactive Mobile Punch Terminal Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-7 rounded-2xl shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              Restaurant Terminal Time
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5 text-white">
              {currentTime}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Automated 15-minute timesheet rounding (:00, :15, :30, :45)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-xs uppercase border border-white/10">
              {activeStaff.firstName[0]}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">{activeStaff.firstName} {activeStaff.lastName}</div>
              <div className="text-[10px] text-slate-300">{activeStaff.position}</div>
            </div>
          </div>
        </div>

        {punchFeedback && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{punchFeedback}</span>
          </div>
        )}

        {/* Punch Controls */}
        {activeRecord ? (
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-bold text-emerald-300 text-sm uppercase">
                    {activeRecord.status === 'on_break' ? 'Currently on Break' : 'Actively Clocked In'}
                  </span>
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded uppercase text-white">
                    {activeRecord.shiftType} Shift
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  Started at: <strong className="text-white">{activeRecord.clockInTime}</strong> • Date: {activeRecord.date}
                </div>
              </div>

              {activeRecord.status === 'on_break' && (
                <div className="text-xs text-amber-300 font-medium bg-amber-500/20 border border-amber-400/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-300" />
                  Meal break in progress
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => toggleBreak(activeStaff.id)}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  activeRecord.status === 'on_break'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>{activeRecord.status === 'on_break' ? 'End Meal Break' : 'Take 30m Meal Break'}</span>
              </button>

              <button
                type="button"
                onClick={handleClockOut}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-red-900/40"
              >
                <Square className="w-4 h-4" />
                <span>Clock Out from Shift</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Select Your Shift Session:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedShiftType('lunch')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedShiftType === 'lunch'
                      ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                    <Sun className="w-3.5 h-3.5" />
                    Lunch Service
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">11:00am – 2:30pm</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedShiftType('dinner')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedShiftType === 'dinner'
                      ? 'bg-indigo-500/30 border-indigo-400 text-white ring-2 ring-indigo-400/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-300">
                    <Moon className="w-3.5 h-3.5" />
                    Dinner Service
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">4:30pm – 10:00pm</div>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClockIn}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-900/50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Clock In for {selectedShiftType.toUpperCase()} Shift</span>
            </button>
          </div>
        )}
      </div>

      {/* My Timesheet History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            My Recent Clock Punches & Hours
          </h2>
          <span className="text-[11px] text-slate-500">
            {myPunches.length} records
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {myPunches.length > 0 ? (
            myPunches.map((rec) => (
              <div key={rec.id} className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    <span>{rec.date}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {rec.shiftType}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        rec.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'clocked_in'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rec.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    In: {rec.clockInTime} {rec.clockOutTime ? `• Out: ${rec.clockOutTime}` : '• In Progress'}
                  </div>
                  {rec.notes && <div className="text-[11px] text-slate-400 italic">Note: {rec.notes}</div>}
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900 text-sm">
                    {rec.totalHours ? `${rec.totalHours} hrs` : 'Active'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No clock punches recorded yet for this profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
