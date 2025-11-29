import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, jsonb, uuid, decimal, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ===== USERS TABLE =====
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  role: varchar("role", { length: 20 }).notNull(), // 'super_admin', 'school_admin', 'teacher'
  schoolId: uuid("school_id"),
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  schoolRoleIdx: index("users_school_role_idx").on(table.schoolId, table.role),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  createdSchools: many(schools, { relationName: "createdSchools" }),
  createdStudents: many(students, { relationName: "createdStudents" }),
  createdResults: many(results, { relationName: "createdResults" }),
  createdPins: many(pins, { relationName: "createdPins" }),
  pinRequests: many(pinRequests, { relationName: "pinRequests" }),
}));

// ===== SCHOOLS TABLE =====
export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).unique(),
  subdomain: varchar("subdomain", { length: 50 }).unique(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Nigeria"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }).notNull(),
  logo: text("logo"),
  motto: text("motto"),
  isActive: boolean("is_active").default(false).notNull(),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  codeIdx: index("schools_code_idx").on(table.code),
  subdomainIdx: index("schools_subdomain_idx").on(table.subdomain),
  activeIdx: index("schools_active_idx").on(table.isActive),
}));

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  creator: one(users, {
    fields: [schools.createdBy],
    references: [users.id],
    relationName: "createdSchools",
  }),
  users: many(users),
  students: many(students),
  results: many(results),
  pins: many(pins),
  classes: many(classes),
  subjects: many(subjects),
  pinRequests: many(pinRequests),
}));

// ===== STUDENTS TABLE =====
export const students = pgTable("students", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: uuid("school_id").notNull(),
  admissionNumber: varchar("admission_number", { length: 50 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  otherNames: varchar("other_names", { length: 100 }),
  gender: varchar("gender", { length: 10 }).notNull(), // 'Male', 'Female'
  dateOfBirth: timestamp("date_of_birth"), // Optional
  class: varchar("class", { length: 50 }).notNull(),
  classArm: varchar("class_arm", { length: 5 }),
  parentName: varchar("parent_name", { length: 200 }), // Optional
  parentPhone: varchar("parent_phone", { length: 20 }), // Optional
  parentEmail: varchar("parent_email", { length: 255 }),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  schoolAdmissionIdx: index("students_school_admission_idx").on(table.schoolId, table.admissionNumber),
  schoolClassIdx: index("students_school_class_idx").on(table.schoolId, table.class),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  creator: one(users, {
    fields: [students.createdBy],
    references: [users.id],
    relationName: "createdStudents",
  }),
  results: many(results),
}));

// ===== RESULTS TABLE =====
export const results = pgTable("results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: uuid("school_id").notNull(),
  studentId: uuid("student_id").notNull(),
  session: varchar("session", { length: 20 }).notNull(), // e.g., "2023/2024"
  term: varchar("term", { length: 20 }).notNull(), // 'First', 'Second', 'Third'
  class: varchar("class", { length: 50 }).notNull(),
  subjects: jsonb("subjects").notNull(), // Array of subject scores
  totalScore: decimal("total_score", { precision: 10, scale: 2 }).default("0").notNull(),
  averageScore: decimal("average_score", { precision: 10, scale: 2 }).default("0").notNull(),
  position: integer("position"),
  totalStudents: integer("total_students"),
  teacherComment: text("teacher_comment"),
  principalComment: text("principal_comment"),
  attendance: jsonb("attendance"), // {present: number, absent: number, total: number}
  status: varchar("status", { length: 20 }).default("draft").notNull(), // 'draft', 'submitted', 'approved', 'rejected', 'published'
  publishedAt: timestamp("published_at"),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  uploadedBy: uuid("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  schoolStudentSessionTermIdx: index("results_unique_idx").on(table.schoolId, table.studentId, table.session, table.term),
  schoolSessionTermStatusIdx: index("results_school_session_term_status_idx").on(table.schoolId, table.session, table.term, table.status),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  school: one(schools, {
    fields: [results.schoolId],
    references: [schools.id],
  }),
  student: one(students, {
    fields: [results.studentId],
    references: [students.id],
  }),
  uploader: one(users, {
    fields: [results.uploadedBy],
    references: [users.id],
    relationName: "createdResults",
  }),
}));

