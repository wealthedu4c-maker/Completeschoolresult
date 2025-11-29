import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, authorize, JWT_SECRET, type AuthRequest } from "./middleware/auth";
import { calculateResults, generatePIN } from "./utils/result-calculator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertSchoolSchema, insertStudentSchema, insertResultSchema, insertPinSchema, insertPinRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== AUTHENTICATION ROUTES =====
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      await storage.updateUser(user.id, { lastLogin: new Date() });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, schoolId: user.schoolId },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      const { password: _, ...userWithoutPassword } = user;

      res.json({ token, user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/register", authenticate, authorize("super_admin", "school_admin"), async (req: AuthRequest, res) => {
    try {
      const validated = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(validated.password, 10);

      const user = await storage.createUser({
        ...validated,
        password: hashedPassword,
        createdBy: req.user!.id,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== SCHOOLS ROUTES =====
  app.get("/api/schools", authenticate, authorize("super_admin"), async (req, res) => {
    try {
      const schools = await storage.listSchools();
      res.json(schools);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/schools", authenticate, authorize("super_admin"), async (req: AuthRequest, res) => {
    try {
      const validated = insertSchoolSchema.parse(req.body);
      const school = await storage.createSchool({
        ...validated,
        createdBy: req.user!.id,
      });
      res.status(201).json(school);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/schools/:id", authenticate, authorize("super_admin"), async (req, res) => {
    try {
      const school = await storage.updateSchool(req.params.id, req.body);
      res.json(school);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/schools/:id", authenticate, authorize("super_admin"), async (req, res) => {
    try {
      await storage.deleteSchool(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== STUDENTS ROUTES =====
  app.get("/api/students", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.schoolId && req.user!.role !== "super_admin") {
        return res.status(403).json({ message: "School association required" });
      }

      const schoolId = req.user!.role === "super_admin" 
        ? req.query.schoolId as string
        : req.user!.schoolId!;

      if (!schoolId) {
        return res.status(400).json({ message: "School ID required" });
      }
      
      const students = await storage.listStudents(schoolId);
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/students", authenticate, authorize("school_admin", "teacher"), async (req: AuthRequest, res) => {
    try {
      const validated = insertStudentSchema.parse(req.body);
      
      // Ensure student belongs to user's school
      if (validated.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Cannot create students for other schools" });
      }

      const student = await storage.createStudent(validated);
      res.status(201).json(student);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/students/:id", authenticate, authorize("school_admin", "teacher"), async (req: AuthRequest, res) => {
    try {
      const existing = await storage.getStudent(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Verify student belongs to user's school
      if (existing.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Cannot update students from other schools" });
      }

      const student = await storage.updateStudent(req.params.id, req.body);
      res.json(student);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/students/:id", authenticate, authorize("school_admin"), async (req: AuthRequest, res) => {
    try {
      const existing = await storage.getStudent(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Verify student belongs to user's school
      if (existing.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Cannot delete students from other schools" });
      }

      await storage.deleteStudent(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== RESULTS ROUTES =====
  app.get("/api/results", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.schoolId && req.user!.role !== "super_admin") {
        return res.status(403).json({ message: "School association required" });
      }

      const schoolId = req.user!.role === "super_admin" 
        ? req.query.schoolId as string
        : req.user!.schoolId!;

      if (!schoolId) {
        return res.status(400).json({ message: "School ID required" });
      }

      const filters = {
        status: req.query.status as string,
        session: req.query.session as string,
        term: req.query.term as string,
      };

      const results = await storage.listResults(schoolId, filters);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/results", authenticate, authorize("teacher"), async (req: AuthRequest, res) => {
    try {
      const validated = insertResultSchema.parse(req.body);

      // Verify result belongs to user's school
      if (validated.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Cannot create results for other schools" });
      }

      // Verify student belongs to same school
      const student = await storage.getStudent(validated.studentId);
      if (!student || student.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Student not found or belongs to another school" });
      }
      
      // Auto-calculate grades and totals
      const calculated = calculateResults(validated.subjects);

      const result = await storage.createResult({
        ...validated,
        subjects: calculated.subjects,
        totalScore: String(calculated.totalScore),
        averageScore: String(calculated.averageScore),
        status: "draft",
        uploadedBy: req.user!.id,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/results/:id/submit", authenticate, authorize("teacher"), async (req: AuthRequest, res) => {
    try {
      const existing = await storage.getResult(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Result not found" });
      }

      // Verify result belongs to user's school
      if (existing.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Cannot submit results from other schools" });
      }

      // Verify result is in draft status
      if (existing.status !== "draft") {
        return res.status(400).json({ message: "Only draft results can be submitted" });
      }

      const result = await storage.updateResult(req.params.id, { status: "submitted" });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/results/:id/approve", authenticate, authorize("school_admin"), async (req: AuthRequest, res) => {
    try {
      const existing = await storage.getResult(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Result not found" });
      }

      // Verify result belongs to user's school
      if (existing.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Cannot approve results from other schools" });
      }

      // Prevent users from approving their own submissions
      if (existing.uploadedBy === req.user!.id) {
        return res.status(403).json({ message: "Cannot approve your own results" });
      }

      // Verify result is in submitted status
      if (existing.status !== "submitted") {
        return res.status(400).json({ message: "Only submitted results can be approved" });
      }

      const result = await storage.updateResult(req.params.id, {
        status: "approved",
        approvedBy: req.user!.id,
        approvedAt: new Date(),
      });

      // Create audit log
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "approve_result",
        resource: "result",
        resourceId: req.params.id,
        details: { resultId: req.params.id, studentId: existing.studentId },
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/results/:id/reject", authenticate, authorize("school_admin"), async (req: AuthRequest, res) => {
    try {
      const existing = await storage.getResult(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Result not found" });
      }

      // Verify result belongs to user's school
      if (existing.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Cannot reject results from other schools" });
      }

      // Prevent users from rejecting their own submissions
      if (existing.uploadedBy === req.user!.id) {
        return res.status(403).json({ message: "Cannot reject your own results" });
      }

      // Verify result is in submitted status
      if (existing.status !== "submitted") {
        return res.status(400).json({ message: "Only submitted results can be rejected" });
      }

      const result = await storage.updateResult(req.params.id, {
        status: "rejected",
        rejectionReason: req.body.reason,
      });

      // Create audit log
      await storage.createAuditLog({
        userId: req.user!.id,
        action: "reject_result",
        resource: "result",
        resourceId: req.params.id,
        details: { resultId: req.params.id, studentId: existing.studentId, reason: req.body.reason },
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ===== PINS ROUTES =====
  app.get("/api/pins", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.schoolId && req.user!.role !== "super_admin") {
        return res.status(403).json({ message: "School association required" });
      }

      const schoolId = req.user!.role === "super_admin"
        ? req.query.schoolId as string
        : req.user!.schoolId!;

      if (!schoolId) {
        return res.status(400).json({ message: "School ID required" });
      }

      const pins = await storage.listPins(schoolId);
      res.json(pins);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/pins", authenticate, authorize("super_admin", "school_admin"), async (req: AuthRequest, res) => {
    try {
      const { quantity, session, term, schoolId } = req.body;
      const targetSchoolId = req.user!.role === "super_admin" ? schoolId : req.user!.schoolId!;

      const pinsToCreate = [];
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 months expiry

      for (let i = 0; i < quantity; i++) {
        pinsToCreate.push({
          schoolId: targetSchoolId,
          pin: generatePIN(),
          session,
          term,
          expiryDate,
          generatedBy: req.user!.id,
        });
      }

      const pins = await storage.createPins(pinsToCreate);
      res.status(201).json(pins);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/pins/:id", authenticate, authorize("super_admin", "school_admin"), async (req: AuthRequest, res) => {
    try {
      const existing = await storage.getPinById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "PIN not found" });
      }

      // Verify PIN belongs to user's school (except super admin)
      if (req.user!.role !== "super_admin" && existing.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Cannot delete PINs from other schools" });
      }

      await storage.deletePin(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== PIN REQUESTS ROUTES =====
  app.get("/api/pin-requests", authenticate, async (req: AuthRequest, res) => {
    try {
      const schoolId = req.user!.role === "super_admin" ? undefined : req.user!.schoolId;
      const requests = await storage.listPinRequests(schoolId);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/pin-requests", authenticate, authorize("school_admin"), async (req: AuthRequest, res) => {
    try {
      const validated = insertPinRequestSchema.parse(req.body);
      const request = await storage.createPinRequest({
        ...validated,
        schoolId: req.user!.schoolId!,
        requestedBy: req.user!.id,
      });
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ===== PUBLIC ROUTES =====
  app.post("/api/public/check-result", async (req, res) => {
    try {
      const { pin, admissionNumber } = req.body;

      const pinRecord = await storage.getPin(pin.toUpperCase());
      if (!pinRecord) {
        return res.status(404).json({ message: "Invalid PIN" });
      }

      if (pinRecord.isUsed) {
        return res.status(400).json({ message: "PIN has already been used" });
      }

      if (new Date() > new Date(pinRecord.expiryDate)) {
        return res.status(400).json({ message: "PIN has expired" });
      }

      // Find student by admission number and school
      const students = await storage.listStudents(pinRecord.schoolId);
      const student = students.find(s => s.admissionNumber.toUpperCase() === admissionNumber.toUpperCase());

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Find result
      const results = await storage.listResults(pinRecord.schoolId, {
        session: pinRecord.session,
        term: pinRecord.term,
        status: "approved",
      });

      const result = results.find(r => r.studentId === student.id);
      if (!result) {
        return res.status(404).json({ message: "No result found for this student" });
      }

      // Mark PIN as used
      await storage.updatePin(pinRecord.id, {
        isUsed: true,
        usedBy: {
          admissionNumber: student.admissionNumber,
          studentName: `${student.firstName} ${student.lastName}`,
          usedAt: new Date(),
          ipAddress: req.ip,
        },
      });

      // Get school details
      const school = await storage.getSchool(pinRecord.schoolId);

      res.json({
        student: {
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNumber: student.admissionNumber,
          class: student.class,
        },
        school: {
          name: school?.name,
          logo: school?.logo,
          motto: school?.motto,
        },
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== ANALYTICS ROUTES =====
  app.get("/api/analytics/dashboard", authenticate, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getDashboardStats(
        req.user!.id,
        req.user!.role,
        req.user!.schoolId
      );
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== USERS ROUTES =====
  app.get("/api/users", authenticate, authorize("super_admin", "school_admin"), async (req: AuthRequest, res) => {
    try {
      const schoolId = req.user!.role === "super_admin" ? undefined : req.user!.schoolId;
      const users = await storage.listUsers(schoolId);
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", authenticate, authorize("super_admin", "school_admin"), async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // School admins can only update users from their school
      if (req.user!.role === "school_admin" && user.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Cannot update users from other schools" });
      }

      const updated = await storage.updateUser(req.params.id, req.body);
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ===== CLASSES ROUTES =====
  app.get("/api/classes", authenticate, async (req: AuthRequest, res) => {
    try {
      const schoolId = req.user!.role === "super_admin"
        ? req.query.schoolId as string
        : req.user!.schoolId!;
      const classes = await storage.listClasses(schoolId);
      res.json(classes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/classes", authenticate, authorize("school_admin"), async (req: AuthRequest, res) => {
    try {
      const classRecord = await storage.createClass({
        ...req.body,
        schoolId: req.user!.schoolId!,
        createdBy: req.user!.id,
      });
      res.status(201).json(classRecord);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/classes/:id", authenticate, authorize("school_admin", "super_admin"), async (req: AuthRequest, res) => {
    try {
      // Verify class belongs to user's school for school admins
      const classRecord = await storage.getClass(req.params.id);
      if (!classRecord) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      if (req.user!.role === "school_admin" && classRecord.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Cannot delete classes from other schools" });
      }
      
      // Use schoolId-scoped delete for extra security
      const schoolIdToCheck = req.user!.role === "school_admin" ? req.user!.schoolId : undefined;
      await storage.deleteClass(req.params.id, schoolIdToCheck);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== SUBJECTS ROUTES =====
  app.get("/api/subjects", authenticate, async (req: AuthRequest, res) => {
    try {
      const schoolId = req.user!.role === "super_admin"
        ? req.query.schoolId as string
        : req.user!.schoolId!;
      const subjects = await storage.listSubjects(schoolId);
      res.json(subjects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/subjects", authenticate, authorize("school_admin"), async (req: AuthRequest, res) => {
    try {
      const subject = await storage.createSubject({
        ...req.body,
        schoolId: req.user!.schoolId!,
        createdBy: req.user!.id,
      });
      res.status(201).json(subject);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/subjects/:id", authenticate, authorize("school_admin", "super_admin"), async (req: AuthRequest, res) => {
    try {
      // Verify subject belongs to user's school for school admins
      const subject = await storage.getSubject(req.params.id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      if (req.user!.role === "school_admin" && subject.schoolId !== req.user!.schoolId) {
        return res.status(403).json({ message: "Cannot delete subjects from other schools" });
      }
      
      // Use schoolId-scoped delete for extra security
      const schoolIdToCheck = req.user!.role === "school_admin" ? req.user!.schoolId : undefined;
      await storage.deleteSubject(req.params.id, schoolIdToCheck);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== PIN REQUEST APPROVAL ROUTES =====
  app.post("/api/pin-requests/:id/approve", authenticate, authorize("super_admin"), async (req: AuthRequest, res) => {
    try {
      const request = await storage.getPinRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "PIN request not found" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ message: "Request has already been processed" });
      }

      // Generate PINs for the approved request
      const pinsToCreate = [];
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);

      for (let i = 0; i < request.quantity; i++) {
        pinsToCreate.push({
          schoolId: request.schoolId,
          pin: generatePIN(),
          session: request.session,
          term: request.term,
          expiryDate,
          generatedBy: req.user!.id,
        });
      }

      const pins = await storage.createPins(pinsToCreate);

      // Update request status
      const updated = await storage.updatePinRequest(req.params.id, {
        status: "approved",
        processedBy: req.user!.id,
        processedAt: new Date(),
        generatedPinIds: pins.map(p => p.id),
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/pin-requests/:id/reject", authenticate, authorize("super_admin"), async (req: AuthRequest, res) => {
    try {
      const request = await storage.getPinRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "PIN request not found" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ message: "Request has already been processed" });
      }

      const updated = await storage.updatePinRequest(req.params.id, {
        status: "rejected",
        processedBy: req.user!.id,
        processedAt: new Date(),
        rejectionReason: req.body.reason,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ===== PUBLIC ROUTES =====
  
  // Public result checking with PIN
  app.post("/api/public/check-result", async (req, res) => {
    try {
      const { pin, admissionNumber } = req.body;

      if (!pin || !admissionNumber) {
        return res.status(400).json({ message: "PIN and admission number are required" });
      }

      // Find the PIN
      const pinRecord = await storage.getPin(pin.toUpperCase());
      if (!pinRecord) {
        return res.status(404).json({ message: "Invalid PIN" });
      }

      // Check if PIN is expired
      if (pinRecord.expiryDate && new Date(pinRecord.expiryDate) < new Date()) {
        return res.status(400).json({ message: "This PIN has expired" });
      }

      // Check if PIN has reached max attempts
      const attempts = Array.isArray(pinRecord.attempts) ? pinRecord.attempts : [];
      if (pinRecord.maxAttempts && attempts.length >= pinRecord.maxAttempts) {
        return res.status(400).json({ message: "This PIN has reached its maximum usage limit" });
      }

      // Find the student
      const student = await storage.getStudentByAdmissionNumber(
        admissionNumber.toUpperCase(), 
        pinRecord.schoolId
      );

      if (!student) {
        // Log failed attempt
        const currentAttempts = Array.isArray(pinRecord.attempts) ? pinRecord.attempts : [];
        await storage.updatePin(pinRecord.id, { 
          attempts: [...currentAttempts, { type: "failed", admissionNumber, timestamp: new Date().toISOString() }]
        });
        return res.status(404).json({ message: "Student not found with this admission number" });
      }

      // Find the result for this student, session, and term
      const result = await storage.getResultByStudentSessionTerm(
        student.id,
        pinRecord.session,
        pinRecord.term
      );

      if (!result) {
        return res.status(404).json({ 
          message: `No result found for ${pinRecord.session} ${pinRecord.term} Term` 
        });
      }

      // Check if result is approved
      if (result.status !== "approved") {
        return res.status(400).json({ message: "This result has not been approved yet" });
      }

      // Get school info
      const school = await storage.getSchool(pinRecord.schoolId);

      // Update PIN usage
      const currentAttempts = Array.isArray(pinRecord.attempts) ? pinRecord.attempts : [];
      await storage.updatePin(pinRecord.id, { 
        isUsed: true,
        attempts: [...currentAttempts, { type: "success", admissionNumber: student.admissionNumber, studentId: student.id, timestamp: new Date().toISOString() }],
        usedBy: { admissionNumber: student.admissionNumber, studentName: `${student.firstName} ${student.lastName}`, usedAt: new Date().toISOString() },
      });

      // Return the result data
      res.json({
        student: {
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNumber: student.admissionNumber,
          class: student.class,
        },
        school: {
          name: school?.name || "Unknown School",
          logo: school?.logo,
          motto: school?.motto,
        },
        session: result.session,
        term: result.term,
        subjects: result.subjects,
        totalScore: result.totalScore,
        averageScore: result.averageScore,
        position: result.position,
        totalStudents: result.totalStudents,
        teacherComment: result.teacherComment,
        principalComment: result.principalComment,
        attendance: result.attendance,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Public school registration (for school admins to register themselves)
  const publicRegisterSchema = z.object({
    schoolName: z.string().min(1, "School name is required"),
    schoolCode: z.string().min(1, "School code is required").toUpperCase(),
    schoolEmail: z.string().email("Valid email required"),
    schoolPhone: z.string().optional(),
    schoolAddress: z.string().optional(),
    adminFirstName: z.string().min(1, "First name is required"),
    adminLastName: z.string().min(1, "Last name is required"),
    adminEmail: z.string().email("Valid email required"),
    adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  });

  app.post("/api/public/register-school", async (req, res) => {
    try {
      const validated = publicRegisterSchema.parse(req.body);

      // Check if school code already exists
      const existingSchool = await storage.getSchoolByCode(validated.schoolCode);
      if (existingSchool) {
        return res.status(400).json({ message: "School code already exists" });
      }

      // Check if admin email already exists
      const existingUser = await storage.getUserByEmail(validated.adminEmail);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create the school (pending approval)
      const school = await storage.createSchool({
        name: validated.schoolName,
        code: validated.schoolCode,
        email: validated.schoolEmail,
        phone: validated.schoolPhone ?? "",
        address: validated.schoolAddress ?? "",
        isActive: false, // Requires super admin approval
      });

      // Hash password and create admin user
      const hashedPassword = await bcrypt.hash(validated.adminPassword, 10);
      const user = await storage.createUser({
        email: validated.adminEmail,
        password: hashedPassword,
        firstName: validated.adminFirstName,
        lastName: validated.adminLastName,
        role: "school_admin",
        schoolId: school.id,
        isActive: false, // Requires super admin approval
      });

      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        message: "Registration successful! Your account is pending approval.",
        school: { id: school.id, name: school.name, code: school.code },
        user: userWithoutPassword,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // ===== BULK UPLOAD ROUTES =====
  
  // Bulk upload students
  app.post("/api/students/bulk", authenticate, authorize("school_admin", "teacher"), async (req: AuthRequest, res) => {
    try {
      const { students: studentData } = req.body;

      if (!Array.isArray(studentData) || studentData.length === 0) {
        return res.status(400).json({ message: "No student data provided" });
      }

      const schoolId = req.user!.schoolId;
      if (!schoolId) {
        return res.status(403).json({ message: "School association required" });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      const validStudents = [];

      for (let i = 0; i < studentData.length; i++) {
        const row = studentData[i];
        try {
          // Check for required fields
          if (!row.admissionNumber || !row.firstName || !row.lastName || !row.gender || !row.class) {
            results.errors.push(`Row ${i + 1}: Missing required fields`);
            results.failed++;
            continue;
          }

          // Check for duplicate admission number
          const existing = await storage.getStudentByAdmissionNumber(
            row.admissionNumber.toUpperCase(),
            schoolId
          );

          if (existing) {
            results.errors.push(`Row ${i + 1}: Admission number ${row.admissionNumber} already exists`);
            results.failed++;
            continue;
          }

          validStudents.push({
            schoolId,
            admissionNumber: row.admissionNumber.toUpperCase(),
            firstName: row.firstName,
            lastName: row.lastName,
            otherNames: row.otherNames || row.middleName || null,
            gender: row.gender,
            class: row.class,
            classArm: row.classArm || null,
            createdBy: req.user!.id,
          });

        } catch (err: any) {
          results.errors.push(`Row ${i + 1}: ${err.message}`);
          results.failed++;
        }
      }

      // Bulk insert valid students
      if (validStudents.length > 0) {
        await storage.createStudents(validStudents);
        results.success = validStudents.length;
      }

      res.json({
        message: `Uploaded ${results.success} students successfully`,
        ...results,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Bulk upload results
  app.post("/api/results/bulk", authenticate, authorize("school_admin", "teacher"), async (req: AuthRequest, res) => {
    try {
      const { results: resultData, session, term } = req.body;

      if (!Array.isArray(resultData) || resultData.length === 0) {
        return res.status(400).json({ message: "No result data provided" });
      }

      if (!session || !term) {
        return res.status(400).json({ message: "Session and term are required" });
      }

      const schoolId = req.user!.schoolId;
      if (!schoolId) {
        return res.status(403).json({ message: "School association required" });
      }

      const uploadResults = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      const validResults = [];

      for (let i = 0; i < resultData.length; i++) {
        const row = resultData[i];
        try {
          // Find student by admission number
          if (!row.admissionNumber) {
            uploadResults.errors.push(`Row ${i + 1}: Missing admission number`);
            uploadResults.failed++;
            continue;
          }

          const student = await storage.getStudentByAdmissionNumber(
            row.admissionNumber.toUpperCase(),
            schoolId
          );

          if (!student) {
            uploadResults.errors.push(`Row ${i + 1}: Student ${row.admissionNumber} not found`);
            uploadResults.failed++;
            continue;
          }

          // Check if result already exists for this student/session/term
          const existingResult = await storage.getResultByStudentSessionTerm(student.id, session, term);
          if (existingResult) {
            uploadResults.errors.push(`Row ${i + 1}: Result already exists for ${row.admissionNumber}`);
            uploadResults.failed++;
            continue;
          }

          // Process subjects - calculate totals and grades
          const subjectsInput = row.subjects?.map((subj: any) => ({
            subject: subj.subject,
            ca1: Number(subj.ca1) || 0,
            ca2: Number(subj.ca2) || 0,
            exam: Number(subj.exam) || 0,
          })) || [];
          
          const calculated = calculateResults(subjectsInput);
          const subjects = calculated.subjects;

          const totalScore = subjects.reduce((sum: number, s: any) => sum + s.total, 0);
          const averageScore = subjects.length > 0 ? totalScore / subjects.length : 0;

          validResults.push({
            schoolId,
            studentId: student.id,
            session,
            term,
            class: student.class,
            subjects,
            totalScore: totalScore.toFixed(2),
            averageScore: averageScore.toFixed(2),
            status: "draft",
            uploadedBy: req.user!.id,
          });

        } catch (err: any) {
          uploadResults.errors.push(`Row ${i + 1}: ${err.message}`);
          uploadResults.failed++;
        }
      }

      // Bulk insert valid results
      if (validResults.length > 0) {
        await storage.createResults(validResults);
        uploadResults.success = validResults.length;
      }

      res.json({
        message: `Uploaded ${uploadResults.success} results successfully`,
        ...uploadResults,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
