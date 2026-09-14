import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    return (localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) as Role) || 'staff';
  });

  const [currentStaffId, setCurrentStaffId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'staff-john';
  });

  const [currentPage, setCurrentPage] = useState<string>('Homepage');

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF_USERS);
    return saved ? JSON.parse(saved) : INITIAL_STAFF_USERS;
  });

  const [shifts, setShifts] = useState<ShiftSlot[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  const [availabilities, setAvailabilities] = useState<Record<string, StaffWeeklyAvailability>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AVAILABILITIES);
    return saved ? JSON.parse(saved) : INITIAL_AVAILABILITIES;
  });

  const [clockRecords, setClockRecords] = useState<ClockRecord[]>(() => {
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
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    const list: TaskItem[] = saved ? JSON.parse(saved) : INITIAL_TASKS;
    return list.filter((t) => t.id !== 'task-4');
  });

  const [checklists, setChecklists] = useState<ChecklistItem[]>(() => {
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
    const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [onboardingRecords, setOnboardingRecords] = useState<Record<string, OnboardingFormData>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
    return saved ? JSON.parse(saved) : INITIAL_ONBOARDING_DATA;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentStaffId);
  }, [currentStaffId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(staffUsers));
  }, [staffUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(availabilities));
  }, [availabilities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLOCK_RECORDS, JSON.stringify(clockRecords));
  }, [clockRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(checklists));
  }, [checklists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(onboardingRecords));
  }, [onboardingRecords]);

  const activeStaff: StaffUser = staffUsers.find((s) => s.id === currentStaffId) || staffUsers[1];

  // Strict RBAC Enforcement: Staff users can never have currentRole set to 'manager'
  useEffect(() => {
    if (activeStaff.role === 'staff' && currentRole === 'manager') {
      setCurrentRole('staff');
      setCurrentPage('Homepage');
    }
  }, [activeStaff.role, currentRole]);

  const switchRole = (role: Role) => {
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

  const toggleChecklistItem = (itemId: string, tempReading?: string, photos?: string[]) => {
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

  const updateChecklistItemPhotos = (itemId: string, photos: string[]) => {
    setChecklists((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, photos } : item))
    );
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

  const submitOnboardingForm = (staffId: string, data: OnboardingFormData) => {
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
