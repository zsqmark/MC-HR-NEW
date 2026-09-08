import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  CheckCircle2,
  Circle,
  Thermometer,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Lock,
  Wine,
  Utensils,
  AlertCircle,
  Check,
  Info,
  Camera,
  Image as ImageIcon,
  Eye,
  Trash2,
  ZoomIn,
  Upload,
} from 'lucide-react';
import { StaffType, ChecklistItem } from '../../types';

export const StaffChecklist: React.FC = () => {
  const {
    checklists,
    toggleChecklistItem,
    updateChecklistItemPhotos,
    resetChecklist,
    activeStaff,
    currentRole,
  } = useApp();

  // Determine active staff type (defaulting to wait_staff if not specified)
  const isManager = currentRole === 'manager' || activeStaff.role === 'manager';
  const staffType: StaffType = activeStaff.staffType || (activeStaff.position?.toLowerCase().includes('bar') ? 'bar_staff' : 'wait_staff');

  // Active role set tab: Bar staff defaults to bar_staff; Wait staff defaults to wait_staff
  const [selectedRoleSet, setSelectedRoleSet] = useState<'bar_staff' | 'wait_staff'>(() => {
    return staffType === 'bar_staff' ? 'bar_staff' : 'wait_staff';
  });

  const [activeCategory, setActiveCategory] = useState<'all' | 'Opening' | 'Mid-Shift Food Safety' | 'Closing'>('all');
  const [tempInputs, setTempInputs] = useState<Record<string, string>>({});
  const [attemptedBarAccess, setAttemptedBarAccess] = useState(false);

  // Photo state
  const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({});
  const [previewingPhoto, setPreviewingPhoto] = useState<{
    url: string;
    title: string;
    uploader?: string;
    date?: string;
  } | null>(null);

  const categories = ['Opening', 'Mid-Shift Food Safety', 'Closing'] as const;

  // Filter checklists by the currently active role set (bar_staff vs wait_staff)
  const roleSetChecklists = checklists.filter((item) => {
    // If an item doesn't have roleSet (legacy), assign based on category or id
    const itemRoleSet = item.roleSet || (item.id.includes('bar') ? 'bar_staff' : 'wait_staff');
    return itemRoleSet === selectedRoleSet;
  });

  const filteredItems = roleSetChecklists.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const totalCompleted = roleSetChecklists.filter((c) => c.isCompleted).length;
  const percent = Math.round((totalCompleted / (roleSetChecklists.length || 1)) * 100) || 0;

  // Wait staff cannot access bar staff checklist
  const isWaitStaffLockedOut = staffType === 'wait_staff' && selectedRoleSet === 'bar_staff' && !isManager;

  const handleTabClick = (targetSet: 'bar_staff' | 'wait_staff') => {
    if (staffType === 'wait_staff' && targetSet === 'bar_staff' && !isManager) {
      setAttemptedBarAccess(true);
      return;
    }
    setAttemptedBarAccess(false);
    setSelectedRoleSet(targetSet);
    setActiveCategory('all');
  };

  const handlePhotoUpload = (item: ChecklistItem, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const maxAllowed = item.maxPhotos || (item.requiresPhoto ? 1 : 2);
    const currentCount = (item.photos || []).length;
    const availableSlots = maxAllowed - currentCount;

    if (availableSlots <= 0) {
      setPhotoErrors((prev) => ({
        ...prev,
        [item.id]: `Upload limit reached: You can only upload up to ${maxAllowed} picture${maxAllowed > 1 ? 's' : ''} for this question.`,
      }));
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      setPhotoErrors((prev) => ({
        ...prev,
        [item.id]: `Limit notice: Maximum ${maxAllowed} pictures allowed by manager. Added ${filesToProcess.length} picture${filesToProcess.length > 1 ? 's' : ''}.`,
      }));
    } else {
      setPhotoErrors((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }

    const newPhotos: string[] = [];
    let processedCount = 0;

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newPhotos.push(event.target.result as string);
        }
        processedCount++;
        if (processedCount === filesToProcess.length) {
          const updated = [...(item.photos || []), ...newPhotos];
          updateChecklistItemPhotos(item.id, updated);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (itemId: string, photoIndex: number) => {
    const item = checklists.find((c) => c.id === itemId);
    if (!item || !item.photos) return;
    const updated = item.photos.filter((_, idx) => idx !== photoIndex);
    updateChecklistItemPhotos(itemId, updated);
  };

  const handleCheck = (item: ChecklistItem, requiresTemp?: boolean) => {
    if (isWaitStaffLockedOut) return;

    // Check mandatory photo requirement
    if (!item.isCompleted && item.requiresPhoto) {
      const currentPhotosCount = (item.photos || []).length;
      if (currentPhotosCount === 0) {
        setPhotoErrors((prev) => ({
          ...prev,
          [item.id]: `Photo Required: Manager requires photo evidence for this question (Limit: up to ${item.maxPhotos || 1} picture${(item.maxPhotos || 1) > 1 ? 's' : ''}). Please upload at least 1 photo before signing off.`,
        }));
        return;
      }
    }

    // Clear photo error for this item
    setPhotoErrors((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    const tempVal = requiresTemp ? tempInputs[item.id] : undefined;
    toggleChecklistItem(item.id, tempVal, item.photos);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4" />
            Digital Shift Operations • Daily Checklist
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Role-Based Daily Checklists
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Distinct checklist sets for <strong className="text-slate-700">Bar Staff</strong> and <strong className="text-slate-700">Wait Staff</strong>. Bar staff are certified to complete both stations.
          </p>
        </div>

        {/* Progress pill for active set */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 shrink-0">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900">
              {totalCompleted} of {roleSetChecklists.length} Done
            </div>
            <div className="text-[10px] text-slate-500">
              {selectedRoleSet === 'bar_staff' ? 'Bar Station' : 'Wait Staff Floor'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 flex items-center justify-center font-bold text-xs text-indigo-700">
            {percent}%
          </div>
        </div>
      </div>

      {/* Role Set Selector Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Bar Staff Tab */}
            <button
              onClick={() => handleTabClick('bar_staff')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRoleSet === 'bar_staff'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Wine className="w-4 h-4" />
              <span>Bar Staff Checklist</span>
              {staffType === 'wait_staff' && !isManager && (
                <Lock className="w-3 h-3 text-slate-400" />
              )}
              {selectedRoleSet === 'bar_staff' && (
                <span className="bg-amber-700/80 text-amber-100 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {checklists.filter((c) => (c.roleSet || 'bar_staff') === 'bar_staff' && c.isCompleted).length}/
                  {checklists.filter((c) => (c.roleSet || 'bar_staff') === 'bar_staff').length}
                </span>
              )}
            </button>

            {/* Wait Staff Tab */}
            <button
              onClick={() => handleTabClick('wait_staff')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRoleSet === 'wait_staff'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Wait Staff Checklist</span>
              {staffType === 'bar_staff' && (
                <span className="text-[10px] font-normal px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                  Cross-Duty Eligible
                </span>
              )}
              {selectedRoleSet === 'wait_staff' && (
                <span className="bg-indigo-700/80 text-indigo-100 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {checklists.filter((c) => (c.roleSet || 'wait_staff') === 'wait_staff' && c.isCompleted).length}/
                  {checklists.filter((c) => (c.roleSet || 'wait_staff') === 'wait_staff').length}
                </span>
              )}
            </button>
          </div>

          {/* User Role Indicator Badge */}
          <div className="text-right px-3 py-1">
            <span className="text-[11px] text-slate-500 font-medium">Logged in as: </span>
            <span className="text-xs font-bold text-slate-900">
              {activeStaff.firstName} ({activeStaff.position})
            </span>
            <span
              className={`ml-2 inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                staffType === 'bar_staff'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
            >
              {staffType === 'bar_staff' ? '🍸 Bar Staff' : '🍽️ Wait Staff'}
            </span>
          </div>
        </div>

        {/* Operational Context Banners */}
        {staffType === 'bar_staff' && selectedRoleSet === 'wait_staff' && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Cross-Duty Active:</strong> As Bar Staff, you are fully qualified to perform wait staff jobs and assist the floor team by ticking off dining room checklist items.
            </span>
          </div>
        )}

        {staffType === 'wait_staff' && attemptedBarAccess && (
          <div className="mt-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Access Restricted: Bar Staff Checklist
              </div>
              <p className="text-amber-800">
                You are currently signed in as <strong>Wait Staff</strong>. Restaurant policy strictly states:
                <em> "Bar staff can do wait staff job, but not other way around."</em>
              </p>
              <p className="text-[11px] text-amber-700">
                Wait staff are not certified for commercial espresso machine calibration, draught glycol chillers, or underbench bar refrigeration. Please complete your assigned <strong>Wait Staff Checklist</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAttemptedBarAccess(false);
                  setSelectedRoleSet('wait_staff');
                }}
                className="mt-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Return to Wait Staff Checklist
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs & Reset Action */}
      {!isWaitStaffLockedOut && (
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? selectedRoleSet === 'bar_staff'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Items ({roleSetChecklists.length})
            </button>
            {categories.map((cat) => {
              const count = roleSetChecklists.filter((c) => c.category === cat).length;
              const completedCount = roleSetChecklists.filter((c) => c.category === cat && c.isCompleted).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeCategory === cat
                      ? selectedRoleSet === 'bar_staff'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold">
                    {completedCount}/{count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => resetChecklist(activeCategory === 'all' ? undefined : activeCategory, selectedRoleSet)}
            className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset {selectedRoleSet === 'bar_staff' ? 'Bar' : 'Wait'} Checklist</span>
          </button>
        </div>
      )}

      {/* Checklist items */}
      {!isWaitStaffLockedOut ? (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all bg-white ${
                  item.isCompleted
                    ? 'border-slate-200 bg-slate-50/60'
                    : 'border-slate-200 hover:border-indigo-300 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleCheck(item, item.requiresTemp)}
                    className={`mt-0.5 rounded-lg transition-colors p-0.5 cursor-pointer ${
                      item.isCompleted
                        ? 'text-emerald-600 hover:text-emerald-700'
                        : 'text-slate-300 hover:text-indigo-600'
                    }`}
                  >
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 fill-emerald-100" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Station Badge */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          item.roleSet === 'bar_staff'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                        }`}
                      >
                        {item.roleSet === 'bar_staff' ? <Wine className="w-3 h-3" /> : <Utensils className="w-3 h-3" />}
                        {item.roleSet === 'bar_staff' ? 'Bar Station' : 'Wait Staff / Floor'}
                      </span>

                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {item.category}
                      </span>

                      {item.requiresTemp && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                          <Thermometer className="w-3 h-3 text-blue-600" />
                          Temperature Log Required
                        </span>
                      )}

                      {item.requiresPhoto && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200">
                          <Camera className="w-3 h-3 text-purple-600" />
                          Photo Required (Limit: {item.maxPhotos || 1} {item.maxPhotos === 1 ? 'picture' : 'pictures'})
                        </span>
                      )}

                      {!item.requiresPhoto && item.maxPhotos && item.maxPhotos > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                          <Camera className="w-3 h-3 text-indigo-600" />
                          Photo Allowed (Limit: {item.maxPhotos} {item.maxPhotos === 1 ? 'picture' : 'pictures'})
                        </span>
                      )}

                      {item.isCompleted && (
                        <span className="text-[11px] text-emerald-800 font-medium">
                          Completed by <strong className="font-semibold">{item.completedBy}</strong> at {item.completedAt}
                        </span>
                      )}
                    </div>

                    <div
                      className={`text-sm font-semibold ${
                        item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </div>

                    {item.instructions && (
                      <div className="text-xs text-slate-500 font-normal leading-relaxed">
                        {item.instructions}
                      </div>
                    )}

                    {/* Photo validation error alert */}
                    {photoErrors[item.id] && (
                      <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                        <div className="flex-1 font-medium">{photoErrors[item.id]}</div>
                        <button
                          type="button"
                          onClick={() => setPhotoErrors(prev => { const n = {...prev}; delete n[item.id]; return n; })}
                          className="text-red-400 hover:text-red-700 font-bold p-0.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Photo Upload Section for staff */}
                    {(item.requiresPhoto || (item.maxPhotos && item.maxPhotos > 0)) && !item.isCompleted && (
                      <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200/80 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-bold text-slate-900">
                              Photo Evidence
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              (Attached: <strong>{(item.photos || []).length}</strong> / <strong>{item.maxPhotos || 1}</strong> allowed)
                            </span>
                          </div>

                          {item.requiresPhoto && (!item.photos || item.photos.length === 0) && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-md">
                              Mandatory before sign-off
                            </span>
                          )}
                        </div>

                        {/* Thumbnails of attached photos */}
                        {(item.photos || []).length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {item.photos!.map((photoUrl, pIdx) => (
                              <div
                                key={pIdx}
                                className="relative group w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-200 bg-white shadow-2xs"
                              >
                                <img
                                  src={photoUrl}
                                  alt={`Upload ${pIdx + 1}`}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreviewingPhoto({
                                    url: photoUrl,
                                    title: item.title,
                                  })}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                                  title="View photo"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(item.id, pIdx)}
                                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm cursor-pointer z-10"
                                  title="Remove photo"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Upload Trigger button (respects limit) */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {(item.photos || []).length < (item.maxPhotos || 1) ? (
                            <div>
                              <input
                                type="file"
                                id={`file-input-${item.id}`}
                                accept="image/*"
                                multiple
                                onChange={(e) => handlePhotoUpload(item, e.target.files)}
                                className="hidden"
                              />
                              <label
                                htmlFor={`file-input-${item.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Upload / Capture Picture</span>
                              </label>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Maximum photo limit reached ({item.maxPhotos}/{item.maxPhotos})</span>
                            </div>
                          )}

                          <span className="text-[11px] text-slate-500">
                            Limit: {item.maxPhotos || 1} {item.maxPhotos === 1 ? 'picture' : 'pictures'} allowed by manager
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Completed item verified photo gallery */}
                    {item.isCompleted && item.photos && item.photos.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                            Verified Photo Evidence ({item.photos.length} / {item.maxPhotos || item.photos.length} pictures):
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Verified on Shift
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {item.photos.map((photoUrl, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => setPreviewingPhoto({
                                url: photoUrl,
                                title: item.title,
                                uploader: item.completedBy,
                                date: item.completedAt,
                              })}
                              className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-500 shadow-2xs hover:shadow-xs transition-all cursor-pointer bg-white"
                              title="Click to zoom picture"
                            >
                              <img
                                src={photoUrl}
                                alt={`Proof ${pIdx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Eye className="w-4 h-4" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Temperature input for Food Safety items */}
                    {item.requiresTemp && !item.isCompleted && (
                      <div className="pt-2 flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Log reading, e.g. 3.4°C"
                          value={tempInputs[item.id] || ''}
                          onChange={(e) => setTempInputs({ ...tempInputs, [item.id]: e.target.value })}
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-44 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleCheck(item, true)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Record & Sign Off
                        </button>
                      </div>
                    )}

                    {item.tempReading && item.isCompleted && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 text-xs font-mono font-bold mt-1">
                        <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                        Recorded Temperature: {item.tempReading}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Wait Staff Cannot Perform Bar Operations</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            According to Malaya Corner restaurant staffing rules, bar staff can perform wait staff floor duties, but wait staff cannot operate the bar station.
          </p>
          <button
            type="button"
            onClick={() => setSelectedRoleSet('wait_staff')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Switch to Wait Staff Checklist
          </button>
        </div>
      )}

      {/* Fullscreen Photo Lightbox / Preview Modal */}
      {previewingPhoto && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-700/30 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                  {previewingPhoto.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewingPhoto(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-center overflow-auto max-h-[60vh]">
              <img
                src={previewingPhoto.url}
                alt={previewingPhoto.title}
                className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                {previewingPhoto.uploader && (
                  <span className="font-semibold text-slate-900">
                    Uploaded by: {previewingPhoto.uploader}
                  </span>
                )}
                {previewingPhoto.date && (
                  <span className="ml-2 text-slate-500">at {previewingPhoto.date}</span>
                )}
              </div>
              <button
                onClick={() => setPreviewingPhoto(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
