# SmartResultChecker - School Result Management System

## Overview

SmartResultChecker is a comprehensive web application for managing school results, students, and PIN-based result verification. The system supports multiple user roles (Super Admin, School Admin, Teacher) with role-specific dashboards and permissions. Built with a modern tech stack featuring React frontend, Express backend, and PostgreSQL database with Drizzle ORM.

The application enables schools to digitize their result management workflow: teachers create and submit results, school admins approve them, and students check their results using secure one-time PINs. Super admins manage multiple schools from a central dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Component System**
- Shadcn UI components built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Custom CSS variables for theme management (light/dark mode support)
- Typography system using Inter (primary) and DM Sans (accent) fonts
- Material Design principles with dashboard-focused patterns

**State Management Strategy**
- Local storage for authentication tokens and user session data
- TanStack Query for all server data fetching, caching, and synchronization
- React hooks (useState, useEffect) for local component state
- No global state management library (Redux/Zustand) - server state handled by React Query

**Routing & Navigation**
- Public routes: Landing page, Login, Register (school registration), Check Result (PIN-based)
- Protected routes: Dashboard, Schools, Students, Results, PINs, Teachers, Classes, Subjects, PIN Requests, Users
- Role-based access control with route guards checking localStorage user data
- Dashboard layout wrapper for authenticated pages with sidebar navigation

**Management Pages (Nov 2025)**
- Teachers page: CRUD operations for teacher accounts with status toggle
- Classes page: Create and delete class definitions with level/grade/arm structure
- Subjects page: Create and delete subjects with categories (Core, Elective, Vocational)
- PIN Requests page: School admins request PINs, Super admins approve/reject with reasons
- Users page: Manage all user accounts with role filtering and status management

**Bulk Upload Features (Nov 2025)**
- Student Bulk Upload: CSV file upload with template download, validates and imports multiple students
- Result Bulk Upload: CSV file upload with subject scores, auto-calculates grades and totals
- Components: BulkUploadDialog (students), BulkResultUploadDialog (results)

**Public School Registration (Nov 2025)**
- One-step registration: School name, email, optional logo, password, confirm password
- Creates school with isActive: false (requires super admin approval)
- Creates school_admin user linked to the school
- Route: /register

**Result Approval & Comments (Nov 2025)**
- ResultDetailsDialog: View result details, subject scores, and comments
- Teacher and principal comments on results
- School logo requirement before result approval (enforced backend and frontend)
- `/api/schools/me` endpoint for school admins/teachers to access own school data
- Role-based access control for comment and approval actions

**Score Metrics & Class Subjects (Nov 2025)**
- Score Metrics page: School admins configure grading metrics (maxScore, weight, labels)
- Class Subject Assignment: Assign subjects to classes via Classes page dialog
- Results Workflow: Submit, Approve, Reject, Publish actions with role-based controls
- Enhanced school creation: Simplified form with subdomain, auto-generated code, admin user provisioning

**Teacher Assignments & Result Workflow (Nov 2025)**
- Teacher Assignment UI: School admins assign classes and subjects to teachers via dialog
- Class creation two-step process: Create class details, then assign subjects immediately
- Teacher filtering: Teachers only see results for classes/subjects assigned to them
- Result upload restrictions: Teachers can only upload results for their assigned classes/subjects
- Save Draft vs Submit: Results can be saved as drafts (editable) or submitted (sends notification to school admin)
- Published result protection: Results with "published" status cannot be modified or commented on (enforced at API layer)
- PIN request notifications: Super admins automatically notified when school admins request PINs

**Super Admin Features (Nov 2025)**
- School Activation/Deactivation: Toggle school status from the Schools management page
- Direct PIN Generation: Super admins can generate PINs for any school with configurable usage limits
- Multi-use PINs: Support for PINs that can be used multiple times (maxUsageCount, usageCount tracking)
- PIN Request Approval with Limits: Set max usage count when approving PIN requests
- PIN Statistics: Dashboard shows Available vs Exhausted PINs based on remaining usage capacity

**Result Sheets Workflow (Nov 2025)**
- Class-Subject Sheet Model: Teachers submit entire class results for one subject at a time (result sheets)
- Result Sheets Page: Tabbed interface with "Result Sheets" tab for admin approval and "Student Results" tab for aggregated results
- SpreadsheetResultUpload Component: Refactored to create result sheets via POST /api/result-sheets instead of individual results
- Sheet Approval Flow: School admins can view sheet details, approve (triggers aggregation), or reject with reason
- Automatic Aggregation: Approved subject sheets merge into per-student results with calculated totals, grades, and remarks
- Sheet Status Workflow: draft → submitted → approved/rejected (approved sheets aggregate, rejected sheets can be edited and resubmitted)
- Result Sheet Details Dialog: View all student entries with CA1, CA2, Exam, Total, and Grade columns
- Pending Badge: Result Sheets tab shows count of pending sheets awaiting approval

**Delete & Archive Features (Nov 2025)**
- Delete & Archive Actions: School admins can delete or archive result sheets and student results
- Archived Tables: Three archived tables (archived_result_sheets, archived_result_sheet_entries, archived_results) store archived data
- Bulk Operations: Select multiple items with checkboxes, perform bulk delete/archive with confirmation dialog
- Individual Actions: Delete/archive single items via row action buttons
- Cascading Cleanup: Deleting result sheets also removes associated entries; archiving preserves full data in archived tables
- Role-Based Access: Only school admins can delete/archive results; super admins have broader access
- API Endpoints: DELETE /api/result-sheets/:id, DELETE /api/results/:id, POST /api/result-sheets/bulk-action, POST /api/results/bulk-action
- Data Integrity: Archive transactions move records atomically, maintaining referential integrity with archivedAt/archivedBy fields

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for type-safe REST API
- Custom middleware for request logging, authentication, and authorization
- JWT-based authentication with 30-day token expiration
- bcryptjs for password hashing

