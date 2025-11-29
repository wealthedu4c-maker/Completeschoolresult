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
  type InsertPINRequest,
  type Class,
  type InsertClass,
  type Subject,
  type InsertSubject,
  type InsertAuditLog,
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
  createPinRequest(request: InsertPINRequest): Promise<PINRequest>;
  listPinRequests(schoolId?: string): Promise<PINRequest[]>;
  updatePinRequest(id: string, data: Partial<any>): Promise<PINRequest>;

  // Classes
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  listClasses(schoolId: string): Promise<Class[]>;
  deleteClass(id: string, schoolId?: string): Promise<void>;

  // Subjects
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  listSubjects(schoolId: string): Promise<Subject[]>;
  deleteSubject(id: string, schoolId?: string): Promise<void>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<void>;

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

  async createPinRequest(request: InsertPINRequest): Promise<PINRequest> {
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
}

export const storage = new DatabaseStorage();

