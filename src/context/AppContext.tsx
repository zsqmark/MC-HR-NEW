import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Role,
  StaffUser,
  StaffType,
  ShiftSlot,
  DayOfWeek,
  ShiftType,
  DayAvailability,
  StaffWeeklyAvailability,
  ClockRecord,
  TaskItem,
  ChecklistItem,
  RestaurantDocument,
  OnboardingFormData,
  canPerformJob,
} from '../types';
import {
  INITIAL_STAFF_USERS,
  INITIAL_AVAILABILITIES,
  INITIAL_SHIFTS,
  INITIAL_CLOCK_RECORDS,
  INITIAL_TASKS,
  INITIAL_CHECKLISTS,
  INITIAL_DOCUMENTS,
  INITIAL_ONBOARDING_DATA,
} from '../mockData';
import { validateShiftStartTime, SHIFT_WINDOWS, roundTimeTo15Minutes, parseTimeToMinutes } from '../utils/shiftTimes';
import { isWixConfigured } from '../lib/wix/client';
import { wixRepo } from '../lib/wix/repo';
import { diffById, diffRecord, isEmptyDiff } from '../lib/wix/diff';
import {
  completeWixLoginIfPresent,
  startWixLogin,
  logoutFromWix,
  getCurrentMember,
} from '../lib/wix/auth';
import { findStaffForMember, type LinkResult } from '../lib/wix/link';
import { uploadDataUrl } from '../lib/wix/media';
import { isDataUrl } from '../lib/wix/dataUrl';
// The gate's decision table lives there so it can be tested exhaustively.
import { selectGateView, type DataStatus, type AuthStatus } from './gateView';

/**
 * Two run modes:
 *
 *  - `wix`   — VITE_WIX_CLIENT_ID is set. Wix CMS is the source of truth, the
 *              signed-in Wix member determines identity and role, and the
 *              browser-side role/user switching is disabled.
 *  - `demo`  — no client ID. Behaves exactly as the original app: seed data in
 *              localStorage, PIN-gated manager view. Keeps the app runnable
 *              before Wix credentials exist, and is what the unit tests and
 *              offline dev use.
 */
const WIX_MODE = isWixConfigured();

interface AppContextType {
  currentRole: Role;
  currentStaffId: string;
  activeStaff: StaffUser;
  staffUsers: StaffUser[];
  shifts: ShiftSlot[];
  availabilities: Record<string, StaffWeeklyAvailability>;
  clockRecords: ClockRecord[];
  tasks: TaskItem[];
  checklists: ChecklistItem[];
  documents: RestaurantDocument[];
  onboardingRecords: Record<string, OnboardingFormData>;
  // Navigation state
  currentPage: string;
  setCurrentPage: (page: string) => void;
  // User switcher
  switchRole: (role: Role) => void;
  switchUser: (staffId: string) => void;
  authenticateManager: (pin: string) => boolean;
  // Scheduling
  submitAvailability: (staffId: string, weekStartDate: string, avail: Record<DayOfWeek, DayAvailability>) => void;
  assignStaffToShift: (shiftId: string, staffId: string) => void;
  unassignStaffFromShift: (shiftId: string) => void;
  createShift: (newShift: Omit<ShiftSlot, 'id'>) => boolean;
  updateShift: (shiftId: string, updates: Partial<ShiftSlot>) => boolean;
  deleteShift: (shiftId: string) => void;
  // Timeclock (Enforced 15-minute rounding: :00, :15, :30, :45)
  clockIn: (staffId: string, shiftType: ShiftType, notes?: string) => void;
  clockOut: (staffId: string, notes?: string) => void;
  toggleBreak: (staffId: string) => void;
  approveTimesheet: (recordId: string) => void;
  updateClockRecord: (recordId: string, updates: Partial<ClockRecord>) => void;
  // Tasks (Manager can create, edit, delete; staff can complete)
  createTask: (task: Omit<TaskItem, 'id' | 'isCompleted'>) => void;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  confirmTaskDone: (taskId: string, note?: string, completedBy?: { id: string; name: string }) => void;
  resetTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  // Checklist (Two distinct sets: bar_staff and wait_staff)
  toggleChecklistItem: (itemId: string, tempReading?: string, photos?: string[]) => void;
  updateChecklistItemPhotos: (itemId: string, photos: string[]) => void;
  resetChecklist: (category?: string, roleSet?: 'bar_staff' | 'wait_staff') => void;
  createChecklistItem: (item: Omit<ChecklistItem, 'id' | 'isCompleted'>) => void;
  updateChecklistItem: (itemId: string, updates: Partial<ChecklistItem>) => void;
  deleteChecklistItem: (itemId: string) => void;
  // Onboarding & Invite New Staff
  submitOnboardingForm: (staffId: string, data: OnboardingFormData) => void;
  approveOnboarding: (staffId: string) => void;
  updateOnboardingStatus: (staffId: string, status: 'approved' | 'rejected' | 'pending') => void;
  inviteStaffUser: (newStaff: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    staffType: StaffType;
    position: string;
    hourlyRate: number;
    welcomeNote?: string;
  }) => { staffId: string; inviteToken: string };
  deleteStaffUser: (staffId: string) => void;
  // Documents
  uploadDocument: (doc: Omit<RestaurantDocument, 'id' | 'uploadedAt'>) => void;
  deleteDocument: (docId: string) => void;
  // Reset
  resetToDefaults: () => void;

  /* ------------------------------------------------------------------ Wix */
  /** Which persistence backend is active. */
  backend: 'wix' | 'demo';
  /** Whether CMS data has loaded. */
  dataStatus: DataStatus;
  dataError: string | null;
  /** Re-fetch everything from Wix. */
  reloadData: () => void;
  /** Last background write failure, if any. UI shows this as a banner. */
  syncError: string | null;
  dismissSyncError: () => void;
  /** Wix Members auth. */
  authStatus: AuthStatus;
  authError: string | null;
  currentMemberId: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** True when the signed-in staff record has the manager role. */
  isManager: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STAFF_USERS: 'malaya_7shifts_staff_v2',
  SHIFTS: 'malaya_7shifts_shifts_v1',
  AVAILABILITIES: 'malaya_7shifts_availabilities_v1',
  CLOCK_RECORDS: 'malaya_7shifts_clock_v1',
  TASKS: 'malaya_7shifts_tasks_v2',
  CHECKLISTS: 'malaya_7shifts_checklists_v3',
  DOCUMENTS: 'malaya_7shifts_documents_v1',
  ONBOARDING: 'malaya_7shifts_onboarding_v1',
  CURRENT_USER_ID: 'malaya_7shifts_user_id_v1',
  CURRENT_ROLE: 'malaya_7shifts_role_v1',
};

