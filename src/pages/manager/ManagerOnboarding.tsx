import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffUser, StaffType, OnboardingFormData } from '../../types';
import {
  FolderLock,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  FileText,
  Building,
  CreditCard,
  ShieldCheck,
  UserPlus,
  Send,
  Wine,
  Utensils,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Filter,
  Search,
  LogIn,
} from 'lucide-react';

export const ManagerOnboarding: React.FC = () => {
  const {
    staffUsers,
    onboardingRecords,
    approveOnboarding,
    updateOnboardingStatus,
    inviteStaffUser,
    deleteStaffUser,
    switchUser,
    switchRole,
    setCurrentPage,
  } = useApp();

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<{
    staff: StaffUser;
    inviteToken: string;
    inviteUrl: string;
  } | null>(null);

  // Filter and search
  const [filterType, setFilterType] = useState<'all' | 'bar_staff' | 'wait_staff'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'invite_sent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Invite Form State
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteStaffType, setInviteStaffType] = useState<StaffType>('wait_staff');
  const [invitePosition, setInvitePosition] = useState('Floor Waiter');
  const [inviteHourlyRate, setInviteHourlyRate] = useState('26.50');
  const [inviteWelcomeNote, setInviteWelcomeNote] = useState(
    'Welcome to the Malaya Corner team! Please fill out your digital onboarding form before your first shift.'
  );

  const selectedStaff = staffUsers.find((s) => s.id === selectedStaffId);
  const selectedDossier: OnboardingFormData | undefined = selectedStaffId
    ? onboardingRecords[selectedStaffId]
    : undefined;

  const handleApprove = (staffId: string) => {
    updateOnboardingStatus(staffId, 'approved');
  };

  const handleReject = (staffId: string) => {
    updateOnboardingStatus(staffId, 'rejected');
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()) {
      return;
    }

    const { staffId, inviteToken } = inviteStaffUser({
      firstName: inviteFirstName.trim(),
      lastName: inviteLastName.trim(),
      email: inviteEmail.trim(),
      phone: invitePhone.trim() || '0400 000 000',
      staffType: inviteStaffType,
      position: invitePosition.trim() || (inviteStaffType === 'bar_staff' ? 'Bar Staff' : 'Wait Staff'),
      hourlyRate: parseFloat(inviteHourlyRate) || 26.5,
      welcomeNote: inviteWelcomeNote.trim(),
    });

    const newStaff = staffUsers.find((s) => s.id === staffId) || {
      id: staffId,
      firstName: inviteFirstName.trim(),
      lastName: inviteLastName.trim(),
      email: inviteEmail.trim(),
      phone: invitePhone.trim() || '0400 000 000',
      role: 'staff',
      staffType: inviteStaffType,
      position: invitePosition.trim(),
      hourlyRate: parseFloat(inviteHourlyRate) || 26.5,
      onboardingCompleted: false,
      onboardingStatus: 'invite_sent',
    } as StaffUser;

    const dummyUrl = `${window.location.origin}?invite=${inviteToken}&staff=${staffId}`;

    setCreatedInvite({
      staff: newStaff,
      inviteToken,
      inviteUrl: dummyUrl,
    });

    // Clear form
    setInviteFirstName('');
    setInviteLastName('');
    setInviteEmail('');
    setInvitePhone('');
    setInviteStaffType('wait_staff');
    setInvitePosition('Floor Waiter');
    setInviteHourlyRate('26.50');
    setShowInviteModal(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const simulateStaffLogin = (staffId: string) => {
    switchUser(staffId);
    switchRole('staff');
    setCurrentPage('Onboarding');
  };

  // Filter staff users
  const filteredStaff = staffUsers.filter((staff) => {
    // Exclude manager from onboarding roster table
    if (staff.role === 'manager' && staff.id === 'mgr-mark') return false;

    const staffType = staff.staffType || (staff.position?.toLowerCase().includes('bar') ? 'bar_staff' : 'wait_staff');
    if (filterType !== 'all' && staffType !== filterType) return false;

    if (filterStatus !== 'all') {
      const status = staff.onboardingStatus || (staff.onboardingCompleted ? 'approved' : 'pending');
      if (status !== filterStatus) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(q);
      const matchEmail = (staff.email || '').toLowerCase().includes(q);
      const matchPos = (staff.position || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPos) return false;
    }

    return true;
  });

  const barStaffCount = staffUsers.filter((s) => s.role === 'staff' && (s.staffType === 'bar_staff' || s.position?.toLowerCase().includes('bar'))).length;
  const waitStaffCount = staffUsers.filter((s) => s.role === 'staff' && (s.staffType !== 'bar_staff' && !s.position?.toLowerCase().includes('bar'))).length;
  const completedCount = staffUsers.filter((s) => s.role === 'staff' && s.onboardingCompleted).length;
  const pendingCount = staffUsers.filter((s) => s.role === 'staff' && !s.onboardingCompleted).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            HR Onboarding & Team Induction
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Staff Onboarding & Recruitment
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Invite new Bar Staff or Wait Staff to join Malaya Corner. Track submission of the 15-question induction form, VEVO checks, TFN, and food hygiene certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-xs shadow-indigo-200 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Invite New Staff
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
            <span>🍸 Bar Staff</span>
            <Wine className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{barStaffCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Certified for Bar & Cross-Duty Floor
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
            <span>🍽️ Wait Staff</span>
            <Utensils className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{waitStaffCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Floor service & table operations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
            <span>Fully Approved</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{completedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cleared for shift scheduling</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
            <span>Pending Onboarding</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Form / VEVO verification pending</div>
        </div>
      </div>

      {/* Staff Invitation Created Success Banner */}
      {createdInvite && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Invitation Successfully Dispatched for {createdInvite.staff.firstName} {createdInvite.staff.lastName}!
            </div>
            <p className="text-xs text-emerald-800">
              Role: <strong className="uppercase">{createdInvite.staff.staffType === 'bar_staff' ? '🍸 Bar Staff' : '🍽️ Wait Staff'}</strong> • Position: {createdInvite.staff.position} • Invite Token: <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">{createdInvite.inviteToken}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(createdInvite.inviteUrl)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Link Copied!' : 'Copy Onboarding Link'}
            </button>
            <button
              onClick={() => simulateStaffLogin(createdInvite.staff.id)}
              className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-700" />
              Simulate Staff Sign-in
            </button>
            <button
              onClick={() => setCreatedInvite(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Employee Type:
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
                All Employees ({staffUsers.filter((s) => s.role === 'staff').length})
              </button>
              <button
                onClick={() => setFilterType('bar_staff')}
                className={`px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1 cursor-pointer ${
                  filterType === 'bar_staff'
                    ? 'bg-white text-amber-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wine className="w-3 h-3 text-amber-600" />
                Bar Staff ({barStaffCount})
              </button>
              <button
                onClick={() => setFilterType('wait_staff')}
                className={`px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1 cursor-pointer ${
                  filterType === 'wait_staff'
                    ? 'bg-white text-sky-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Utensils className="w-3 h-3 text-sky-600" />
                Wait Staff ({waitStaffCount})
              </button>
            </div>

            <span className="font-bold text-slate-700 ml-2">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved & Complete</option>
              <option value="pending">Pending Review</option>
              <option value="invite_sent">Invite Sent / Not Submitted</option>
            </select>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff name, email, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Staff Onboarding Status Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900">
            Restaurant Staff Roster & Induction Records
          </span>
          <span className="text-xs text-slate-500">
            Showing {filteredStaff.length} team members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Employee Type</th>
                <th className="p-3.5">Position & Rate</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Induction Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((staff) => {
                const staffType = staff.staffType || (staff.position?.toLowerCase().includes('bar') ? 'bar_staff' : 'wait_staff');
                const dossier = onboardingRecords[staff.id];
                const hasDossier = Boolean(dossier);

                return (
                  <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                          {staff.firstName[0]}
                        </div>
                        <div>
                          <div>{staff.firstName} {staff.lastName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{staff.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Employee Type Badge */}
                    <td className="p-3.5">
                      {staffType === 'bar_staff' ? (
                        <div className="inline-flex flex-col">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 w-fit">
                            <Wine className="w-3 h-3 text-amber-700" />
                            Bar Staff
                          </span>
                          <span className="text-[10px] text-amber-700/80 font-medium mt-0.5">
                            Cross-Duty Qualified
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 border border-sky-200 w-fit">
                            <Utensils className="w-3 h-3 text-sky-700" />
                            Wait Staff
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Floor Operations Only
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-700">
                      <div>{staff.position}</div>
                      <div className="text-[10px] text-slate-400 font-mono">${staff.hourlyRate?.toFixed(2) || '26.50'}/hr</div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-600">
                      {staff.phone}
                    </td>

                    <td className="p-3.5">
                      {staff.onboardingCompleted ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          15 of 15 Complete • Approved
                        </span>
                      ) : hasDossier ? (
                        <span className="text-blue-700 font-semibold flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          Submitted • Awaiting Review
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          Invite Sent • Not Submitted
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStaffId(staff.id)}
                          className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1 shadow-xs shadow-indigo-200 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Inspect
                        </button>
                        {!staff.onboardingCompleted && (
                          <button
                            onClick={() => simulateStaffLogin(staff.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Simulate this staff member filling out onboarding"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {staff.id.startsWith('staff-') && !hasDossier && (
                          <button
                            onClick={() => deleteStaffUser(staff.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Cancel / Delete Invitation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite New Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  Invite New Employee
                </h3>
                <p className="text-xs text-slate-500">
                  Select employee station and send digital onboarding invitation link
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
              {/* Employee Role / Type Selection (Crucial requirement!) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Employee Classification & Station:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setInviteStaffType('bar_staff');
                      setInvitePosition('Barista & Bartender');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      inviteStaffType === 'bar_staff'
                        ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Wine className="w-4 h-4 text-amber-600" />
                      🍸 Bar Staff
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Certified for bar equipment & cocktail station. Can also perform wait staff floor jobs (cross-duty).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInviteStaffType('wait_staff');
                      setInvitePosition('Floor Waiter');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      inviteStaffType === 'wait_staff'
                        ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Utensils className="w-4 h-4 text-sky-600" />
                      🍽️ Wait Staff
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Dining room service, customer greeting, food delivery. Cannot perform bar station operations.
                    </p>
                  </button>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">First Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wei"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Last Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chen"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address:</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. wei.chen@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mobile Number (Australia):</label>
                  <input
                    type="tel"
                    required
                    placeholder="0400 123 456"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Position Title & Hourly Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Position Title:</label>
                  <input
                    type="text"
                    required
                    value={invitePosition}
                    onChange={(e) => setInvitePosition(e.target.value)}
                    placeholder={inviteStaffType === 'bar_staff' ? 'Barista & Bartender' : 'Floor Waiter'}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Award Hourly Rate (AUD):</label>
                  <input
                    type="text"
                    required
                    value={inviteHourlyRate}
                    onChange={(e) => setInviteHourlyRate(e.target.value)}
                    placeholder="26.50"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono bg-white"
                  />
                </div>
              </div>

              {/* Welcome Message */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Welcome Note (Sent with invitation link):</label>
                <textarea
                  rows={2}
                  value={inviteWelcomeNote}
                  onChange={(e) => setInviteWelcomeNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs shadow-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Dispatch Onboarding Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Dossier Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Employee HR Dossier
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>{selectedStaff.firstName} {selectedStaff.lastName}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    (selectedStaff.staffType || 'wait_staff') === 'bar_staff'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-sky-100 text-sky-900 border border-sky-200'
                  }`}>
                    {(selectedStaff.staffType || 'wait_staff') === 'bar_staff' ? '🍸 Bar Staff' : '🍽️ Wait Staff'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedStaff.position} • {selectedStaff.email} • {selectedStaff.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedStaffId(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedDossier ? (
              <div className="space-y-6 text-xs">
                {/* Section 1 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Section 1: Personal Details & Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">1. Email:</span>
                      <span className="font-semibold">{selectedDossier.q1_email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">2. First & Middle Name:</span>
                      <span className="font-semibold">{selectedDossier.q2_firstNameMiddle}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">3. Last Name:</span>
                      <span className="font-semibold">{selectedDossier.q3_lastName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">4. Date of Birth:</span>
                      <span className="font-semibold">{selectedDossier.q4_dob}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">5. Mobile Number:</span>
                      <span className="font-semibold">{selectedDossier.q5_mobile}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Section 2: Superannuation & Bank Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">6. Payroll Email:</span>
                      <span className="font-semibold">{selectedDossier.q6_emailAddress}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">7. Super Provider:</span>
                      <span className="font-semibold">{selectedDossier.q7_superProvider}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">8. Super Member #:</span>
                      <span className="font-semibold">{selectedDossier.q8_superMemberNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">9. Bank Name:</span>
                      <span className="font-semibold">{selectedDossier.q9_bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">10. Bank BSB:</span>
                      <span className="font-mono font-bold">{selectedDossier.q10_bankBsb}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">11. Bank Account #:</span>
                      <span className="font-mono font-bold">{selectedDossier.q11_bankAccountNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Uploaded Documents */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FolderLock className="w-4 h-4 text-indigo-600" />
                    Section 3: Uploaded Employee Documents
                  </h3>

                  <div className="space-y-2">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">12. Proof of Identity / Work Clearance (VEVO)</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {selectedDossier.q12_vevoDoc?.fileName || 'Pending upload'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">13. Food Handler Checklist</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {selectedDossier.q13_foodHandlerDoc?.fileName || 'Pending upload'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">14. TFN Declaration Form</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {selectedDossier.q14_tfnDoc?.fileName || 'Pending upload'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">15. Food Hygiene Training Certificate</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {selectedDossier.q15_foodHygieneCert?.fileName || 'Pending upload'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manager Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      handleReject(selectedStaff.id);
                      setSelectedStaffId(null);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Request Corrections
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedStaff.id);
                      setSelectedStaffId(null);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Onboarding
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <Clock className="w-8 h-8 text-amber-500 mx-auto" />
                <div className="font-bold text-slate-800">Form Not Yet Submitted</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {selectedStaff.firstName} has not yet submitted their 15-question onboarding form. You can simulate signing in as them to complete the induction form.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedStaffId(null);
                      simulateStaffLogin(selectedStaff.id);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Open Form as {selectedStaff.firstName}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
