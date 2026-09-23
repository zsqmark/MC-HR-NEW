import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, FileText, ArrowRight, UserCheck, AlertCircle, ExternalLink } from 'lucide-react';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const { currentRole, activeStaff, currentPage, setCurrentPage, switchUser } = useApp();

  // Guard only applies to staff role and non-onboarding pages
  if (currentRole === 'staff' && !activeStaff.onboardingCompleted && currentPage !== 'Onboarding') {
    return (
      <div className="max-w-4xl mx-auto my-8 p-6 sm:p-8 bg-white rounded-2xl border border-amber-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
              <AlertCircle className="w-3.5 h-3.5" />
              Mandatory Onboarding Requirement
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Onboarding Form Required Before App Access
            </h2>
            <p className="text-slate-600 leading-relaxed text-base">
              Welcome to the <strong className="font-semibold text-slate-900">Malaya Corner</strong> team,{' '}
              <span className="font-medium text-slate-800">{activeStaff.firstName}</span>! To get your employee profile and payroll set up, all new team members must complete
              the confidential <strong className="font-semibold text-slate-900">New Staff Onboarding Form</strong>, provide bank & TFN details, and upload certifications before accessing schedules, shift clocking, and daily checklists.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 space-y-2">
              <p className="font-medium text-slate-900">Items required in the form:</p>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Personal & Emergency Contact Details
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Superannuation & Bank Account (BSB/Acct)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Employee Profile Verification
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <a
                    href="/Food handler skills and knowledge checklist.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    download="Food handler skills and knowledge checklist.pdf"
                    className="hover:text-indigo-600 underline decoration-slate-300 hover:decoration-indigo-600 inline-flex items-center gap-1 text-slate-700 transition-colors"
                  >
                    Food handler skills and knowledge checklist
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  ATO Tax File Number (TFN) Declaration
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Food Hygiene Online Training Certificate
                </li>
              </ul>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCurrentPage('Onboarding')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                Fill Out New Staff Onboarding Form
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => switchUser('staff-john')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-xs"
                title="Switch to an already onboarded staff member for demo"
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Preview as Onboarded Staff (John Tan)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
