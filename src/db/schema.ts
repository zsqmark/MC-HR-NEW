import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';

// Define the 'users' table using Firebase Auth UID as required by Cloud SQL setup
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('staff'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'staff_members' table
export const staffMembers = pgTable('staff_members', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').default(''),
  role: text('role').default('staff'),
  position: text('position').default('Wait Staff'),
  hourlyRate: doublePrecision('hourly_rate').default(26.5),
  onboardingStatus: text('onboarding_status').default('approved'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'shift_slots' table
export const shiftSlots = pgTable('shift_slots', {
  id: text('id').primaryKey(),
  day: text('day').notNull(),
  dateStr: text('date_str').notNull(),
  shiftType: text('shift_type').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  assignedStaffId: text('assigned_staff_id'),
  roleRequired: text('role_required').default('Wait Staff'),
  status: text('status').default('published'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'clock_records' table
export const clockRecords = pgTable('clock_records', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull(),
  staffName: text('staff_name').notNull(),
  position: text('position').notNull(),
  date: text('date').notNull(),
  shiftType: text('shift_type').notNull(),
  clockInTime: text('clock_in_time').notNull(),
  clockOutTime: text('clock_out_time'),
  breakMinutes: integer('break_minutes').default(0),
  totalHours: doublePrecision('total_hours'),
  status: text('status').default('completed'),
  hourlyRate: doublePrecision('hourly_rate').default(26.5),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  staff: many(staffMembers),
}));

export const staffMembersRelations = relations(staffMembers, ({ one }) => ({
  user: one(users, {
    fields: [staffMembers.userId],
    references: [users.id],
  }),
}));
