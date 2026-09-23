import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  MapPin,
  Calendar,
} from 'lucide-react';

export const StaffClock: React.FC = () => {
  const { activeStaff, clockRecords } = useApp();

  // My recent punch history
  const myPunches = clockRecords.filter((r) => r.staffId === activeStaff.id);

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
            Malaya Corner • Sunnybank Market Square Location Terminal
          </p>
        </div>

        {/* Location badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Geofence Verified (Sunnybank Market Square)</span>
        </div>
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