// ===== PINS TABLE =====
export const pins = pgTable("pins", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: uuid("school_id").notNull(),
  pin: varchar("pin", { length: 20 }).notNull().unique(),
  session: varchar("session", { length: 20 }).notNull(),
  term: varchar("term", { length: 20 }).notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  usedBy: jsonb("used_by"), // {admissionNumber, studentName, usedAt, ipAddress}
  attempts: jsonb("attempts").default([]), // Array of attempt objects
  maxAttempts: integer("max_attempts").default(3).notNull(),
  maxUsageCount: integer("max_usage_count").default(1).notNull(), // How many times PIN can be used to check results
  usageCount: integer("usage_count").default(0).notNull(), // Current number of times PIN has been used
  expiryDate: timestamp("expiry_date").notNull(),
  generatedBy: uuid("generated_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  pinIdx: index("pins_pin_idx").on(table.pin),
  schoolSessionTermIdx: index("pins_school_session_term_idx").on(table.schoolId, table.session, table.term),
  usedExpiryIdx: index("pins_used_expiry_idx").on(table.isUsed, table.expiryDate),
}));

export const pinsRelations = relations(pins, ({ one }) => ({
  school: one(schools, {
    fields: [pins.schoolId],
    references: [schools.id],
  }),
  generator: one(users, {
    fields: [pins.generatedBy],
    references: [users.id],
    relationName: "createdPins",
  }),
}));

// ===== PIN REQUESTS TABLE =====
export const pinRequests = pgTable("pin_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: uuid("school_id").notNull(),
  requestedBy: uuid("requested_by").notNull(),
  session: varchar("session", { length: 20 }).notNull(),
  term: varchar("term", { length: 20 }).notNull(),
  quantity: integer("quantity").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'approved', 'rejected'
  processedBy: uuid("processed_by"),
  processedAt: timestamp("processed_at"),
  rejectionReason: text("rejection_reason"),
  generatedPinIds: jsonb("generated_pin_ids").default([]), // Array of PIN IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  schoolStatusIdx: index("pin_requests_school_status_idx").on(table.schoolId, table.status),
  statusCreatedIdx: index("pin_requests_status_created_idx").on(table.status, table.createdAt),
}));

export const pinRequestsRelations = relations(pinRequests, ({ one }) => ({
  school: one(schools, {
    fields: [pinRequests.schoolId],
    references: [schools.id],
  }),
  requester: one(users, {
    fields: [pinRequests.requestedBy],
    references: [users.id],
    relationName: "pinRequests",
  }),
}));

// ===== CLASSES TABLE =====
export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: uuid("school_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Primary 1", "JSS 1"
  level: varchar("level", { length: 20 }).notNull(), // 'Primary', 'JSS', 'SS'
  grade: integer("grade").notNull(), // 1-6
  arm: varchar("arm", { length: 5 }),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  capacity: integer("capacity").default(0),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  schoolNameYearIdx: index("classes_school_name_year_idx").on(table.schoolId, table.name, table.academicYear),
}));

export const classesRelations = relations(classes, ({ one }) => ({
  school: one(schools, {
    fields: [classes.schoolId],
    references: [schools.id],
  }),
}));

// ===== SUBJECTS TABLE =====
export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: uuid("school_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  category: varchar("category", { length: 20 }).default("Core").notNull(), // 'Core', 'Elective', 'Vocational'
  description: text("description"),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  schoolCodeIdx: index("subjects_school_code_idx").on(table.schoolId, table.code),
}));

export const subjectsRelations = relations(subjects, ({ one }) => ({
  school: one(schools, {
    fields: [subjects.schoolId],
    references: [schools.id],
  }),
}));

// ===== TEACHER ASSIGNMENTS TABLE =====
export const teacherAssignments = pgTable("teacher_assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: uuid("school_id").notNull(),
  teacherId: uuid("teacher_id").notNull(),
  subjectId: uuid("subject_id").notNull(),
  classId: uuid("class_id").notNull(),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  schoolTeacherIdx: index("assignments_school_teacher_idx").on(table.schoolId, table.teacherId),
}));

export const teacherAssignmentsRelations = relations(teacherAssignments, ({ one }) => ({
  school: one(schools, {
    fields: [teacherAssignments.schoolId],
    references: [schools.id],
  }),
  teacher: one(users, {
    fields: [teacherAssignments.teacherId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [teacherAssignments.subjectId],
    references: [subjects.id],
  }),
  class: one(classes, {
    fields: [teacherAssignments.classId],
    references: [classes.id],
  }),
}));

// ===== SCORE METRICS TABLE =====
export const scoreMetrics = pgTable("score_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: uuid("school_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "CA1", "Assessment", "Project", "Exam"
  maxScore: integer("max_score").notNull(), // Maximum score for this metric
  weight: decimal("weight", { precision: 5, scale: 2 }).default("1").notNull(), // Weight for calculation
  order: integer("order").default(0).notNull(), // Display order
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  schoolOrderIdx: index("score_metrics_school_order_idx").on(table.schoolId, table.order),
}));

