import { 
  users, 
  schools, 
  students, 
  results, 
  pins, 
  pinRequests,
  classes,
  subjects,
  teacherAssignments,
  auditLogs,
  scoreMetrics,
  classSubjects,
  notifications,
  type User, 
  type InsertUser,
  type School,
  type InsertSchool,
  type Student,
  type InsertStudent,
  type Result,
  type InsertResult,
  type PIN,
  type InsertPIN,
  type PINRequest,
  type CreatePINRequest,
  type Class,
  type InsertClass,
  type Subject,
  type InsertSubject,
  type InsertAuditLog,
  type ScoreMetric,
  type InsertScoreMetric,
  type ClassSubject,
  type InsertClassSubject,
  type Notification,
  type InsertNotification,
  type TeacherAssignment,
  type InsertTeacherAssignment,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User>;
  listUsers(schoolId?: string): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  // Schools
  getSchool(id: string): Promise<School | undefined>;
  getSchoolByCode(code: string): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: string, data: Partial<InsertSchool>): Promise<School>;
  listSchools(): Promise<School[]>;
  deleteSchool(id: string): Promise<void>;

  // Students
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByAdmissionNumber(admissionNumber: string, schoolId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  createStudents(students: InsertStudent[]): Promise<Student[]>;
  updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student>;
  listStudents(schoolId: string): Promise<Student[]>;
  deleteStudent(id: string): Promise<void>;

  // Results
  getResult(id: string): Promise<Result | undefined>;
  getResultByStudentSessionTerm(studentId: string, session: string, term: string): Promise<Result | undefined>;
  createResult(result: InsertResult): Promise<Result>;
  createResults(results: InsertResult[]): Promise<Result[]>;
  updateResult(id: string, data: Partial<InsertResult>): Promise<Result>;
  listResults(schoolId: string, filters?: { status?: string; session?: string; term?: string }): Promise<Result[]>;
  deleteResult(id: string): Promise<void>;

  // PINs
  getPin(pin: string): Promise<PIN | undefined>;
  getPinById(id: string): Promise<PIN | undefined>;
  createPins(pins: InsertPIN[]): Promise<PIN[]>;
  listPins(schoolId: string): Promise<PIN[]>;
  updatePin(id: string, data: Partial<InsertPIN>): Promise<PIN>;
  deletePin(id: string): Promise<void>;

  // PIN Requests
  getPinRequest(id: string): Promise<PINRequest | undefined>;
  createPinRequest(request: CreatePINRequest): Promise<PINRequest>;
  listPinRequests(schoolId?: string): Promise<PINRequest[]>;
  updatePinRequest(id: string, data: Partial<any>): Promise<PINRequest>;

  // Classes
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, data: Partial<InsertClass>): Promise<Class>;
  listClasses(schoolId: string): Promise<Class[]>;
  deleteClass(id: string, schoolId?: string): Promise<void>;

  // Subjects
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, data: Partial<InsertSubject>): Promise<Subject>;
  listSubjects(schoolId: string): Promise<Subject[]>;
  deleteSubject(id: string, schoolId?: string): Promise<void>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<void>;

  // Score Metrics
  getScoreMetric(id: string): Promise<ScoreMetric | undefined>;
  createScoreMetric(metric: InsertScoreMetric): Promise<ScoreMetric>;
  updateScoreMetric(id: string, data: Partial<InsertScoreMetric>): Promise<ScoreMetric>;
  listScoreMetrics(schoolId: string): Promise<ScoreMetric[]>;
  deleteScoreMetric(id: string): Promise<void>;

  // Class Subjects
  getClassSubjects(classId: string): Promise<ClassSubject[]>;
  setClassSubjects(schoolId: string, classId: string, subjectIds: string[]): Promise<ClassSubject[]>;
  deleteClassSubjects(classId: string): Promise<void>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  listNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<Notification>;
  markAllNotificationsRead(userId: string): Promise<void>;
  countUnreadNotifications(userId: string): Promise<number>;

  // Teacher Assignments (enhanced)
  getTeacherAssignments(teacherId: string): Promise<TeacherAssignment[]>;
  createTeacherAssignment(assignment: InsertTeacherAssignment): Promise<TeacherAssignment>;
  deleteTeacherAssignment(id: string): Promise<void>;
  setTeacherAssignments(schoolId: string, teacherId: string, assignments: { classId: string; subjectId: string }[]): Promise<TeacherAssignment[]>;

  // Analytics
  getDashboardStats(userId: string, role: string, schoolId?: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async listUsers(schoolId?: string): Promise<User[]> {
    if (schoolId) {
      return await db.select().from(users).where(eq(users.schoolId, schoolId));
    }
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Schools
  async getSchool(id: string): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school || undefined;
  }

  async getSchoolByCode(code: string): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.code, code));
    return school || undefined;
  }

  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const [school] = await db.insert(schools).values(insertSchool).returning();
    return school;
  }

  async updateSchool(id: string, data: Partial<InsertSchool>): Promise<School> {
    const [school] = await db.update(schools)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schools.id, id))
      .returning();
    return school;
  }

  async listSchools(): Promise<School[]> {
    return await db.select().from(schools).orderBy(desc(schools.createdAt));
  }

  async deleteSchool(id: string): Promise<void> {
    await db.delete(schools).where(eq(schools.id, id));
  }

  // Students
  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByAdmissionNumber(admissionNumber: string, schoolId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students)
      .where(and(eq(students.admissionNumber, admissionNumber), eq(students.schoolId, schoolId)));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async createStudents(insertStudents: InsertStudent[]): Promise<Student[]> {
    if (insertStudents.length === 0) return [];
    return await db.insert(students).values(insertStudents).returning();
  }

  async updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student> {
    const [student] = await db.update(students)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async listStudents(schoolId: string): Promise<Student[]> {
    return await db.select().from(students)
      .where(eq(students.schoolId, schoolId))
      .orderBy(desc(students.createdAt));
  }

  async deleteStudent(id: string): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // Results
  async getResult(id: string): Promise<Result | undefined> {
    const [result] = await db.select().from(results).where(eq(results.id, id));
    return result || undefined;
  }

  async getResultByStudentSessionTerm(studentId: string, session: string, term: string): Promise<Result | undefined> {
    const [result] = await db.select().from(results)
      .where(and(
        eq(results.studentId, studentId),
        eq(results.session, session),
        eq(results.term, term)
      ));
    return result || undefined;
  }

  async createResult(insertResult: InsertResult): Promise<Result> {
    const [result] = await db.insert(results).values(insertResult).returning();
    return result;
  }

  async createResults(insertResults: InsertResult[]): Promise<Result[]> {
    if (insertResults.length === 0) return [];
    return await db.insert(results).values(insertResults).returning();
  }

  async updateResult(id: string, data: Partial<InsertResult>): Promise<Result> {
    const [result] = await db.update(results)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(results.id, id))
      .returning();
    return result;
  }

  async listResults(schoolId: string, filters?: { status?: string; session?: string; term?: string }): Promise<Result[]> {
    const conditions = [eq(results.schoolId, schoolId)];
    
    if (filters?.status) {
      conditions.push(eq(results.status, filters.status));
    }
    if (filters?.session) {
      conditions.push(eq(results.session, filters.session));
    }
    if (filters?.term) {
      conditions.push(eq(results.term, filters.term));
    }
    
    return await db.select().from(results)
      .where(and(...conditions))
      .orderBy(desc(results.createdAt));
  }

  async deleteResult(id: string): Promise<void> {
    await db.delete(results).where(eq(results.id, id));
  }

  // PINs
  async getPin(pin: string): Promise<PIN | undefined> {
    const [pinRecord] = await db.select().from(pins).where(eq(pins.pin, pin));
    return pinRecord || undefined;
  }

  async getPinById(id: string): Promise<PIN | undefined> {
    const [pin] = await db.select().from(pins).where(eq(pins.id, id));
    return pin || undefined;
  }

  async createPins(insertPins: InsertPIN[]): Promise<PIN[]> {
    return await db.insert(pins).values(insertPins).returning();
  }

  async listPins(schoolId: string): Promise<PIN[]> {
    return await db.select().from(pins)
      .where(eq(pins.schoolId, schoolId))
      .orderBy(desc(pins.createdAt));
  }

  async updatePin(id: string, data: Partial<InsertPIN>): Promise<PIN> {
    const [pin] = await db.update(pins)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pins.id, id))
      .returning();
    return pin;
  }

  async deletePin(id: string): Promise<void> {
    await db.delete(pins).where(eq(pins.id, id));
  }

  // PIN Requests
  async getPinRequest(id: string): Promise<PINRequest | undefined> {
    const [request] = await db.select().from(pinRequests).where(eq(pinRequests.id, id));
    return request || undefined;
  }

  async createPinRequest(request: CreatePINRequest): Promise<PINRequest> {
    const [pinRequest] = await db.insert(pinRequests).values(request).returning();
    return pinRequest;
  }

  async listPinRequests(schoolId?: string): Promise<PINRequest[]> {
    if (schoolId) {
      return await db.select().from(pinRequests)
        .where(eq(pinRequests.schoolId, schoolId))
        .orderBy(desc(pinRequests.createdAt));
    }
    return await db.select().from(pinRequests).orderBy(desc(pinRequests.createdAt));
  }

  async updatePinRequest(id: string, data: Partial<any>): Promise<PINRequest> {
    const [request] = await db.update(pinRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pinRequests.id, id))
      .returning();
    return request;
  }

  // Classes
  async getClass(id: string): Promise<Class | undefined> {
    const [classRecord] = await db.select().from(classes).where(eq(classes.id, id));
    return classRecord || undefined;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [classRecord] = await db.insert(classes).values(classData).returning();
    return classRecord;
  }

  async updateClass(id: string, data: Partial<InsertClass>): Promise<Class> {
    const [classRecord] = await db.update(classes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return classRecord;
  }

  async listClasses(schoolId: string): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.schoolId, schoolId));
  }

  async deleteClass(id: string, schoolId?: string): Promise<void> {
    if (schoolId) {
      await db.delete(classes).where(and(eq(classes.id, id), eq(classes.schoolId, schoolId)));
    } else {
      await db.delete(classes).where(eq(classes.id, id));
    }
  }

  // Subjects
  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [subjectRecord] = await db.insert(subjects).values(subject).returning();
    return subjectRecord;
  }

  async updateSubject(id: string, data: Partial<InsertSubject>): Promise<Subject> {
    const [subjectRecord] = await db.update(subjects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subjects.id, id))
      .returning();
    return subjectRecord;
  }

  async listSubjects(schoolId: string): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.schoolId, schoolId));
  }

  async deleteSubject(id: string, schoolId?: string): Promise<void> {
    if (schoolId) {
      await db.delete(subjects).where(and(eq(subjects.id, id), eq(subjects.schoolId, schoolId)));
    } else {
      await db.delete(subjects).where(eq(subjects.id, id));
    }
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<void> {
    await db.insert(auditLogs).values(log);
  }

  // Analytics
  async getDashboardStats(userId: string, role: string, schoolId?: string): Promise<any> {
    if (role === "super_admin") {
      const [schoolsCount] = await db.select({ count: sql<number>`count(*)` }).from(schools);
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [studentsCount] = await db.select({ count: sql<number>`count(*)` }).from(students);
      const [resultsCount] = await db.select({ count: sql<number>`count(*)` }).from(results);

      return {
        totalSchools: Number(schoolsCount.count),
        totalUsers: Number(usersCount.count),
        totalStudents: Number(studentsCount.count),
        totalResults: Number(resultsCount.count),
      };
    } else if (role === "school_admin" && schoolId) {
      const [studentsCount] = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.schoolId, schoolId));
      const [teachersCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher")));
      const [resultsCount] = await db.select({ count: sql<number>`count(*)` }).from(results).where(eq(results.schoolId, schoolId));
      const [pinsCount] = await db.select({ count: sql<number>`count(*)` }).from(pins).where(eq(pins.schoolId, schoolId));
      const [usedPinsCount] = await db.select({ count: sql<number>`count(*)` }).from(pins).where(and(eq(pins.schoolId, schoolId), eq(pins.isUsed, true)));
      const [unusedPinsCount] = await db.select({ count: sql<number>`count(*)` }).from(pins).where(and(eq(pins.schoolId, schoolId), eq(pins.isUsed, false)));
      const [pendingResults] = await db.select({ count: sql<number>`count(*)` }).from(results).where(and(eq(results.schoolId, schoolId), eq(results.status, "submitted")));
      const [approvedResults] = await db.select({ count: sql<number>`count(*)` }).from(results).where(and(eq(results.schoolId, schoolId), eq(results.status, "approved")));
      const [pendingPinRequests] = await db.select({ count: sql<number>`count(*)` }).from(pinRequests).where(and(eq(pinRequests.schoolId, schoolId), eq(pinRequests.status, "pending")));

      return {
        totalStudents: Number(studentsCount.count),
        totalUsers: Number(teachersCount.count),
        totalResults: Number(resultsCount.count),
        totalPins: Number(pinsCount.count),
        usedPins: Number(usedPinsCount.count),
        unusedPins: Number(unusedPinsCount.count),
        pendingResults: Number(pendingResults.count),
        approvedResults: Number(approvedResults.count),
        pendingPinRequests: Number(pendingPinRequests.count),
      };
    } else if (role === "teacher" && schoolId) {
      const [studentsCount] = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.schoolId, schoolId));
      const [resultsCount] = await db.select({ count: sql<number>`count(*)` }).from(results).where(and(eq(results.schoolId, schoolId), eq(results.uploadedBy, userId)));
      const [pendingResults] = await db.select({ count: sql<number>`count(*)` }).from(results).where(and(eq(results.schoolId, schoolId), eq(results.uploadedBy, userId), eq(results.status, "submitted")));

      return {
        totalStudents: Number(studentsCount.count),
        totalResults: Number(resultsCount.count),
        pendingResults: Number(pendingResults.count),
      };
    }

    return {};
  }

  // Score Metrics
  async getScoreMetric(id: string): Promise<ScoreMetric | undefined> {
    const [metric] = await db.select().from(scoreMetrics).where(eq(scoreMetrics.id, id));
    return metric || undefined;
  }

  async createScoreMetric(metric: InsertScoreMetric): Promise<ScoreMetric> {
    const [metricRecord] = await db.insert(scoreMetrics).values(metric).returning();
    return metricRecord;
  }

  async updateScoreMetric(id: string, data: Partial<InsertScoreMetric>): Promise<ScoreMetric> {
    const [metricRecord] = await db.update(scoreMetrics)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scoreMetrics.id, id))
      .returning();
    return metricRecord;
  }

  async listScoreMetrics(schoolId: string): Promise<ScoreMetric[]> {
    return await db.select()
      .from(scoreMetrics)
      .where(and(eq(scoreMetrics.schoolId, schoolId), eq(scoreMetrics.isActive, true)))
      .orderBy(scoreMetrics.order);
  }

  async deleteScoreMetric(id: string): Promise<void> {
    await db.update(scoreMetrics)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(scoreMetrics.id, id));
  }

  // Class Subjects
  async getClassSubjects(classId: string): Promise<ClassSubject[]> {
    return await db.select().from(classSubjects).where(eq(classSubjects.classId, classId));
  }

  async setClassSubjects(schoolId: string, classId: string, subjectIds: string[]): Promise<ClassSubject[]> {
    await db.delete(classSubjects).where(eq(classSubjects.classId, classId));
    
    if (subjectIds.length === 0) return [];
    
    const newRecords = subjectIds.map(subjectId => ({
      schoolId,
      classId,
      subjectId,
    }));
    
    return await db.insert(classSubjects).values(newRecords).returning();
  }

  async deleteClassSubjects(classId: string): Promise<void> {
    await db.delete(classSubjects).where(eq(classSubjects.classId, classId));
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [record] = await db.insert(notifications).values(notification).returning();
    return record;
  }

  async listNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationRead(id: string): Promise<Notification> {
    const [record] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return record;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async countUnreadNotifications(userId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result.count);
  }

  // Teacher Assignments (enhanced)
  async getTeacherAssignments(teacherId: string): Promise<TeacherAssignment[]> {
    return await db.select().from(teacherAssignments).where(eq(teacherAssignments.teacherId, teacherId));
  }

  async createTeacherAssignment(assignment: InsertTeacherAssignment): Promise<TeacherAssignment> {
    const [record] = await db.insert(teacherAssignments).values(assignment).returning();
    return record;
  }

  async deleteTeacherAssignment(id: string): Promise<void> {
    await db.delete(teacherAssignments).where(eq(teacherAssignments.id, id));
  }

  async setTeacherAssignments(schoolId: string, teacherId: string, assignments: { classId: string; subjectId: string }[]): Promise<TeacherAssignment[]> {
    await db.delete(teacherAssignments).where(eq(teacherAssignments.teacherId, teacherId));
    
    if (assignments.length === 0) return [];
    
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}/${currentYear + 1}`;
    
    const newRecords = assignments.map(a => ({
      schoolId,
      teacherId,
      classId: a.classId,
      subjectId: a.subjectId,
      academicYear,
    }));
    
    return await db.insert(teacherAssignments).values(newRecords).returning();
  }
}

export const storage = new DatabaseStorage();

