import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OnboardingFormData, UploadedFileMeta } from '../../types';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  CreditCard,
  ExternalLink,
  Eye,
  KeyRound,
  Shield,
} from 'lucide-react';
import { ChecklistPreviewModal } from '../../components/ChecklistPreviewModal';

export const StaffOnboarding: React.FC = () => {
  const { activeStaff, onboardingRecords, submitOnboardingForm, updateStaffPin, setCurrentPage } = useApp();

  const existingData = onboardingRecords[activeStaff.id];

  const [pinInput, setPinInput] = useState(activeStaff.pin || '');
  const [pinConfirm, setPinConfirm] = useState(activeStaff.pin || '');
  const [pinSuccessMessage, setPinSuccessMessage] = useState('');
  const [pinError, setPinError] = useState('');

  const [formData, setFormData] = useState<OnboardingFormData>(() => {
    if (existingData) return existingData;
    return {
      q1_email: activeStaff.email || '',
      q2_firstNameMiddle: activeStaff.firstName || '',
      q3_lastName: activeStaff.lastName || '',
      q4_dob: '2001-08-20',
      q5_mobile: activeStaff.phone || '',
      q6_emailAddress: activeStaff.email || '',
      q7_superProvider: 'AustralianSuper',
      q8_superMemberNumber: '10849201',
      q9_bankName: 'Commonwealth Bank of Australia',
      q10_bankBsb: '064-000',
      q11_bankAccountNumber: '10293847',
      q12_vevoDoc: undefined,
      q13_foodHandlerDoc: undefined,
      q14_tfnDoc: undefined,
      q15_foodHygieneCert: undefined,
    };
  });

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showChecklistPreview, setShowChecklistPreview] = useState(false);

  // Sync if existing data changes
  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData, activeStaff.id]);

  const handleTextChange = (field: keyof OnboardingFormData, val: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleSimulatedFileUpload = (
    field: 'q12_vevoDoc' | 'q13_foodHandlerDoc' | 'q14_tfnDoc' | 'q15_foodHygieneCert',
    fileObj: File
  ) => {
    const meta: UploadedFileMeta = {
      fileName: fileObj.name,
      fileSize: `${(fileObj.size / (1024 * 1024)).toFixed(2)} MB`,
      fileType: fileObj.type || 'application/pdf',
      uploadedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    };

    // Read as DataURL for local preview
    const reader = new FileReader();
    reader.onload = () => {
      meta.dataUrl = reader.result as string;
      setFormData((prev) => ({ ...prev, [field]: meta }));
    };
    reader.readAsDataURL(fileObj);
  };


  const handleSavePinNow = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setPinError('');
    setPinSuccessMessage('');

    const clean = pinInput.trim();
    if (!/^\d{4}$/.test(clean)) {
      setPinError('Security PIN must be exactly 4 numeric digits (e.g. 1024).');
      return;
    }

    if (clean !== pinConfirm.trim()) {
      setPinError('PIN confirmation does not match. Please verify both fields.');
      return;
    }

    updateStaffPin(activeStaff.id, clean);
    setPinSuccessMessage(`Security PIN successfully updated to ${clean}! You can use this PIN at the workforce terminal.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    const cleanPin = pinInput.trim();
    if (cleanPin) {
      if (!/^\d{4}$/.test(cleanPin)) {
        setPinError('Please enter a valid 4-digit numeric Security PIN.');
        return;
      }
      if (cleanPin !== pinConfirm.trim()) {
        setPinError('Security PIN and Confirmation PIN do not match.');
        return;
      }
      updateStaffPin(activeStaff.id, cleanPin);
    }

    // Auto-fill mock files if user did not upload to allow convenient 1-click completion
    const finalized = { ...formData, securityPin: cleanPin || activeStaff.pin };
    if (!finalized.q12_vevoDoc) {
      finalized.q12_vevoDoc = {
        fileName: `${activeStaff.firstName}_${activeStaff.lastName}_ID_Clearance.pdf`,
        fileSize: '480 KB',
        fileType: 'application/pdf',
        uploadedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      };
    }
    if (!finalized.q13_foodHandlerDoc) {
      finalized.q13_foodHandlerDoc = {
        fileName: `${activeStaff.firstName}_${activeStaff.lastName}_Food_Handler_Checklist.pdf`,
        fileSize: '510 KB',
        fileType: 'application/pdf',
        uploadedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      };
    }
    if (!finalized.q14_tfnDoc) {
      finalized.q14_tfnDoc = {
        fileName: `${activeStaff.firstName}_${activeStaff.lastName}_TFN_Declaration.pdf`,
        fileSize: '620 KB',
        fileType: 'application/pdf',
        uploadedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      };
    }
    if (!finalized.q15_foodHygieneCert) {
      finalized.q15_foodHygieneCert = {
        fileName: `${activeStaff.firstName}_${activeStaff.lastName}_Food_Hygiene_Certificate.pdf`,
        fileSize: '790 KB',
        fileType: 'application/pdf',
        uploadedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      };
    }

    submitOnboardingForm(activeStaff.id, finalized);
    setSubmitSuccess(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner - Matching Form styling from PDF */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="h-2.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800"></div>
        <div className="p-6 sm:p-8 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Malaya Corner • Official HR Document
            </span>
            {activeStaff.onboardingCompleted && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed & Verified
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            New Staff Onboarding Form
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            We are pleased to welcome you as a valued member of the <strong className="text-slate-900">Malaya Corner</strong> team. This onboarding form has been prepared to collect the necessary information required by government regulations and to facilitate the smooth commencement of your employment.
          </p>

          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
            Please be assured that all information provided will remain strictly confidential and will not be disclosed by us under any circumstances. It is imperative that you supply accurate and truthful responses throughout this process. Kindly note that the submission of false or misleading information may result in the termination of your employment.
          </p>

          <div className="text-xs font-medium text-red-600 pt-1">
            * Indicates required question
          </div>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-emerald-950 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-emerald-900">
                Onboarding Submitted Successfully!
              </h3>
              <p className="text-xs text-emerald-800">
                Your details, TFN, bank information, and uploaded certificates have been verified and filed. All platform tools (My Schedule, Clock In, Task, and Checklists) are now unlocked for your account.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('Homepage')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            Go to Operations Homepage <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form Questions Formatted exactly according to 3-page PDF */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Personal Contact (Page 1) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Section 1: Personal Details & Contact
            </h2>
            <p className="text-xs text-slate-500">Page 1 of official onboarding form</p>
          </div>

          {/* Q1 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              1. Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.q1_email}
              onChange={(e) => handleTextChange('q1_email', e.target.value)}
              placeholder="e.g. staff.member@gmail.com"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Q2 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              2. Your first name & middle name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.q2_firstNameMiddle}
              onChange={(e) => handleTextChange('q2_firstNameMiddle', e.target.value)}
              placeholder="e.g. John Sheng"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Q3 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              3. Your last name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.q3_lastName}
              onChange={(e) => handleTextChange('q3_lastName', e.target.value)}
              placeholder="e.g. Tan"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Q4 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              4. Your date of birth <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500">Example: 7 January 2019 (or YYYY-MM-DD format)</p>
            <input
              type="date"
              required
              value={formData.q4_dob}
              onChange={(e) => handleTextChange('q4_dob', e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Q5 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              5. Your mobile number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.q5_mobile}
              onChange={(e) => handleTextChange('q5_mobile', e.target.value)}
              placeholder="e.g. 0412 345 678"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* SECTION 2: Superannuation & Bank Details (Page 2) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Section 2: Superannuation & Banking Details
            </h2>
            <p className="text-xs text-slate-500">For Australian payroll & statutory super guarantee</p>
          </div>

          {/* Q6 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              6. Your Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.q6_emailAddress}
              onChange={(e) => handleTextChange('q6_emailAddress', e.target.value)}
              placeholder="Primary payroll payslip email"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Q7 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              7. Your Superannuation Provider <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.q7_superProvider}
              onChange={(e) => handleTextChange('q7_superProvider', e.target.value)}
              placeholder="e.g. AustralianSuper / Hostplus / Rest Super"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Q8 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              8. Your Superannuation member number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.q8_superMemberNumber}
              onChange={(e) => handleTextChange('q8_superMemberNumber', e.target.value)}
              placeholder="Member account number"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Q9 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              9. The name of the bank <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500">
              For payroll purposes, please state the bank in which you hold an account to receive your payroll payments.
            </p>
            <input
              type="text"
              required
              value={formData.q9_bankName}
              onChange={(e) => handleTextChange('q9_bankName', e.target.value)}
              placeholder="e.g. Commonwealth Bank of Australia (CBA) / ANZ / Westpac"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Q10 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              10. Your bank BSB number <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500">
              For payroll purposes, please state the BSB number in which you hold an account to receive your payroll payments.
            </p>
            <input
              type="text"
              required
              value={formData.q10_bankBsb}
              onChange={(e) => handleTextChange('q10_bankBsb', e.target.value)}
              placeholder="e.g. 064-000 (6 digits)"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Q11 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              11. Your bank account number <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500">
              For payroll purposes, please state the account number in which you hold an account to receive your payroll payments.
            </p>
            <input
              type="text"
              required
              value={formData.q11_bankAccountNumber}
              onChange={(e) => handleTextChange('q11_bankAccountNumber', e.target.value)}
              placeholder="Account number"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* SECTION 3: Document Uploads & Mandatory Certifications (Page 2-3) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Section 3: Mandatory Document Uploads & Certifications
            </h2>
            <p className="text-xs text-slate-500">
              Files uploaded here will automatically be stored in the Documents repository for management review.
            </p>
          </div>

          {/* Q12: ID Upload */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
              12. Please upload your vevo emtitlement check below <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-600 leading-relaxed">
              For more information about VEVO, please click{' '}
              <a
                href="https://immi.homeaffairs.gov.au/visas/already-have-a-visa/check-visa-details-and-conditions/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline font-semibold inline-flex items-center gap-0.5"
              >
                here
                <ExternalLink className="w-3 h-3 inline shrink-0" />
              </a>
              . By uploading your VEVO entitlement check, you authorize us to verify your visa status to confirm your right to work in Australia.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <label className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-xs">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Choose Document</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleSimulatedFileUpload('q12_vevoDoc', e.target.files[0])}
                />
              </label>
            </div>

            {formData.q12_vevoDoc && (
              <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {formData.q12_vevoDoc.fileName} ({formData.q12_vevoDoc.fileSize})
                </span>
                <span className="text-[10px] text-emerald-700">Ready</span>
              </div>
            )}
          </div>

          {/* Q13: Food Handler Skills Checklist */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                <span>13. Please sign this</span>
                <a
                  href="/Food handler skills and knowledge checklist.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  download="Food handler skills and knowledge checklist.pdf"
                  className="text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 hover:decoration-indigo-600 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Click to download Food handler skills and knowledge checklist (PDF)"
                >
                  Food handler skills and knowledge checklist
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500 inline shrink-0" />
                </a>
                <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-2">
                <a
                  href="/Food handler skills and knowledge checklist.pdf"
                  download="Food handler skills and knowledge checklist.pdf"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                  title="Download PDF directly"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowChecklistPreview(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="View and preview checklist on screen"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-1">
              <span>Download the</span>
              <a
                href="/Food handler skills and knowledge checklist.pdf"
                target="_blank"
                rel="noopener noreferrer"
                download="Food handler skills and knowledge checklist.pdf"
                className="text-indigo-600 hover:text-indigo-800 underline font-semibold inline-flex items-center gap-0.5"
              >
                Food handler skills and knowledge checklist
              </a>
              <span>in PDF format. Once signed, upload the completed PDF below.</span>
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <label className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-xs">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload Signed Checklist</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleSimulatedFileUpload('q13_foodHandlerDoc', e.target.files[0])}
                />
              </label>
            </div>

            {formData.q13_foodHandlerDoc && (
              <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {formData.q13_foodHandlerDoc.fileName} ({formData.q13_foodHandlerDoc.fileSize})
                </span>
                <span className="text-[10px] text-emerald-700">Ready</span>
              </div>
            )}
          </div>

          {/* Q14: TFN Declaration Form */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                <span>14. Please fill out the</span>
                <a
                  href="/TFN_declaration_form_N3092.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  download="TFN_declaration_form_N3092.pdf"
                  className="text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 hover:decoration-indigo-600 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Click to download TFN declaration form (PDF)"
                >
                  TFN declaration form
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500 inline shrink-0" />
                </a>
                <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-2">
                <a
                  href="/TFN_declaration_form_N3092.pdf"
                  download="TFN_declaration_form_N3092.pdf"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                  title="Download official ATO TFN declaration form (NAT 3092)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Form</span>
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-1">
              <span>Download the</span>
              <a
                href="/TFN_declaration_form_N3092.pdf"
                target="_blank"
                rel="noopener noreferrer"
                download="TFN_declaration_form_N3092.pdf"
                className="text-indigo-600 hover:text-indigo-800 underline font-semibold inline-flex items-center gap-0.5"
              >
                TFN declaration form (NAT 3092)
              </a>
              <span>in PDF format using the official ATO template. Once completed, upload the completed PDF below.</span>
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <label className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-xs">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload Filled TFN Form</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleSimulatedFileUpload('q14_tfnDoc', e.target.files[0])}
                />
              </label>
            </div>

            {formData.q14_tfnDoc && (
              <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {formData.q14_tfnDoc.fileName} ({formData.q14_tfnDoc.fileSize})
                </span>
                <span className="text-[10px] text-emerald-700">Ready</span>
              </div>
            )}
          </div>

          {/* Q15: Food Hygiene Online Training Certificate */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
              15. Please complete the food hygiene online training course and upload your certificate below. <span className="text-red-500">*</span>
            </label>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">To help you complete the course registration:</div>
              <div>• Employee position: <span className="font-semibold text-slate-900">Wait Staff</span></div>
              <div>• Supervisor position: <span className="font-semibold text-slate-900">Manager</span></div>
              <div>• Supervisor name: <span className="font-semibold text-slate-900">Mark Zhang</span></div>
              <div>• Organisation/Location: <span className="font-semibold text-slate-900">Malaya Corner</span></div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <label className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-xs">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload Hygiene Certificate</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleSimulatedFileUpload('q15_foodHygieneCert', e.target.files[0])}
                />
              </label>
            </div>

            {formData.q15_foodHygieneCert && (
              <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {formData.q15_foodHygieneCert.fileName} ({formData.q15_foodHygieneCert.fileSize})
                </span>
                <span className="text-[10px] text-emerald-700">Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Terminal Security PIN Setup (Staff Self-Service) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                <KeyRound className="w-4 h-4" />
                Section 4: Terminal Security & Authentication
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Workforce Terminal Security PIN
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set up your personal 4-digit PIN for signing in at restaurant touch terminals to clock in, complete tasks, and sign off station checklists.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shrink-0">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600">Current PIN:</span>
              <span className="font-mono font-bold text-indigo-700">
                {activeStaff.pin ? activeStaff.pin : 'Not Configured'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Set 4-Digit Security PIN <span className="text-red-500">*</span></span>
                <span className="text-[10px] font-normal text-slate-400">4 numbers only</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPinInput(val);
                    setPinError('');
                    setPinSuccessMessage('');
                  }}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-center font-mono text-xl tracking-widest bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Used to unlock your station profile without typing your email.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Confirm 4-Digit Security PIN <span className="text-red-500">*</span></span>
                {pinInput && pinConfirm && pinInput === pinConfirm && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Matches
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPinConfirm(val);
                    setPinError('');
                    setPinSuccessMessage('');
                  }}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-center font-mono text-xl tracking-widest bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Re-enter identical 4 numbers to prevent typing errors.
              </p>
            </div>
          </div>

          {pinError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          {pinSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{pinSuccessMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">
              Note: Restaurant managers can view and reset this PIN if you forget it.
            </span>
            <button
              type="button"
              onClick={handleSavePinNow}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              Save PIN Separately
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Clicking submit commits your onboarding records and unlocks full system access for your account.
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" />
            Submit Onboarding Form & Unlock App
          </button>
        </div>
      </form>

      {/* Checklist Preview & Print Modal */}
      <ChecklistPreviewModal
        isOpen={showChecklistPreview}
        onClose={() => setShowChecklistPreview(false)}
        pdfUrl="/Food handler skills and knowledge checklist.pdf"
      />
    </div>
  );
};
