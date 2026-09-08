import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShiftType } from '../../types';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Sparkles,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';

export const StaffClock: React.FC = () => {
  const { activeStaff, clockRecords, clockIn, clockOut } = useApp();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType>('lunch');
  const [clockNote, setClockNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Find active clock record for this staff
  const activeRecord = clockRecords.find(
    (r) => r.staffId === activeStaff.id && r.status === 'clocked_in'
  );

  // My recent punch history
  const myPunches = clockRecords.filter((r) => r.staffId === activeStaff.id);

  const handleClockIn = () => {
    clockIn(activeStaff.id, selectedShiftType, clockNote || undefined);
    setClockNote('');
    setActionSuccess(
      `Successfully clocked in for ${selectedShiftType.toUpperCase()} shift at ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
    );
    setTimeout(() => setActionSuccess(null), 5000);
  };

  const handleClockOut = () => {
    clockOut(activeStaff.id, clockNote || undefined);
    setClockNote('');
    setActionSuccess(
      `Successfully clocked out at ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Timesheet updated.`
    );
    setTimeout(() => setActionSuccess(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            7shifts Digital Time Clock
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Clock In & Out Terminal
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Malaya Corner • Sunnybank Plaza Location Terminal
          </p>
        </div>

        {/* Location badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Geofence Verified (Sunnybank Plaza)</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-medium">{actionSuccess}</div>
        </div>
      )}

      {/* Digital Terminal Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-6">
        {/* Real-time Clock */}
        <div className="space-y-1">
          <div className="text-4xl sm:text-6xl font-extrabold font-mono text-slate-900 tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-sm font-medium text-slate-500">
            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Status Display */}
        <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Employee Status
          </div>
          <div className="text-lg font-bold text-slate-900">
            {activeStaff.firstName} {activeStaff.lastName} ({activeStaff.position})
          </div>

          {activeRecord ? (
            <div className="mt-3 p-3 rounded-xl bg-emerald-100/70 border border-emerald-200 text-emerald-900 space-y-1">
              <div className="flex items-center justify-center gap-2 font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Active on {activeRecord.shiftType.toUpperCase()} Shift
              </div>
              <div className="text-xs text-emerald-800">
                Punched in at <span className="font-mono font-bold">{activeRecord.clockInTime}</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-xs text-slate-500">
              Not currently clocked in for duty.
            </div>
          )}
        </div>

        {/* Punch Controls */}
        <div className="max-w-md mx-auto space-y-4">
          {!activeRecord ? (
            <div className="space-y-4">
              {/* Shift Selector */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-700">Select Shift to Clock In:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedShiftType('lunch')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedShiftType === 'lunch'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs uppercase">Lunch Shift</div>
                    <div className="text-[11px] text-amber-800 font-mono font-medium">Starts 11:00am – 2:30pm</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedShiftType('dinner')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedShiftType === 'dinner'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs uppercase">Dinner Shift</div>
                    <div className="text-[11px] text-indigo-800 font-mono font-medium">Starts 4:30pm – 10:00pm</div>
                  </button>
                </div>
              </div>

              {/* Shift Note */}
              <input
                type="text"
                value={clockNote}
                onChange={(e) => setClockNote(e.target.value)}
                placeholder="Optional punch note (e.g. station assignment, coverage)..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />

              {/* Punch In Button */}
              <button
                type="button"
                onClick={handleClockIn}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                Clock In to {selectedShiftType.toUpperCase()} Shift
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleClockOut}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                Clock Out of {activeRecord.shiftType.toUpperCase()} Shift
              </button>

              <input
                type="text"
                value={clockNote}
                onChange={(e) => setClockNote(e.target.value)}
                placeholder="Optional clock out handoff note..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          All clock events are securely timestamped and synchronized with Manager Mark’s Timesheet.
        </p>
      </div>

      {/* My Timesheet History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            My Recent Clock Punches & Hours
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {myPunches.length > 0 ? (
            myPunches.map((rec) => (
              <div key={rec.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{rec.date}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {rec.shiftType}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                  <div className="text-slate-500 font-mono">
                    In: {rec.clockInTime} {rec.clockOutTime ? `• Out: ${rec.clockOutTime}` : '• In Progress'}
                  </div>
                  {rec.notes && <div className="text-[11px] text-slate-400 italic">Note: {rec.notes}</div>}
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900">
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