/** Snapshot of everything the sync layer diffs against. */
interface Snapshot {
  staffUsers: StaffUser[];
  shifts: ShiftSlot[];
  availabilities: Record<string, StaffWeeklyAvailability>;
  clockRecords: ClockRecord[];
  tasks: TaskItem[];
  checklists: ChecklistItem[];
  documents: RestaurantDocument[];
  onboardingRecords: Record<string, OnboardingFormData>;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /* --------------------------------------------------------------- state */

  const [currentRole, setCurrentRole] = useState<Role>(() => {
    if (WIX_MODE) return 'staff';
    return (localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) as Role) || 'staff';
  });

  const [currentStaffId, setCurrentStaffId] = useState<string>(() => {
    if (WIX_MODE) return '';
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'staff-john';
  });

  const [currentPage, setCurrentPage] = useState<string>('Homepage');

  // In demo mode the seed/localStorage data is available synchronously; under
  // Wix it stays empty until the member is resolved and the CMS responds.
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    if (WIX_MODE) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF_USERS);
    return saved ? JSON.parse(saved) : INITIAL_STAFF_USERS;
  });

  const [shifts, setShifts] = useState<ShiftSlot[]>(() => {
    if (WIX_MODE) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  const [availabilities, setAvailabilities] = useState<Record<string, StaffWeeklyAvailability>>(() => {
    if (WIX_MODE) return {};
    const saved = localStorage.getItem(STORAGE_KEYS.AVAILABILITIES);
    return saved ? JSON.parse(saved) : INITIAL_AVAILABILITIES;
  });

  const [clockRecords, setClockRecords] = useState<ClockRecord[]>(() => {
    if (WIX_MODE) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.CLOCK_RECORDS);
    const source: ClockRecord[] = saved ? JSON.parse(saved) : INITIAL_CLOCK_RECORDS;
    // Normalize all clock records to 15-minute intervals (:00, :15, :30, :45)
    return source.map((rec) => {
      const roundedIn = roundTimeTo15Minutes(rec.clockInTime);
      const roundedOut = rec.clockOutTime ? roundTimeTo15Minutes(rec.clockOutTime) : undefined;
      let totalHours = rec.totalHours;
      if (roundedIn && roundedOut) {
        const inMins = parseTimeToMinutes(roundedIn) ?? 0;
        const outMins = parseTimeToMinutes(roundedOut) ?? 0;
        let diff = outMins - inMins;
        if (diff < 0) diff += 24 * 60;
        diff = Math.max(0, diff - (rec.breakMinutes || 0));
        totalHours = Number((diff / 60).toFixed(2));
      }
      return {
        ...rec,
        clockInTime: roundedIn,
        clockOutTime: roundedOut,
        totalHours,
      };
    });
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    if (WIX_MODE) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    const list: TaskItem[] = saved ? JSON.parse(saved) : INITIAL_TASKS;
    return list.filter((t) => t.id !== 'task-4');
  });

  const [checklists, setChecklists] = useState<ChecklistItem[]>(() => {
    if (WIX_MODE) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.CHECKLISTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing checklists v3', e);
      }
    }
    const savedV2 = localStorage.getItem('malaya_7shifts_checklists_v2');
    if (savedV2) {
      try {
        const parsedV2: ChecklistItem[] = JSON.parse(savedV2);
        // Merge with INITIAL_CHECKLISTS to adopt requiresPhoto, maxPhotos, and photos
        return INITIAL_CHECKLISTS.map((init) => {
          const match = parsedV2.find((p) => p.id === init.id);
          if (match) {
            return {
              ...init,
              ...match,
              requiresPhoto: init.requiresPhoto ?? match.requiresPhoto,
              maxPhotos: init.maxPhotos ?? match.maxPhotos,
              photos: match.photos || init.photos,
            };
          }
          return init;
        });
      } catch (e) {
        console.error('Error migrating checklists v2', e);
      }
    }
    return INITIAL_CHECKLISTS;
  });

  const [documents, setDocuments] = useState<RestaurantDocument[]>(() => {
    if (WIX_MODE) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [onboardingRecords, setOnboardingRecords] = useState<Record<string, OnboardingFormData>>(() => {
    if (WIX_MODE) return {};
    const saved = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
    return saved ? JSON.parse(saved) : INITIAL_ONBOARDING_DATA;
  });

  /* ------------------------------------------------------- wix status/auth */

  const [dataStatus, setDataStatus] = useState<DataStatus>(WIX_MODE ? 'loading' : 'ready');
  const [dataError, setDataError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(WIX_MODE ? 'idle' : 'signed_in');
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  /** Outcome of matching the signed-in member to a roster row. */
  const [linkInfo, setLinkInfo] = useState<LinkResult | null>(null);
  /**
   * Uploads currently in flight. Wix sync is paused while this is non-zero, so a
   * base64 photo or document can never be written into a CMS item field.
   */
  const [pendingUploads, setPendingUploads] = useState(0);

  /**
   * The last snapshot we know is persisted. Effects diff current state against
   * this, so an unchanged render produces no network traffic at all. It is set
   * when data is hydrated, which is what stops the first effect pass after a
   * load from writing every row straight back.
   */
  const syncedRef = useRef<Snapshot | null>(null);

  /** Guards against an unmounted provider resolving async work. */
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const noteSyncError = useCallback((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    setSyncError(msg);
    console.error('[wix] background write failed:', msg);
  }, []);

  /** Apply everything loaded from Wix and mark it as already-synced. */
  const hydrate = useCallback((data: Awaited<ReturnType<typeof wixRepo.loadAllData>>) => {
    // Round trip through the 15-minute normalisation so display matches demo mode.
    const normalizedClock = data.clockRecords.map((rec) => {
      const roundedIn = roundTimeTo15Minutes(rec.clockInTime);
      const roundedOut = rec.clockOutTime ? roundTimeTo15Minutes(rec.clockOutTime) : undefined;
      return { ...rec, clockInTime: roundedIn, clockOutTime: roundedOut };
    });

    setStaffUsers(data.staffUsers);
    setShifts(data.shifts);
    setAvailabilities(data.availabilities);
    setClockRecords(normalizedClock);
    setTasks(data.tasks);
    setChecklists(data.checklists);
    setDocuments(data.documents);
    setOnboardingRecords(data.onboardingRecords);

    syncedRef.current = {
      staffUsers: data.staffUsers,
      shifts: data.shifts,
      availabilities: data.availabilities,
      clockRecords: normalizedClock,
      tasks: data.tasks,
      checklists: data.checklists,
      documents: data.documents,
      onboardingRecords: data.onboardingRecords,
    };
  }, []);

  /**
   * Resolve the signed-in Wix member to a staff record and pull the CMS.
   *
   * A member with no matching staff row is deliberately NOT given access: they
   * land in `unprovisioned` rather than falling back to some default identity.
   */
  const bootWix = useCallback(async () => {
    try {
      // A returning redirect from the Wix login page exchanges the code here.
      try {
        const justLoggedIn = await completeWixLoginIfPresent();
        if (justLoggedIn) setAuthStatus('signed_in');
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : String(e));
        setAuthStatus('error');
      }

      const member = await getCurrentMember();
      if (!aliveRef.current) return;
      if (!member) {
        setAuthStatus('signed_out');
        setDataStatus('loading');
        return;
      }
      setCurrentMemberId(member.id);
      setAuthStatus('signed_in');

      // Resolve identity against the member-readable directory. Reading the
      // admin-only StaffMembers collection here would be denied for a
      // non-manager and would lock them out of the app entirely.
      const directory = await wixRepo.loadDirectory();
      if (!aliveRef.current) return;
      const link = findStaffForMember({ id: member.id, email: member.email }, directory);
      setLinkInfo(link);

      // A member with no matching staff row is deliberately NOT given access:
      // they land in `unprovisioned` rather than falling back to a default
      // identity. See src/lib/wix/link.ts for why this cannot be self-service.
      if (!link.match) {
        setDataStatus('unprovisioned');
        return;
      }

      setCurrentStaffId(link.match.id);
      setCurrentRole(link.match.role);

      // Managers may read the full records (including pay); everyone else stays
      // on the pay-free directory projection.
      const data = await wixRepo.loadAllData({ fullStaff: link.match.role === 'manager' });
      if (!aliveRef.current) return;
      hydrate(data);
      setDataStatus('ready');
      setDataError(null);
    } catch (e) {
      if (!aliveRef.current) return;
      setDataError(e instanceof Error ? e.message : String(e));
      setDataStatus('error');
    }
  }, [hydrate]);

  useEffect(() => {
    if (!WIX_MODE) return;
    void bootWix();
    // Only on mount: subsequent reloads go through reloadData().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reloadData = useCallback(() => {
    if (!WIX_MODE) return;
    setDataStatus('loading');
    setDataError(null);
    void bootWix();
  }, [bootWix]);

  const signIn = useCallback(async () => {
    setAuthStatus('authenticating');
    setAuthError(null);
    try {
      await startWixLogin();
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : String(e));
      setAuthStatus('error');
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthStatus('signed_out');
    await logoutFromWix();
  }, []);

  /* ------------------------------------------------------------ persistence */
  //
  // Demo mode writes localStorage exactly as before. Wix mode diffs against the
  // last-persisted snapshot and issues the minimal set of writes. Failures are
  // surfaced through `syncError` rather than thrown, because these run in the
  // background and the UI has already applied the optimistic change.

  const syncList = useCallback(
    async <T extends { id: string }>(
      prev: T[] | undefined,
      next: T[],
      save: (item: T) => Promise<void>,
      remove: (id: string) => Promise<void>,
    ) => {
      if (!prev) return;
      const diff = diffById(prev, next);
      if (isEmptyDiff(diff)) return;
      try {
        for (const item of diff.upsert) await save(item);
        for (const id of diff.removed) await remove(id);
      } catch (e) {
        noteSyncError(e);
      }
    },
    [noteSyncError],
  );

  const syncRecord = useCallback(
    async <T,>(
      prev: Record<string, T> | undefined,
      next: Record<string, T>,
      save: (key: string, value: T) => Promise<void>,
      remove: (key: string) => Promise<void>,
    ) => {
      if (!prev) return;
      const diff = diffRecord(prev, next);
      if (isEmptyDiff(diff)) return;
      try {
        for (const entry of diff.upsert) await save(entry.id, entry.value);
        for (const id of diff.removed) await remove(id);
      } catch (e) {
        noteSyncError(e);
      }
    },
    [noteSyncError],
  );

  /**
   * Sync is paused while any upload is in flight, so a base64 data URL can never
   * reach a CMS item field. Every sync effect already depends on `wixActive`, so
   * when the last upload settles the effects re-run and their diffs pick up the
   * real Media Manager URLs.
   */
  const wixActive = WIX_MODE && dataStatus === 'ready' && pendingUploads === 0;

  /**
   * Replace base64 data URLs with Media Manager URLs, leaving anything that is
   * already a URL untouched. Throws on failure so callers report and drop rather
   * than silently storing the base64 payload.
   */
  const toMediaUrls = useCallback(async (urls: string[], namePrefix: string): Promise<string[]> => {
    const out: string[] = [];
    for (const [i, url] of urls.entries()) {
      if (!isDataUrl(url)) {
        out.push(url);
        continue;
      }
      out.push(await uploadDataUrl(url, `${namePrefix}-${i + 1}`));
    }
    return out;
  }, []);

  useEffect(() => {
    if (!WIX_MODE) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, currentRole);
      return;
    }
  }, [currentRole]);

  useEffect(() => {
    if (!WIX_MODE) localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentStaffId);
  }, [currentStaffId]);

  useEffect(() => {
    if (!wixActive) {
      if (!WIX_MODE) localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(staffUsers));
      return;
    }
    const prev = syncedRef.current?.staffUsers;
    if (syncedRef.current) syncedRef.current.staffUsers = staffUsers;

    // Only a manager may write `StaffMembers`. For anyone else the in-memory
    // list is the pay-free directory projection, and writing it back to the
    // full collection would clobber pay fields with defaults.
    if (currentRole === 'manager') {
      void syncList(prev, staffUsers, wixRepo.staff.save, wixRepo.staff.remove);
    }
    // The directory is always kept in step. For a non-manager this is a no-op
    // because the rows already round-trip to identical values.
    void syncList(prev, staffUsers, wixRepo.staff.saveDirectory, wixRepo.staff.removeDirectory);
  }, [staffUsers, wixActive, syncList, currentRole]);

  useEffect(() => {
    if (!wixActive) {
      if (!WIX_MODE) localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
      return;
    }
    const prev = syncedRef.current?.shifts;
    if (syncedRef.current) syncedRef.current.shifts = shifts;
    void syncList(prev, shifts, wixRepo.shifts.save, wixRepo.shifts.remove);
  }, [shifts, wixActive, syncList]);

  useEffect(() => {
    if (!wixActive) {
      if (!WIX_MODE) localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(availabilities));
      return;
    }
    const prev = syncedRef.current?.availabilities;
    if (syncedRef.current) syncedRef.current.availabilities = availabilities;
    void syncRecord(
      prev,
      availabilities,
      (_key, value) => wixRepo.availability.save(value),
      (key) => wixRepo.availability.remove(key),
    );
  }, [availabilities, wixActive, syncRecord]);

  useEffect(() => {
    if (!wixActive) {
      if (!WIX_MODE) localStorage.setItem(STORAGE_KEYS.CLOCK_RECORDS, JSON.stringify(clockRecords));
      return;
    }
    const prev = syncedRef.current?.clockRecords;
    if (syncedRef.current) syncedRef.current.clockRecords = clockRecords;
    void syncList(prev, clockRecords, wixRepo.clockRecords.save, wixRepo.clockRecords.remove);
  }, [clockRecords, wixActive, syncList]);

  useEffect(() => {
    if (!wixActive) {
      if (!WIX_MODE) localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return;
    }
    const prev = syncedRef.current?.tasks;
    if (syncedRef.current) syncedRef.current.tasks = tasks;
    void syncList(prev, tasks, wixRepo.tasks.save, wixRepo.tasks.remove);
  }, [tasks, wixActive, syncList]);

  useEffect(() => {
    if (!wixActive) {
      if (!WIX_MODE) localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(checklists));
      return;
    }
    const prev = syncedRef.current?.checklists;
    if (syncedRef.current) syncedRef.current.checklists = checklists;
    void syncList(prev, checklists, wixRepo.checklists.save, wixRepo.checklists.remove);
  }, [checklists, wixActive, syncList]);

  useEffect(() => {
    if (!wixActive) {
      if (!WIX_MODE) localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
      return;
    }
    const prev = syncedRef.current?.documents;
    if (syncedRef.current) syncedRef.current.documents = documents;
    void syncList(prev, documents, wixRepo.documents.save, wixRepo.documents.remove);
  }, [documents, wixActive, syncList]);

  useEffect(() => {
    if (!wixActive) {
      if (!WIX_MODE) localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(onboardingRecords));
      return;
    }
    const prev = syncedRef.current?.onboardingRecords;
    if (syncedRef.current) syncedRef.current.onboardingRecords = onboardingRecords;
    void syncRecord(
      prev,
      onboardingRecords,
      (key, value) => wixRepo.onboarding.save(key, value),
      (key) => wixRepo.onboarding.remove(key),
    );
  }, [onboardingRecords, wixActive, syncRecord]);

  /** In Wix mode there is no local identity to fall back on. */
  const fallbackStaff: StaffUser = {
    id: '',
    firstName: 'Unknown',
    lastName: 'User',
    email: '',
    phone: '',
    role: 'staff',
    position: '',
    hourlyRate: 0,
    onboardingCompleted: false,
    onboardingStatus: 'not_started',
  };

  const activeStaff: StaffUser = staffUsers.find((s) => s.id === currentStaffId) || staffUsers[1] || fallbackStaff;

  // Strict RBAC Enforcement: Staff users can never have currentRole set to 'manager'
  useEffect(() => {
    if (activeStaff.role === 'staff' && currentRole === 'manager') {
      setCurrentRole('staff');
      setCurrentPage('Homepage');
    }
  }, [activeStaff.role, currentRole]);

  const switchRole = (role: Role) => {
    // Under Wix the signed-in member's role is authoritative and cannot be
    // changed from the browser. This is the whole point of the migration.
    if (WIX_MODE) {
      console.warn('Role switching is disabled: the Wix staff record determines your role.');
      return;
    }
    // Staff cannot switch to manager view
    if (role === 'manager' && activeStaff.role !== 'manager') {
      console.warn('Unauthorized: Staff members do not have permission to switch to manager view.');
      return;
    }
    setCurrentRole(role);
    if (role === 'manager') {
      setCurrentStaffId('staff-mark');
    }
    setCurrentPage('Homepage');
  };

  const switchUser = (staffId: string) => {
    // Switching to another employee would be an impersonation hole once real
    // logins exist, so it is demo-only.
    if (WIX_MODE) {
      console.warn('User switching is disabled: identity comes from the Wix member session.');
      return;
    }
    const target = staffUsers.find((u) => u.id === staffId);
    if (!target) return;

    // Disallow staff from directly switching to manager
    if (activeStaff.role === 'staff' && target.role === 'manager') {
      console.warn('Unauthorized: Staff cannot switch to manager account without authorization.');
      return;
    }

    setCurrentStaffId(staffId);
    setCurrentRole(target.role);
    setCurrentPage('Homepage');
  };

  const authenticateManager = (pin: string): boolean => {
    // The PIN is removed under Wix: sign-in happens through Wix Members.
    if (WIX_MODE) {
      setAuthError('Manager access now requires signing in with your Wix account.');
      return false;
    }
    if (pin.trim() === '1234') {
      setCurrentStaffId('staff-mark');
      setCurrentRole('manager');
      setCurrentPage('Homepage');
      return true;
    }
    return false;
  };

  const submitAvailability = (staffId: string, weekStartDate: string, avail: Record<DayOfWeek, DayAvailability>) => {
    const newRecord: StaffWeeklyAvailability = {
      id: `avail-${staffId}-${Date.now()}`,
      staffId,
      weekStartDate,
      submittedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      availabilities: avail,
    };
    setAvailabilities((prev) => ({
      ...prev,
      [staffId]: newRecord,
    }));
  };

  const assignStaffToShift = (shiftId: string, staffId: string) => {
    setShifts((prev) =>
      prev.map((shift) => (shift.id === shiftId ? { ...shift, assignedStaffId: staffId } : shift))
    );
  };

  const unassignStaffFromShift = (shiftId: string) => {
    setShifts((prev) =>
      prev.map((shift) => (shift.id === shiftId ? { ...shift, assignedStaffId: undefined } : shift))
    );
  };

  const createShift = (newShift: Omit<ShiftSlot, 'id'>): boolean => {
    const validation = validateShiftStartTime(newShift.shiftType, newShift.startTime);
    const validStartTime = validation.isValid
      ? validation.formattedTime || newShift.startTime
      : SHIFT_WINDOWS[newShift.shiftType].defaultStart;

    const slot: ShiftSlot = {
      ...newShift,
      startTime: validStartTime,
      id: `s-custom-${Date.now()}`,
    };
    setShifts((prev) => [...prev, slot]);
    return validation.isValid;
  };

  const updateShift = (shiftId: string, updates: Partial<ShiftSlot>): boolean => {
    let isValid = true;
    setShifts((prev) =>
      prev.map((shift) => {
        if (shift.id !== shiftId) return shift;
        const shiftType = updates.shiftType || shift.shiftType;
        let startTime = shift.startTime;

        if (updates.startTime) {
          const validation = validateShiftStartTime(shiftType, updates.startTime);
          if (validation.isValid) {
            startTime = validation.formattedTime || updates.startTime;
          } else {
            isValid = false;
            return shift; // Reject invalid update
          }
        }

        return {
          ...shift,
          ...updates,
          startTime,
        };
      })
    );
    return isValid;
  };

  const deleteShift = (shiftId: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
  };

  const clockIn = (staffId: string, shiftType: ShiftType, notes?: string) => {
    const staff = staffUsers.find((s) => s.id === staffId);
    if (!staff) return;

    const now = new Date();
    // Record clock in time strictly in 15-minute intervals (:00, :15, :30, :45)
    const timeStr = roundTimeTo15Minutes(now);
    const dateStr = now.toISOString().slice(0, 10);

    const newRecord: ClockRecord = {
      id: `clk-${Date.now()}`,
      staffId,
      staffName: `${staff.firstName} ${staff.lastName}`,
      position: staff.position,
      date: dateStr,
      shiftType,
      clockInTime: timeStr,
      breakMinutes: 0,
      status: 'clocked_in',
      hourlyRate: staff.hourlyRate,
      notes,
    };

    setClockRecords((prev) => [newRecord, ...prev]);
  };

  const clockOut = (staffId: string, notes?: string) => {
    const now = new Date();
    // Record clock out time strictly in 15-minute intervals (:00, :15, :30, :45)
    const timeStr = roundTimeTo15Minutes(now);

    setClockRecords((prev) =>
      prev.map((record) => {
        if (record.staffId === staffId && (record.status === 'clocked_in' || record.status === 'on_break')) {
          // Calculate exact shift hours using 15-minute interval math
          const inMins = parseTimeToMinutes(record.clockInTime) ?? 0;
          const outMins = parseTimeToMinutes(timeStr) ?? 0;
          let diffMinutes = outMins - inMins;
          if (diffMinutes < 0) diffMinutes += 24 * 60; // over midnight
          diffMinutes = Math.max(0, diffMinutes - record.breakMinutes);
          const totalHours = Number((diffMinutes / 60).toFixed(2));

          return {
            ...record,
            clockOutTime: timeStr,
            totalHours,
            status: 'completed',
            notes: notes ? (record.notes ? `${record.notes} | ${notes}` : notes) : record.notes,
          };
        }
        return record;
      })
    );
  };

  const toggleBreak = (staffId: string) => {
    const now = new Date();
    const timeStr = roundTimeTo15Minutes(now);

    setClockRecords((prev) =>
      prev.map((record) => {
        if (record.staffId === staffId) {
          if (record.status === 'clocked_in') {
            return {
              ...record,
              status: 'on_break',
              breakStartTime: timeStr,
            };
          } else if (record.status === 'on_break') {
            const addedBreak = 15; // default 15m or elapsed
            return {
              ...record,
              status: 'clocked_in',
              breakMinutes: record.breakMinutes + addedBreak,
              breakStartTime: undefined,
            };
          }
        }
        return record;
      })
    );
  };

  const approveTimesheet = (recordId: string) => {
    setClockRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, status: 'approved' } : r))
    );
  };

  const updateClockRecord = (recordId: string, updates: Partial<ClockRecord>) => {
    setClockRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== recordId) return rec;

        // Ensure any modified clockInTime or clockOutTime is strictly in 15-minute intervals (:00, :15, :30, :45)
        const updatedIn = updates.clockInTime ? roundTimeTo15Minutes(updates.clockInTime) : rec.clockInTime;
        const updatedOut = updates.clockOutTime ? roundTimeTo15Minutes(updates.clockOutTime) : rec.clockOutTime;

        let totalHours = rec.totalHours;
        if (updatedIn && updatedOut) {
          const inMins = parseTimeToMinutes(updatedIn) ?? 0;
          const outMins = parseTimeToMinutes(updatedOut) ?? 0;
          let diffMinutes = outMins - inMins;
          if (diffMinutes < 0) diffMinutes += 24 * 60;
          const breakM = updates.breakMinutes !== undefined ? updates.breakMinutes : rec.breakMinutes;
          diffMinutes = Math.max(0, diffMinutes - breakM);
          totalHours = Number((diffMinutes / 60).toFixed(2));
        }

        return {
          ...rec,
          ...updates,
          clockInTime: updatedIn,
          clockOutTime: updatedOut,
          totalHours,
        };
      })
    );
  };

  const createTask = (task: Omit<TaskItem, 'id' | 'isCompleted'>) => {
    const isUnassigned = !task.assignedToStaffId || task.assignedToStaffId === 'unassigned';
    const newTask: TaskItem = {
      ...task,
      id: `task-${Date.now()}`,
      assignedToStaffId: isUnassigned ? undefined : task.assignedToStaffId,
      assignedStaffName: isUnassigned ? 'Unassigned (Open Team Task)' : task.assignedStaffName,
      isCompleted: false,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const confirmTaskDone = (taskId: string, note?: string, completedBy?: { id: string; name: string }) => {
    const now = new Date();
    const timeStr = now.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    const staffName = completedBy?.name || `${activeStaff.firstName} ${activeStaff.lastName}`;
    const staffId = completedBy?.id || activeStaff.id;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isCompleted: true,
              completedAt: timeStr,
              completedByStaffName: staffName,
              completedByStaffId: staffId,
              completionNote: note || 'Confirmed completed on shift.',
            }
          : t
      )
    );
  };

  const updateTask = (taskId: string, updates: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const resetTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isCompleted: false,
              completedAt: undefined,
              completedByStaffName: undefined,
              completedByStaffId: undefined,
              completionNote: undefined,
            }
          : t
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  /** The synchronous toggle body, shared by both run modes. */
  const applyChecklistToggle = (
    itemId: string,
    tempReading: string | undefined,
    photos: string[] | undefined,
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    setChecklists((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const nextState = !item.isCompleted;
          return {
            ...item,
            isCompleted: nextState,
            completedBy: nextState ? `${activeStaff.firstName} ${activeStaff.lastName}` : undefined,
            completedAt: nextState ? timeStr : undefined,
            tempReading: tempReading !== undefined ? tempReading : item.tempReading,
            photos: photos !== undefined ? photos : item.photos,
          };
        }
        return item;
      })
    );
  };

  const toggleChecklistItem = (itemId: string, tempReading?: string, photos?: string[]) => {
    if (!WIX_MODE) {
      applyChecklistToggle(itemId, tempReading, photos);
      return;
    }

    // Apply the toggle immediately so the checkbox feels instant, but WITHOUT
    // the photos: the base64 payload must not enter state while sync is live.
    applyChecklistToggle(itemId, tempReading, undefined);

    if (!photos || photos.length === 0) return;
    setPendingUploads((n) => n + 1);
    void (async () => {
      try {
        const urls = await toMediaUrls(photos, `checklist-${itemId}`);
        setChecklists((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, photos: urls } : item)),
        );
      } catch (e) {
        noteSyncError(e);
      } finally {
        setPendingUploads((n) => n - 1);
      }
    })();
  };

  const updateChecklistItemPhotos = (itemId: string, photos: string[]) => {
    if (!WIX_MODE) {
      setChecklists((prev) => prev.map((item) => (item.id === itemId ? { ...item, photos } : item)));
      return;
    }

    setPendingUploads((n) => n + 1);
    void (async () => {
      try {
        const urls = await toMediaUrls(photos, `checklist-${itemId}`);
        setChecklists((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, photos: urls } : item)),
        );
      } catch (e) {
        // Fail closed: dropping an unsaved photo with a clear error is far better
        // than writing megabytes of base64 into a CMS item field.
        noteSyncError(e);
      } finally {
        setPendingUploads((n) => n - 1);
      }
    })();
  };

  const resetChecklist = (category?: string, roleSet?: 'bar_staff' | 'wait_staff') => {
    setChecklists((prev) =>
      prev.map((item) => {
        const matchesCategory = !category || item.category === category;
        const matchesRole = !roleSet || item.roleSet === roleSet;
        if (matchesCategory && matchesRole) {
          return {
            ...item,
            isCompleted: false,
            completedBy: undefined,
            completedAt: undefined,
            tempReading: undefined,
          };
        }
        return item;
      })
    );
  };

  const createChecklistItem = (item: Omit<ChecklistItem, 'id' | 'isCompleted'>) => {
    const newItem: ChecklistItem = {
      ...item,
      id: `chk-custom-${Date.now()}`,
      isCompleted: false,
    };
    setChecklists((prev) => [...prev, newItem]);
  };

  const updateChecklistItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    setChecklists((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );
  };

  const deleteChecklistItem = (itemId: string) => {
    setChecklists((prev) => prev.filter((item) => item.id !== itemId));
  };

  const inviteStaffUser = (newStaff: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    staffType: StaffType;
    position: string;
    hourlyRate: number;
    welcomeNote?: string;
  }) => {
    const newId = `staff-${Date.now()}`;
    const token = `mc-inv-${Math.random().toString(36).substring(2, 10)}`;
    const invitedUser: StaffUser = {
      id: newId,
      firstName: newStaff.firstName.trim(),
      lastName: newStaff.lastName.trim(),
      email: newStaff.email.trim(),
      phone: newStaff.phone.trim(),
      role: 'staff',
      staffType: newStaff.staffType,
      position: newStaff.position.trim() || (newStaff.staffType === 'bar_staff' ? 'Bar Staff' : 'Wait Staff'),
      hourlyRate: Number(newStaff.hourlyRate) || 26.5,
      onboardingCompleted: false,
      onboardingStatus: 'invite_sent',
      invitationSentAt: new Date().toISOString().slice(0, 10),
      inviteToken: token,
      welcomeNote: newStaff.welcomeNote?.trim(),
    };

    setStaffUsers((prev) => [...prev, invitedUser]);
    return { staffId: newId, inviteToken: token };
  };

  const deleteStaffUser = (staffId: string) => {
    setStaffUsers((prev) => prev.filter((u) => u.id !== staffId));
  };

  /** The synchronous body, shared by both run modes. */
  const applyOnboardingForm = (staffId: string, data: OnboardingFormData) => {
    setOnboardingRecords((prev) => ({
      ...prev,
      [staffId]: data,
    }));

    // Update staff profile to completed
    const dateStr = new Date().toISOString().slice(0, 10);
    setStaffUsers((prev) =>
      prev.map((u) =>
        u.id === staffId
          ? {
              ...u,
              onboardingCompleted: true,
              onboardingStatus: 'approved',
              onboardingSubmittedAt: dateStr,
            }
          : u
      )
    );

    // Auto-create document entries so manager can view collected documents in Documents page
    const staff = staffUsers.find((s) => s.id === staffId);
    const fullName = staff ? `${staff.firstName} ${staff.lastName}` : 'Staff';

    const newDocs: RestaurantDocument[] = [];
    if (data.q12_vevoDoc) {
      newDocs.push({
        id: `doc-id-${staffId}-${Date.now()}`,
        title: `${fullName} - Identity & Work Clearance Document`,
        category: 'Staff Submission',
        fileName: data.q12_vevoDoc.fileName,
        fileSize: data.q12_vevoDoc.fileSize,
        fileUrl: data.q12_vevoDoc.dataUrl,
        uploadedBy: fullName,
        uploadedFor: staffId,
        uploadedAt: dateStr,
        description: 'Uploaded via New Staff Onboarding Form (Q12).',
      });
    }
    if (data.q13_foodHandlerDoc) {
      newDocs.push({
        id: `doc-foodhandler-${staffId}-${Date.now()}`,
        title: `${fullName} - Signed Food Handler Skills Checklist`,
        category: 'Staff Submission',
        fileName: data.q13_foodHandlerDoc.fileName,
        fileSize: data.q13_foodHandlerDoc.fileSize,
        fileUrl: data.q13_foodHandlerDoc.dataUrl,
        uploadedBy: fullName,
        uploadedFor: staffId,
        uploadedAt: dateStr,
        description: 'Uploaded via New Staff Onboarding Form (Q13).',
      });
    }
    if (data.q14_tfnDoc) {
      newDocs.push({
        id: `doc-tfn-${staffId}-${Date.now()}`,
        title: `${fullName} - ATO TFN Declaration Form`,
        category: 'Tax & Super',
        fileName: data.q14_tfnDoc.fileName,
        fileSize: data.q14_tfnDoc.fileSize,
        fileUrl: data.q14_tfnDoc.dataUrl,
        uploadedBy: fullName,
        uploadedFor: staffId,
        uploadedAt: dateStr,
        description: 'Uploaded via New Staff Onboarding Form (Q14).',
      });
    }
    if (data.q15_foodHygieneCert) {
      newDocs.push({
        id: `doc-hygiene-${staffId}-${Date.now()}`,
        title: `${fullName} - Food Hygiene Certificate`,
        category: 'Staff Submission',
        fileName: data.q15_foodHygieneCert.fileName,
        fileSize: data.q15_foodHygieneCert.fileSize,
        fileUrl: data.q15_foodHygieneCert.dataUrl,
        uploadedBy: fullName,
        uploadedFor: staffId,
        uploadedAt: dateStr,
        description: 'Uploaded via New Staff Onboarding Form (Q15).',
      });
    }

    if (newDocs.length > 0) {
      setDocuments((prev) => [...newDocs, ...prev]);
    }
  };

  /**
   * Upload any base64 documents to Wix Media first, then apply the form.
   *
   * The upload must complete before the state update: the sync layer treats the
   * state change as the trigger, so setting `onboardingRecords` first would write
   * the base64 payload straight into the CMS, and into the document rows derived
   * from it.
   */
  const submitOnboardingForm = (staffId: string, data: OnboardingFormData) => {
    if (!WIX_MODE) {
      applyOnboardingForm(staffId, data);
      return;
    }

    const DOC_KEYS = ['q12_vevoDoc', 'q13_foodHandlerDoc', 'q14_tfnDoc', 'q15_foodHygieneCert'] as const;
    const needsUpload = DOC_KEYS.some((k) => {
      const file = data[k];
      return !!file?.dataUrl && isDataUrl(file.dataUrl);
    });

    if (!needsUpload) {
      applyOnboardingForm(staffId, data);
      return;
    }

    setPendingUploads((n) => n + 1);
    void (async () => {
      try {
        const resolved: OnboardingFormData = { ...data };
        for (const key of DOC_KEYS) {
          const file = resolved[key];
          if (file?.dataUrl && isDataUrl(file.dataUrl)) {
            const url = await uploadDataUrl(file.dataUrl, `onboarding-${staffId}-${key}`);
            resolved[key] = { ...file, dataUrl: url };
          }
        }
        applyOnboardingForm(staffId, resolved);
      } catch (e) {
        // Fail closed: never fall back to storing the base64 payload.
        noteSyncError(e);
      } finally {
        setPendingUploads((n) => n - 1);
      }
    })();
  };

  const approveOnboarding = (staffId: string) => {
    setStaffUsers((prev) =>
      prev.map((u) =>
        u.id === staffId ? { ...u, onboardingCompleted: true, onboardingStatus: 'approved' } : u
      )
    );
  };

  const updateOnboardingStatus = (staffId: string, status: 'approved' | 'rejected' | 'pending') => {
    setStaffUsers((prev) =>
      prev.map((u) =>
        u.id === staffId
          ? {
              ...u,
              onboardingStatus: status,
              onboardingCompleted: status === 'approved',
            }
          : u
      )
    );
  };

  const uploadDocument = (doc: Omit<RestaurantDocument, 'id' | 'uploadedAt'>) => {
    const newDoc: RestaurantDocument = {
      ...doc,
      id: `doc-upload-${Date.now()}`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const resetToDefaults = () => {
    // Under Wix this would overwrite live CMS records with demo seed data and
    // delete every real row the seed data does not contain, because the sync
    // layer treats anything missing from the new state as a removal. Refuse
    // outright rather than trusting the operator to be careful.
    if (WIX_MODE) {
      setSyncError(
        'Reset to demo defaults is disabled while Wix is the backend: it would overwrite live data. Manage records in the Wix CMS instead.',
      );
      return;
    }

    localStorage.clear();
    setStaffUsers(INITIAL_STAFF_USERS);
    setShifts(INITIAL_SHIFTS);
    setAvailabilities(INITIAL_AVAILABILITIES);
    setClockRecords(INITIAL_CLOCK_RECORDS);
    setTasks(INITIAL_TASKS);
    setChecklists(INITIAL_CHECKLISTS);
    setDocuments(INITIAL_DOCUMENTS);
    setOnboardingRecords(INITIAL_ONBOARDING_DATA);
    setCurrentRole('staff');
    setCurrentStaffId('staff-john');
    setCurrentPage('Homepage');
  };

  const isManager = activeStaff.role === 'manager';

  /* ------------------------------------------------------- gate rendering */
  //
  // Under Wix the app cannot render until a member is resolved and data is in.
  // Rendering children with an empty roster is what would otherwise crash the
  // many components that dereference `activeStaff`.

  if (WIX_MODE && dataStatus !== 'ready') {
    return (
      <WixGate
        status={dataStatus}
        authStatus={authStatus}
        authError={authError}
        dataError={dataError}
        linkInfo={linkInfo}
        onSignIn={signIn}
        onRetry={reloadData}
      />
    );
  }

  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentStaffId,
        activeStaff,
        staffUsers,
        shifts,
        availabilities,
        clockRecords,
        tasks,
        checklists,
        documents,
        onboardingRecords,
        currentPage,
        setCurrentPage,
        switchRole,
        switchUser,
        authenticateManager,
        submitAvailability,
        assignStaffToShift,
        unassignStaffFromShift,
        createShift,
        updateShift,
        deleteShift,
        clockIn,
        clockOut,
        toggleBreak,
        approveTimesheet,
        updateClockRecord,
        createTask,
        updateTask,
        confirmTaskDone,
        resetTask,
        deleteTask,
        toggleChecklistItem,
        updateChecklistItemPhotos,
        resetChecklist,
        createChecklistItem,
        updateChecklistItem,
        deleteChecklistItem,
        submitOnboardingForm,
        approveOnboarding,
        updateOnboardingStatus,
        inviteStaffUser,
        deleteStaffUser,
        uploadDocument,
        deleteDocument,
        resetToDefaults,
        backend: WIX_MODE ? 'wix' : 'demo',
        dataStatus,
        dataError,
        reloadData,
        syncError,
        dismissSyncError: () => setSyncError(null),
        authStatus,
        authError,
        currentMemberId,
        signIn,
        signOut,
        isManager,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/* --------------------------------------------------------------------- gate */

const WixGate: React.FC<{
  status: DataStatus;
  authStatus: AuthStatus;
  authError: string | null;
  dataError: string | null;
  linkInfo: LinkResult | null;
  onSignIn: () => Promise<void>;
  onRetry: () => void;
}> = ({ status, authStatus, authError, dataError, linkInfo, onSignIn, onRetry }) => {
  const shell = (title: string, body: React.ReactNode) => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-7 space-y-4">
        <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldIcon />
          {title}
        </h1>
        {body}
      </div>
    </div>
  );

  // Which screen to show. Kept in ./gateView so the decision table (including the
  // fail-closed rule that the app never renders before data is ready) is tested.
  const view = selectGateView(status, authStatus);

  if (view === 'unprovisioned') {
    // Explain exactly why access was refused so a manager can fix it without
    // guessing. This is the single most likely first-run support question.
    const ambiguous = linkInfo?.reason === 'ambiguous';
    const names = (linkInfo?.candidates ?? [])
      .map((s) => `${s.firstName} ${s.lastName}`.trim() || s.id)
      .join(', ');

    return shell(
      ambiguous ? 'Duplicate staff records' : 'No staff record for this account',
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        {ambiguous ? (
          <>
            <p>
              More than one roster row uses your email address
              {names ? <> (<strong>{names}</strong>)</> : null}, so the system can&apos;t tell which one is you.
            </p>
            <p>A manager needs to remove the duplicate, or set the member ID on the correct row.</p>
          </>
        ) : (
          <>
            <p>
              You&apos;re signed in, but no staff record is linked to this account yet.
            </p>
            <p>
              Ask a manager to set your Wix member ID on your row in the{' '}
              <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">StaffDirectory</code> collection,
              then reload this page.
            </p>
          </>
        )}
      </div>,
    );
  }

  if (view === 'error') {
    return shell(
      'Could not load data from Wix',
      <div className="space-y-3">
        <p className="text-sm text-red-700 break-words">{dataError ?? 'Unknown error.'}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold"
        >
          Try again
        </button>
      </div>,
    );
  }

  if (view === 'signin') {
    return shell(
      'Sign in to continue',
      <div className="space-y-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          This portal uses your Wix account. Sign in with the Wix account linked to your staff record.
        </p>
        {authError && <p className="text-xs text-red-700 break-words">{authError}</p>}
        {authStatus === 'authenticating' ? (
          <p className="text-sm text-slate-500">Redirecting to Wix…</p>
        ) : (
          <button
            onClick={() => void onSignIn()}
            className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold"
          >
            Sign in with Wix
          </button>
        )}
      </div>,
    );
  }

  return shell('Loading your workspace…', <p className="text-sm text-slate-500">Fetching data from Wix.</p>);
};

const ShieldIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
  </svg>
);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
