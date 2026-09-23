import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FolderLock,
  FileText,
  Download,
  Eye,
  ShieldCheck,
  Building,
  User,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { ChecklistPreviewModal } from '../../components/ChecklistPreviewModal';

export const StaffDocuments: React.FC = () => {
  const { documents, activeStaff } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [showChecklistPreview, setShowChecklistPreview] = useState(false);

  // Security Rule for staff:
  // "However, the staff can only see their own submission and the file manager uploaded."
  const visibleDocs = documents.filter((doc) => {
    // 1. Files manager uploaded for all staff
    const isCompanyFile = doc.uploadedFor === 'all';
    // 2. Staff's own submissions
    const isMySubmission = doc.uploadedFor === activeStaff.id;

    if (!isCompanyFile && !isMySubmission) return false;

    // Search query filter
    if (
      searchQuery &&
      !doc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'my_submissions') {
        return isMySubmission;
      }
      if (selectedCategory === 'company_wide') {
        return isCompanyFile;
      }
    }

    return true;
  });

  const myCount = documents.filter((d) => d.uploadedFor === activeStaff.id).length;
  const companyCount = documents.filter((d) => d.uploadedFor === 'all').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <FolderLock className="w-4 h-4" />
            Confidential Document Portal
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Documents & Policies
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Malaya Corner company policies and your personal onboarding submissions.
          </p>
        </div>

        {/* Privacy badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Restricted Access (Personal & Company Files Only)</span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents or policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Accessible ({visibleDocs.length})
          </button>
          <button
            onClick={() => setSelectedCategory('company_wide')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'company_wide'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Company Policies ({companyCount})
          </button>
          <button
            onClick={() => setSelectedCategory('my_submissions')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'my_submissions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Onboarding Submissions ({myCount})
          </button>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleDocs.length > 0 ? (
          visibleDocs.map((doc) => {
            const isMine = doc.uploadedFor === activeStaff.id;

            return (
              <div
                key={doc.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        isMine
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                      }`}
                    >
                      {isMine ? 'My Personal Submission' : 'Company Policy'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{doc.fileSize}</span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {doc.title}
                  </h3>

                  {doc.description && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {doc.description}
                    </p>
                  )}

                  <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-100">
                    <span>Uploaded by: <strong className="text-slate-600 font-medium">{doc.uploadedBy}</strong></span>
                    <span>{doc.uploadedAt}</span>
                  </div>
                </div>

                <div className="pt-4 mt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (doc.fileName.toLowerCase().includes('food_handler') || doc.title.toLowerCase().includes('food handler')) {
                        setShowChecklistPreview(true);
                      } else {
                        setPreviewDoc(doc.title);
                      }
                    }}
                    className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>

                  <a
                    href={doc.fileUrl || '/Food handler skills and knowledge checklist.pdf'}
                    download={doc.fileName}
                    className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    title={`Download ${doc.fileName}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No documents found</p>
            <p>No documents match the current search or category filter.</p>
          </div>
        )}
      </div>

      {/* Preview Modal Simulation */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 truncate">{previewDoc}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
              <FileText className="w-12 h-12 text-indigo-600 mx-auto" />
              <div className="text-xs text-slate-600">
                Encrypted PDF Document Viewer
              </div>
              <div className="text-xs text-slate-500 font-mono bg-white p-3 rounded-lg border border-slate-200">
                Verified Document Hash: SHA-256 (Malaya Corner HR System)
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Checklist Preview & Download Modal */}
      <ChecklistPreviewModal
        isOpen={showChecklistPreview}
        onClose={() => setShowChecklistPreview(false)}
        pdfUrl="/Food handler skills and knowledge checklist.pdf"
      />
    </div>
  );
};