**API Design Pattern**
- RESTful conventions with resource-based endpoints
- Authentication endpoints: `/api/auth/login`, `/api/auth/register`
- Resource endpoints: `/api/schools`, `/api/students`, `/api/results`, `/api/pins`, `/api/users`, `/api/classes`, `/api/subjects`, `/api/pin-requests`, `/api/result-sheets`
- Action endpoints: `/api/pin-requests/:id/approve`, `/api/pin-requests/:id/reject`, `/api/results/:id/approve`, `/api/results/:id/reject`, `/api/results/:id/comment`
- Result sheet actions: `/api/result-sheets/:id/submit`, `/api/result-sheets/:id/approve`, `/api/result-sheets/:id/reject`
- Utility endpoints: `/api/analytics/dashboard` for dashboard statistics, `/api/schools/me` for current user's school
- Public endpoints: `/api/public/check-result` (PIN-based result lookup), `/api/public/register-school` (school registration)
- Bulk upload endpoints: `/api/students/bulk`, `/api/results/bulk`
- Result calculation utilities for grading and GPA computation

**Security Implementation**
- Multi-tenant isolation: All queries filter by schoolId
- School admins can only access/modify data for their own school
- Class/subject deletion routes verify school ownership before proceeding
- PIN request approval restricted to super_admin role only
- User status updates verified against school ownership
- Result approval requires school logo to be uploaded (enforced at API layer)

**Authentication & Authorization**
- JWT tokens stored in localStorage (client-side)
- `authenticate` middleware validates JWT on protected routes
- `authorize` middleware checks user roles (super_admin, school_admin, teacher)
- Password requirements and secure hashing with bcrypt (10 salt rounds)

**Business Logic Components**
- Result calculator: Computes totals, grades (A-F), and remarks from CA1, CA2, and exam scores
- PIN generator: Creates unique alphanumeric PINs with expiry dates
- Role-based data filtering: Users only see data for their assigned school (except super_admin)

### Data Storage

**Database Technology**
- PostgreSQL via Neon serverless driver
- WebSocket connection for serverless compatibility
- Drizzle ORM for type-safe database queries and schema management
- Database migrations managed through Drizzle Kit

**Schema Design**
- **users**: Multi-role user accounts (super_admin, school_admin, teacher) with email/password auth
- **schools**: School profiles with metadata (name, code, subdomain, address, logo, motto)
- **students**: Student records linked to schools with admission numbers and class information
- **results**: Academic results with draft→submitted→approved→published workflow and subject scores array
- **resultSheets**: Teacher-submitted result sheets for a class+subject combination per session/term
- **resultSheetEntries**: Individual student scores within a result sheet (CA1, CA2, Exam, Total, Grade)
- **pins**: One-time use PINs for result checking with expiry, usage tracking, and attempt limits
- **pinRequests**: School admin requests for PINs, processed by super admin
- **classes**: Class/grade definitions per academic year
- **subjects**: Subject catalog per school
- **classSubjects**: Maps subjects to classes for course assignment
- **scoreMetrics**: Configurable grading metrics (CA weights, max scores) per school
- **notifications**: In-app notifications for users (PIN requests, result approvals, etc.)
- **teacherAssignments**: Maps teachers to subjects and classes
- **auditLogs**: Activity tracking for compliance and debugging

**Data Relationships**
- Schools have many users, students, results, and PINs
- Users belong to one school (except super_admin)
- Students belong to one school, have many results
- Results link student + school + session/term, contain subjects array
- PINs are scoped to school + session + term
- All entities track creator/updater via `createdBy` foreign keys

**Indexing Strategy**
- Email index on users table for login performance
- Compound index on (schoolId, role) for user queries
- School code unique index for lookup
- Session/term indexes on results and PINs for filtering

### External Dependencies

**Third-Party UI Libraries**
- @radix-ui/* components: Accessible, unstyled primitives (dialogs, dropdowns, tooltips, etc.)
- lucide-react: Icon library for consistent iconography
- tailwindcss: Utility-first CSS framework
- class-variance-authority & clsx: Dynamic className composition

**Development Tools**
- TypeScript: Type safety across frontend and backend
- tsx: TypeScript execution for development server
- esbuild: Fast bundler for production backend builds
- Vite plugins: React support, runtime error overlay, Replit-specific tooling

**Backend Utilities**
- @neondatabase/serverless: PostgreSQL driver optimized for serverless
- jsonwebtoken: JWT creation and validation
- bcryptjs: Password hashing
- ws: WebSocket support for Neon database connection

**Form & Validation**
- @hookform/resolvers: React Hook Form integration
- Zod (via drizzle-zod): Schema validation for database inserts
- React Hook Form implied by resolver dependency

**API Communication**
- Native fetch API for HTTP requests
- Custom apiRequest wrapper with authentication headers and error handling
- TanStack Query for request deduplication and caching

**Database ORM**
- drizzle-orm: Type-safe query builder
- drizzle-kit: Schema migrations and introspection
- Connection pooling via @neondatabase/serverless Pool

**Potential Future Integrations**
- File upload service for school logos (currently stored as URLs)
- PDF generation library for result sheets
- Email service for notifications (password resets, result approvals)
- SMS gateway for PIN delivery to parents
- Analytics dashboard (Chart.js or Recharts for visualizations)