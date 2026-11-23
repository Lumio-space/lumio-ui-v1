# Lumio Backend Audit Report: Identified Issues & Required Fixes

**Codebase Audited:** `lumio-api-v1-main`  
**Framework / Stack:** NestJS 11, Drizzle ORM, Neon PostgreSQL, Redis, class-validator  
**Date:** November 2026  
**Auditor:** Technical Audit Team  

---

## Executive Summary

This document provides a comprehensive report of all backend defects, missing business logic, cache invalidation bugs, and API contract discrepancies discovered inside the **`lumio-api-v1-main`** repository. 

These issues directly cause the reported dashboard problems:
1. **Form teacher assignments not persisting or reflecting** across the system.
2. **Subject assignment API returning 404** (`Cannot POST /v1/teachers/assign-subjects`).
3. **Inability to assign subjects to multiple classes** in a single operation.
4. **Attendance permissions clarification**: attendance marking is strictly restricted to assigned Form Teachers by business policy; Admins hold viewing access for records and KPI metrics.
5. **Class updates failing** due to controller parameter casing bugs and missing DTO optionality.
6. **Soft-deleted classes and subjects** continuing to leak into list endpoints.

Below are the detailed findings, exact file locations, code snippets, and required remediation steps for each issue.

---

## 1. High-Priority Issues Affecting Dashboard Features

### 1.1 Form Teacher Assignment Not Reflecting / Stale Reads
* **Affected Files:**
  * `src/modules/teachers/teachers.service.ts` (lines 29–45)
  * `src/modules/classes/classes.service.ts` (lines 130–170)
* **Root Cause:**
  1. `ClassesService.findAll` caches paginated class lists in Redis for **3,600 seconds (1 hour)** under the key `cacheKeys.classesList(schoolId, page, limit)`.
  2. In `TeachersService.setFormTeacher`, the PostgreSQL database is updated (`classes.formTeacher = teacherId`), but `CacheService` is **neither injected nor called**.
  3. When an admin assigns a form teacher and the frontend refetches `GET /v1/classes`, NestJS serves the stale Redis cache where `formTeacher` and `formTeacherName` are still `null`.
* **Required Fix:**
  * Inject `CacheService` into `TeachersService`.
  * Invalidate class caches on any form teacher or teacher status update:
    ```typescript
    await this.cacheService.invalidatePattern(cacheKeys.classesAll(schoolId));
    await this.cacheService.invalidate(cacheKeys.dashboardOverview(schoolId));
    ```

---

### 1.2 Teacher Invitations Discard `classId` & Omit Assignment on Acceptance
* **Affected Files:**
  * `src/modules/invitations/invitations.controller.ts` (lines 42–50)
  * `src/modules/invitations/invitation.service.ts` (lines 243, 335)
* **Root Cause:**
  1. In `invitations.controller.ts:46`, `inviteTeacher` accepts `dto: InviteTeacherDto` (which contains `classId` and `assignmentType`), but line 46 explicitly passes `undefined` instead of `dto.classId` to `createInvitation`:
     ```typescript
     // Current defective code in invitations.controller.ts:
     return this.invitationService.createInvitation(
       schoolId,
       dto.email,
       Role.TEACHER,
       undefined, // <-- BUG: Discards dto.classId!
       undefined,
       userId,
       dto.assignmentType,
     );
     ```
  2. In `invitation.service.ts`, when a teacher accepts an invitation (`acceptNewUserInvitation` / `acceptExistingUserInvitation`), the service executes `applyStudentAssignment` and `applyParentAssignment`, but **has no `applyTeacherAssignment` logic**.
  3. Consequently, neither `classTeachers` nor `classes.formTeacher` are ever written when an invited teacher signs up.
* **Required Fix:**
  * In `invitations.controller.ts:46`, pass `dto.classId`.
  * In `invitation.service.ts`, implement `applyTeacherAssignment(schoolId, invitation, userId, tx)`:
    * Insert row into `classTeachers` (`classId`, `teacherId`).
    * If `assignmentType === 'form_teacher'`, update `classes.formTeacher = userId`.
    * Invalidate Redis class caches.

---

### 1.3 Subject Assignment: Route Name Mismatch & Single-Class Limitation
* **Affected Files:**
  * `src/modules/teachers/teachers.controller.ts` (lines 75–87)
  * `src/modules/teachers/dto/subject-teacher-assignment.dto.ts` (lines 1–12)
  * `src/modules/teachers/teachers.service.ts` (lines 47–73)
