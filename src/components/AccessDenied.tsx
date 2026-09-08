import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Lock, ArrowLeft, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AccessDeniedProps {
  attemptedPage: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ attemptedPage }) => {
  const { activeStaff, setCurrentPage, authenticateManager } = useApp();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const ok = authenticateManager(pinInput);
    if (ok) {
      setShowPinDialog(false);
      setPinInput('');
      setCurrentPage(attemptedPage);
    } else {
      setPinError('Invalid Manager PIN. Operational access remains restricted.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            Role-Based Access Control (RBAC)
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manager Access Required
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            The <strong className="text-slate-900">{attemptedPage}</strong> module contains confidential venue management, administrative scheduling, and payroll controls restricted to restaurant managers.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Current Session Identity:</div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                {activeStaff.firstName.charAt(0)}
              </span>
              <div>
                <span className="font-bold text-slate-900">{activeStaff.firstName} {activeStaff.lastName}</span>
                <span className="text-slate-500"> • {activeStaff.position}</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold uppercase text-[10px]">
              Employee Role
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
            Employees have access to their personal schedules, availability, time clock, assigned tasks, and onboarding dossier.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setCurrentPage('My Schedule')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to My Personal Schedule
          </button>

          <button
            onClick={() => {
              setShowPinDialog(true);
              setPinInput('');
              setPinError('');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-indigo-600" />
            Unlock with Manager PIN
          </button>
        </div>
      </div>

      {/* PIN Dialog Modal */}
      {showPinDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Lock className="w-4 h-4 text-indigo-600" />
                Manager PIN Verification
              </div>
              <button
                onClick={() => setShowPinDialog(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Manager PIN (Demo: 1234)
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  maxLength={6}
                  placeholder="••••"
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs shadow-indigo-200 cursor-pointer"
                >
                  Verify & Proceed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