export const scoreMetricsRelations = relations(scoreMetrics, ({ one }) => ({
  school: one(schools, {
    fields: [scoreMetrics.schoolId],
    references: [schools.id],
  }),
}));

// ===== CLASS SUBJECTS TABLE (Junction) =====
export const classSubjects = pgTable("class_subjects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: uuid("school_id").notNull(),
  classId: uuid("class_id").notNull(),
  subjectId: uuid("subject_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  classSubjectIdx: index("class_subjects_class_subject_idx").on(table.classId, table.subjectId),
  schoolClassIdx: index("class_subjects_school_class_idx").on(table.schoolId, table.classId),
}));

export const classSubjectsRelations = relations(classSubjects, ({ one }) => ({
  school: one(schools, {
    fields: [classSubjects.schoolId],
    references: [schools.id],
  }),
  class: one(classes, {
    fields: [classSubjects.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [classSubjects.subjectId],
    references: [subjects.id],
  }),
}));

// ===== NOTIFICATIONS TABLE =====
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(), // Target user
  type: varchar("type", { length: 50 }).notNull(), // 'result_submitted', 'result_approved', 'result_rejected', 'pin_request', etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional data (resultId, requestId, etc.)
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userReadIdx: index("notifications_user_read_idx").on(table.userId, table.isRead),
  userCreatedIdx: index("notifications_user_created_idx").on(table.userId, table.createdAt),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ===== AUDIT LOGS TABLE =====
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id"),
  schoolId: uuid("school_id"),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: uuid("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("audit_logs_user_idx").on(table.userId),
  resourceIdx: index("audit_logs_resource_idx").on(table.resource, table.resourceId),
  createdIdx: index("audit_logs_created_idx").on(table.createdAt),
}));

// ===== INSERT SCHEMAS =====
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["super_admin", "school_admin", "teacher"]),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertSchoolSchema = createInsertSchema(schools, {
  name: z.string().min(1),
  code: z.string().min(1).toUpperCase(),
  email: z.string().email(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertStudentSchema = createInsertSchema(students, {
  admissionNumber: z.string().min(1).toUpperCase(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.enum(["Male", "Female"]),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertResultSchema = createInsertSchema(results, {
  session: z.string().min(1),
  term: z.enum(["First", "Second", "Third"]),
  subjects: z.array(z.object({
    subject: z.string(),
    ca1: z.number().min(0).max(10),
    ca2: z.number().min(0).max(10),
    exam: z.number().min(0).max(80),
    total: z.number().optional(),
    grade: z.string().optional(),
    remark: z.string().optional(),
  })),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertPinSchema = createInsertSchema(pins).omit({ id: true, createdAt: true, updatedAt: true });

export const insertPinRequestSchema = createInsertSchema(pinRequests, {
  quantity: z.number().min(1).max(1000),
  session: z.string().min(1),
  term: z.enum(["First", "Second", "Third"]),
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  schoolId: true,
  requestedBy: true,
  processedBy: true,
  processedAt: true,
  rejectionReason: true,
  generatedPinIds: true,
  status: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeacherAssignmentSchema = createInsertSchema(teacherAssignments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertScoreMetricSchema = createInsertSchema(scoreMetrics).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClassSubjectSchema = createInsertSchema(classSubjects).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// ===== TYPES =====
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type PIN = typeof pins.$inferSelect;
export type InsertPIN = z.infer<typeof insertPinSchema>;
export type PINRequest = typeof pinRequests.$inferSelect;
export type InsertPINRequest = z.infer<typeof insertPinRequestSchema>;
export type CreatePINRequest = {
  schoolId: string;
  requestedBy: string;
  session: string;
  term: string;
  quantity: number;
};
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type TeacherAssignment = typeof teacherAssignments.$inferSelect;
export type InsertTeacherAssignment = z.infer<typeof insertTeacherAssignmentSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type ScoreMetric = typeof scoreMetrics.$inferSelect;
export type InsertScoreMetric = z.infer<typeof insertScoreMetricSchema>;
export type ClassSubject = typeof classSubjects.$inferSelect;
export type InsertClassSubject = z.infer<typeof insertClassSubjectSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