* **Root Cause:**
  1. **Route Name Mismatch (404 Error):** The backend controller registers `@Post('/assign-subject-to-teacher')`. However, standard frontend callers request `POST /v1/teachers/assign-subjects`. NestJS returns `404 Cannot POST /v1/teachers/assign-subjects`.
  2. **Single-Class Restriction:** `SubjectTeacherAssignmentDto` strictly accepts a single `classId: string`. Admins cannot assign a subject across multiple arms or cohorts (e.g. JSS 1A, JSS 1B, JSS 1C) in a single request.
  3. `TeachersService.assignSubjectToTeacher` only accepts a single `classId`.
* **Required Fix:**
  * Add `@Post('/assign-subjects')` (or alias route) to `TeachersController`.
  * Update `SubjectTeacherAssignmentDto` to support an array of class IDs:
    ```typescript
    export class SubjectTeacherAssignmentDto {
      @IsUUID()
      teacherId: string;

      @IsUUID()
      subjectId: string;

      @IsArray()
      @IsUUID('4', { each: true })
      @IsOptional()
      classIds?: string[];

      @IsUUID()
      @IsOptional()
      classId?: string; // Kept for backward compatibility
    }
    ```
  * In `TeachersService.assignSubjectToTeacher`, accept `classIds: string[]`, validate that each class belongs to the school and offers the subject, and batch insert into `teacher_subjects` inside a single database transaction.

---

### 1.4 Class Updates Broken: Parameter Typo & DTO Validation
* **Affected Files:**
  * `src/modules/classes/classes.controller.ts` (line 48)
  * `src/modules/classes/dto/create-class.dto.ts` (lines 39–60)
* **Root Cause:**
  1. **Parameter Typo:** In `classes.controller.ts:48`:
     ```typescript
     @Patch(':classId')
     @Permissions(Permission.MANAGE_CLASS)
     async updateClass(
       @CurrentMembership('schoolid') schoolId: string, // <-- TYPO: lowercase 'schoolid'
       @Param('classId') classId: string,
       @Body() dto: UpdateClassDto,
     )
     ```
     Because the `CurrentMembership` decorator performs a case-sensitive lookup on `request.membership?.[field]`, `schoolId` evaluates to `undefined`.
  2. **ValidationPipe Failure on Partial Updates:** `UpdateClassDto` re-declares `gradeLevel`, `gradeSection`, `schoolLevel`, `capacity`, and `room` without `@IsOptional()`. Sending a partial update (e.g. updating capacity or room only) triggers a `400 Bad Request` validation failure.
* **Required Fix:**
  * Fix casing in `classes.controller.ts:48` to `@CurrentMembership('schoolId')`.
  * Add `@IsOptional()` to all fields in `UpdateClassDto`.
  * Invalidate Redis cache `cacheKeys.classesAll(schoolId)` in `ClassesService.update` and `ClassesService.deleteClass`.

---

## 2. Additional Defects & Architectural Gaps

### 2.1 Attendance Permissions: Form-Teacher-Only Marking (Confirmed Business Logic)
* **Referenced Backend Files:**
  * `src/security/rbac/permission-map.ts` (lines 7–39)
  * `src/modules/attendance/attendance.controller.ts` (lines 31–75)
  * `src/modules/attendance/attendance.service.ts` (lines 49–53, 116–130, 304–325)
* **Referenced Frontend Files:**
  * `src/app/(dashboard)/attendance/page.tsx`
  * `src/features/attendance/components/AttendanceRoster.tsx`
  * `src/features/attendance/components/AttendanceSummaryCards.tsx`
  * `src/features/attendance/components/ParentAttendanceView.tsx`
  * `src/features/attendance/api/attendance.api.ts`
  * `src/features/attendance/hooks/useAttendance.ts`
