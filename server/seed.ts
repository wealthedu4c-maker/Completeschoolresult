import { storage } from "./storage";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    console.log("Starting seed...");

    // Check if super admin already exists
    const existingAdmin = await storage.getUserByEmail("admin@resultchecker.com");
    if (existingAdmin) {
      console.log("Super admin already exists");
      return;
    }

    // Create super admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const superAdmin = await storage.createUser({
      email: "admin@resultchecker.com",
      password: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "super_admin",
      isActive: true,
    });

    console.log("Super admin created successfully:");
    console.log("Email: admin@resultchecker.com");
    console.log("Password: admin123");

    // Create a demo school
    const demoSchool = await storage.createSchool({
      name: "Demo High School",
      code: "DHS001",
      address: "123 Education Street",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      phone: "+234 800 000 0000",
      email: "info@demohighschool.edu.ng",
      motto: "Excellence in Education",
      isActive: true,
      createdBy: superAdmin.id,
    });

    console.log("\nDemo school created:");
    console.log("Name:", demoSchool.name);
    console.log("Code:", demoSchool.code);

    // Create school admin
    const schoolAdminPassword = await bcrypt.hash("admin123", 10);
    const schoolAdmin = await storage.createUser({
      email: "admin@demohighschool.edu.ng",
      password: schoolAdminPassword,
      firstName: "School",
      lastName: "Admin",
      role: "school_admin",
      schoolId: demoSchool.id,
      isActive: true,
      createdBy: superAdmin.id,
    });

    console.log("\nSchool admin created:");
    console.log("Email: admin@demohighschool.edu.ng");
    console.log("Password: admin123");

    // Create a teacher
    const teacherPassword = await bcrypt.hash("teacher123", 10);
    const teacher = await storage.createUser({
      email: "teacher@demohighschool.edu.ng",
      password: teacherPassword,
      firstName: "John",
      lastName: "Teacher",
      role: "teacher",
      schoolId: demoSchool.id,
      isActive: true,
      createdBy: schoolAdmin.id,
    });

    console.log("\nTeacher created:");
    console.log("Email: teacher@demohighschool.edu.ng");
    console.log("Password: teacher123");

    // Create demo students
    const students = [];
    for (let i = 1; i <= 5; i++) {
      const student = await storage.createStudent({
        schoolId: demoSchool.id,
        admissionNumber: `DHS${String(i).padStart(4, '0')}`,
        firstName: `Student${i}`,
        lastName: `Demo`,
        gender: i % 2 === 0 ? "Male" : "Female",
        dateOfBirth: new Date(2010, 0, i),
        class: "SS 1",
        classArm: "A",
        parentName: `Parent ${i}`,
        parentPhone: `+234 800 000 000${i}`,
        parentEmail: `parent${i}@example.com`,
        address: `${i} Student Street, Lagos`,
        isActive: true,
        createdBy: schoolAdmin.id,
      });
      students.push(student);
    }

    console.log(`\n${students.length} demo students created`);

    console.log("\n✓ Seed completed successfully!");
    console.log("\nYou can now login with:");
    console.log("Super Admin: admin@resultchecker.com / admin123");
    console.log("School Admin: admin@demohighschool.edu.ng / admin123");
    console.log("Teacher: teacher@demohighschool.edu.ng / teacher123");

  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