* **Policy & Business Logic Clarification:**
  In `attendance.service.ts:49`, `markAttendance` enforces:
  ```typescript
  if (cls.formTeacher !== userId) {
    throw new ForbiddenException(
      'only this class form teacher can mark attendance for this class',
    );
  }
  ```
  *Clarification on Architectural Intent:* Previous audit drafts questioned this check as a potential bug. However, per confirmed product specifications and business policy, **`cls.formTeacher !== userId` is intended business logic**.
  
  In the Lumio platform:
  1. **RBAC Permission Architecture:**
     * In `permission-map.ts`, `Role.SCHOOL_ADMIN` is assigned `Permission.VIEW_ATTENDANCE` but intentionally **omits** `Permission.MARK_ATTENDANCE`.
     * `Role.TEACHER` is granted both `Permission.MARK_ATTENDANCE` and `Permission.VIEW_ATTENDANCE`.
     * In `AttendanceController`, both creation (`@Post(':classId')`) and updates (`@Patch(':classId')`) are guarded with `@Permissions(Permission.MARK_ATTENDANCE)`. Retrieval (`@Get(':classId')`) requires `@Permissions(Permission.VIEW_ATTENDANCE)`.
  2. **Exclusivity of Attendance Marking:** Only appointed Form Teachers have the pedagogical authority and administrative permission to record or update daily attendance registers for their assigned cohorts.
  3. **Administrator Role (View-Only & Institution Metrics):** School Administrators do not mark student attendance. In `AttendanceService.getClassForAccess` (lines 316–324), `isAdmin === true` allows administrators to query and view class attendance registers for any class in the institution, track attendance rosters, and review school-wide KPI metrics and monthly trends.
  4. **Frontend Alignment & UI/UX Experience:**
     * **School Administrators (Read-Only View):**
       * Displayed with an explicit banner: *"Administrator View (Read-Only) — Student attendance marking is reserved for designated Form Teachers. You have full access to view daily registers and KPI metrics."*
       * Action buttons ("Mark all present", "Save register") and segmented status toggle buttons are completely hidden.
       * Student rosters render immutable status badges (`Present`, `Late`, `Absent`, `Excused`, `Unmarked`) along with a `"Read-only view"` header badge.
       * Institution-wide class selector dropdown is fully enabled, allowing administrators to inspect any class.
       * Summary KPI cards (Present, Absent, Late counts, Today's Rate progress ring) and the 6-month monthly trend analytics chart remain fully active and visible.
     * **Form Teachers (Interactive Marking Active):**
       * When viewing their assigned cohort (`cls.formTeacher === userId` or matching teacher credentials), an authorization banner is displayed: *"You are the designated Form Teacher for {className}. Register recording and submissions are active."*
       * Interactive status segmented buttons (Present, Late, Absent, Excused) and "Mark all present" are fully active.
       * Live summary KPI metrics update instantaneously as marks are toggled.
       * "Save register" submits attendance via `POST /attendance/:classId` on initial marking, and falls back to `PATCH /attendance/:classId` for subsequent corrections.
     * **Non-Form Teachers (Read-Only Register):**
       * When a teacher inspects a cohort they do not lead, an advisory banner is shown: *"Read-Only Register — Only the appointed Form Teacher of {className} can record or modify attendance."*
       * If the backend returns `403 Forbidden`, a non-blocking alert banner and locked roster placeholder are presented while preserving monthly trends and calendar navigation.
     * **Parents:**
       * Automatically rendered via `ParentAttendanceView`, displaying only their linked ward's attendance metrics and calendar history to ensure absolute privacy for peer students.
  5. **Verification & Test Coverage:**
     * `AttendancePage.test.tsx` (10 tests passing): Confirms Admin read-only enforcement, Form Teacher marking & saving, Non-Form Teacher read-only notice, 403 handling resilience, flexible credential identification (user ID, teacherId, name, fullName, classId, and formTeacherName matching), and Parent view isolation.
     * `AttendanceRoster.test.tsx` (3 tests passing): Confirms read-only status badges vs interactive button controls, and case-insensitive status badge normalization.
     * `AttendanceSummaryCards.test.tsx` (3 tests passing): Confirms count displays, boundary division-by-zero protection, and proper `summary.total` enrollment denominator precedence when partial attendance is recorded.
     * `attendance.api.test.ts` (3 tests passing): Confirms GET, POST, and PATCH API integrations with defensive data normalization (mapping DB column names and lowercase status enums).
* **Remediation Status:** **No backend modification required for `cls.formTeacher !== userId`**. The backend constraint is working as intended, and the frontend is fully hardened and aligned.

---

### 2.2 Soft-Deleted Classes and Subjects Leak Into List Endpoints
* **Affected Files:**
  * `src/modules/classes/classes.service.ts` (lines 154, 160)
  * `src/modules/subjects/subjects.service.ts` (lines 151, 157)
* **Root Cause:**
  Both `ClassesService.findAll` and `SubjectsService.findAll` filter by `eq(schoolId, schoolId)` but completely omit `isNull(deletedAt)` in both data query and `count()` queries.  
  **Impact:** Classes and subjects that were deleted via `DELETE` continue to appear in listings and dashboard metrics.
* **Required Fix:**
  Add `isNull(classes.deletedAt)` and `isNull(subjects.deletedAt)` to the `where` clauses of both query and count queries.

---

### 2.3 Student Counts Missing from `GET /v1/classes`
* **Affected File:** `src/modules/classes/classes.service.ts` (lines 138–161)
* **Root Cause:**
  `ClassesService.findAll` selects only class columns and `formTeacherName`. It does not aggregate active students from the `students` table.  
  **Impact:** Every class card displays `0 / {capacity}` students because the backend returns no student counts.
* **Required Fix:**
  Include a subquery or join to return active student count:
  ```typescript
  studentsCount: sql<number>`(
    SELECT count(*)::int FROM students 
    WHERE students.class_id = ${classes.id} 
      AND students.status = 'active'
      AND students.deleted_at IS NULL
  )`
  ```

---

### 2.4 Subject Deletion & Update API Contract Issues
* **Affected Files:**
  * `src/modules/subjects/subjects.controller.ts` (line 58)
  * `src/modules/subjects/dto/create-subject.dto.ts` (lines 31–46)
* **Root Cause:**
  1. `SubjectsController` defines `@Delete('/')` requiring a JSON body `{ subjectId: string }`. Standard REST clients expect `@Delete(':subjectId')`.
  2. `UpdateSubjectDto` declares all fields (`status`, `subjectId`, `title`, `code`) as mandatory without `@IsOptional()`. Partial updates fail validation.
* **Required Fix:**
  * Change delete endpoint to `@Delete(':subjectId')` with `@Param('subjectId')`.
  * Add `@IsOptional()` to all fields in `UpdateSubjectDto` and remove required `subjectId` from the body.

---

### 2.5 Subject Metadata Stripped on `GET /v1/subjects`
* **Affected File:** `src/modules/subjects/subjects.service.ts` (lines 146–162)
* **Root Cause:**
  `findAll` selects exclusively from the `subjects` table. It does not join `subject_offerings` or `class_subjects`.  
  **Impact:** The response lacks `section`, `department`, `type`, and assigned `classIds`.
* **Required Fix:**
  Join `subject_offerings` and aggregate assigned class IDs from `class_subjects` so subject metadata is preserved and returned.

---

### 2.6 Missing Endpoints on Backend Controllers
1. **Subject Class Assignment:**
   Frontend calls `POST /v1/subjects/:subjectId/classes` to assign classes to a subject. Backend has no such route in `SubjectsController`.
2. **Form Teacher Removal:**
   `TeachersService.removeFormTeacher` exists in the service at line 275, but is **omitted from `TeachersController`**.
3. **Teacher Subject Unassignment:**
   `TeachersService.removeAssignment` at line 297 is an empty stub and has no controller route.
4. **Teacher Profile Update:**
   No endpoint exists to update a teacher's profile details (full name, phone, etc.) from the dashboard. Only `PATCH /teachers/:teacherId/status` exists.

---

## 3. Summary Checklist for the Backend Engineer

| Area | File(s) | Fix Summary |
|---|---|---|
| **Cache Invalidation** | `teachers.service.ts`, `classes.service.ts` | Invalidate `cacheKeys.classesAll(schoolId)` on teacher/form-teacher/class updates. |
| **Invitations** | `invitations.controller.ts:46`, `invitation.service.ts` | Stop passing `undefined` for `dto.classId`. Add `applyTeacherAssignment` on acceptance. |
| **Subject Assignment** | `teachers.controller.ts`, `subject-teacher-assignment.dto.ts` | Add route alias `/assign-subjects`. Support `classIds: string[]` batch assignment. |
| **Class Updates** | `classes.controller.ts:48`, `create-class.dto.ts` | Change `'schoolid'` to `'schoolId'`. Add `@IsOptional()` to `UpdateClassDto`. |
| **Attendance Permissions** | `attendance.controller.ts`, `attendance.service.ts:49` | Confirmed intended policy: strictly Form-Teacher-only marking (`cls.formTeacher === userId`). Admins have read-only view. |
| **Soft-Delete Filtering** | `classes.service.ts:154`, `subjects.service.ts:151` | Add `isNull(deletedAt)` to both data queries and count queries. |
| **Student Counts** | `classes.service.ts:138` | Join/subquery active student count in `ClassesService.findAll`. |
| **Subject REST Routes** | `subjects.controller.ts`, `create-subject.dto.ts` | Change delete to `@Delete(':subjectId')`. Make `UpdateSubjectDto` fields optional. |
| **Expose Missing Endpoints** | `teachers.controller.ts`, `subjects.controller.ts` | Expose `removeFormTeacher`, `removeAssignment`, and `POST /subjects/:subjectId/classes`. |

---
*Report generated for Lumio Platform Engineering.*
