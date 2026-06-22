# Volunteering Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a login-only React + Vite + Firebase app for daycare volunteer scheduling, board posts, activity logs, teacher approvals, and Google Calendar event creation.

**Architecture:** The app is a client-side React application with Firebase Authentication and Firestore as the backend. Domain logic is split into small service modules, role helpers, and focused screens so Firebase calls, authorization checks, and UI state stay testable.

**Tech Stack:** React, Vite, TypeScript, Firebase Auth, Firestore, Google Identity Services, Google Calendar API, Vitest, Testing Library, CSS modules or plain CSS.

## Global Constraints

- Login-only internal app; no internal route is public.
- New users are `student` by default.
- Entering `qwer1234` upgrades the current account to `teacher`.
- Firebase API keys and Google client configuration live in local `.env`.
- Commit `.env.example`; do not commit `.env`.
- Store posts, account tiers, app passcode config, schedule requests, and activity logs in Firebase.
- Approved schedule requests can be added to Google Calendar and store the event ID.
- Use focused files with clear responsibilities.

---

## File Structure

- `package.json`: scripts and dependencies.
- `.env.example`: documented Firebase and Google environment variables.
- `.gitignore`: exclude `.env`, build output, dependencies, and local logs.
- `index.html`: Vite HTML entry.
- `src/main.tsx`: React app mount.
- `src/App.tsx`: auth-gated app shell and screen routing.
- `src/styles.css`: Hallmark-guided internal-tool visual system and responsive layout.
- `src/firebase.ts`: Firebase app, auth, and Firestore initialization from Vite env vars.
- `src/types.ts`: shared domain types.
- `src/auth/AuthProvider.tsx`: Firebase auth state and profile bootstrap.
- `src/auth/authService.ts`: signup, login, logout, profile creation, and teacher upgrade.
- `src/domain/permissions.ts`: role helper functions.
- `src/domain/dateTime.ts`: date/time validation and display helpers.
- `src/services/scheduleService.ts`: schedule request CRUD and review actions.
- `src/services/postService.ts`: board post CRUD.
- `src/services/activityLogService.ts`: activity log CRUD and recognition actions.
- `src/services/googleCalendarService.ts`: Google Calendar OAuth and event creation.
- `src/components/*`: reusable UI components.
- `src/screens/*`: Dashboard, Calendar, Board, Activity Logs, Profile, and Auth screens.
- `src/test/*`: test setup and Firebase mocks.
- `firestore.rules`: security rules matching the tier model.

---

### Task 1: Project Scaffold and Environment Contract

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Produces: Vite React TypeScript project with `npm run dev`, `npm run build`, and `npm test`.
- Produces: environment variable names consumed by `src/firebase.ts` and `src/services/googleCalendarService.ts`.

- [ ] **Step 1: Create scaffold files**

Create the listed files with React + Vite + TypeScript configuration. `package.json` must include these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Add environment example**

Create `.env.example` exactly with:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_CALENDAR_ID=primary
```

- [ ] **Step 3: Add initial app shell**

`src/App.tsx` starts with a minimal rendering target:

```tsx
export default function App() {
  return (
    <main className="app-loading">
      <h1>Volunteer Calendar</h1>
      <p>Internal app scaffold is ready.</p>
    </main>
  );
}
```

- [ ] **Step 4: Install dependencies**

Run:

```powershell
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 5: Verify scaffold**

Run:

```powershell
npm run build
npm test
```

Expected: build succeeds. Test command succeeds when no tests exist or after adding the first smoke test in this task.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts .gitignore .env.example src/main.tsx src/App.tsx src/styles.css
git commit -m "chore: scaffold React Firebase app"
```

---

### Task 2: Domain Types and Permission Tests

**Files:**
- Create: `src/types.ts`
- Create: `src/domain/permissions.ts`
- Create: `src/domain/permissions.test.ts`
- Create: `src/domain/dateTime.ts`
- Create: `src/domain/dateTime.test.ts`

**Interfaces:**
- Produces: `type Tier = "student" | "teacher"`.
- Produces: `canApproveSchedule(tier: Tier): boolean`.
- Produces: `canRecognizeActivityLog(tier: Tier): boolean`.
- Produces: `canReadActivityLog(tier: Tier, ownerUid: string, viewerUid: string): boolean`.
- Produces: `isValidTimeRange(startTime: string, endTime: string): boolean`.

- [ ] **Step 1: Write failing permission tests**

```ts
import { describe, expect, it } from "vitest";
import {
  canApproveSchedule,
  canReadActivityLog,
  canRecognizeActivityLog,
} from "./permissions";

describe("permissions", () => {
  it("allows only teachers to approve schedules", () => {
    expect(canApproveSchedule("teacher")).toBe(true);
    expect(canApproveSchedule("student")).toBe(false);
  });

  it("allows only teachers to recognize activity logs", () => {
    expect(canRecognizeActivityLog("teacher")).toBe(true);
    expect(canRecognizeActivityLog("student")).toBe(false);
  });

  it("allows students to read their own logs and teachers to read all logs", () => {
    expect(canReadActivityLog("student", "u1", "u1")).toBe(true);
    expect(canReadActivityLog("student", "u1", "u2")).toBe(false);
    expect(canReadActivityLog("teacher", "u1", "u2")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- src/domain/permissions.test.ts
```

Expected: FAIL because helpers do not exist.

- [ ] **Step 3: Implement domain types and permission helpers**

```ts
export type Tier = "student" | "teacher";
```

```ts
import type { Tier } from "../types";

export function canApproveSchedule(tier: Tier) {
  return tier === "teacher";
}

export function canRecognizeActivityLog(tier: Tier) {
  return tier === "teacher";
}

export function canReadActivityLog(tier: Tier, ownerUid: string, viewerUid: string) {
  return tier === "teacher" || ownerUid === viewerUid;
}
```

- [ ] **Step 4: Add time range tests and helper**

Test valid `09:00` to `10:30`, invalid equal times, invalid end-before-start, and malformed values. Implement `isValidTimeRange(startTime, endTime)` using a strict `HH:mm` regular expression and minute comparison.

- [ ] **Step 5: Run tests**

Run:

```powershell
npm test -- src/domain
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/types.ts src/domain
git commit -m "test: add tier permission helpers"
```

---

### Task 3: Firebase Initialization and Auth Provider

**Files:**
- Create: `src/firebase.ts`
- Create: `src/auth/AuthProvider.tsx`
- Create: `src/auth/authService.ts`
- Create: `src/auth/authService.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: `auth` and `db` exports from `src/firebase.ts`.
- Produces: `AuthProvider`, `useAuth()`, and `AuthUserProfile`.
- Produces: `ensureUserProfile(uid, email, displayName): Promise<void>`.
- Produces: `upgradeCurrentUserToTeacher(uid, passcode): Promise<boolean>`.

- [ ] **Step 1: Write auth service tests with mocked Firestore functions**

Test that `ensureUserProfile` creates a user with `tier: "student"`. Test that `upgradeCurrentUserToTeacher` returns `true` and writes `tier: "teacher"` when the configured passcode matches `qwer1234`, and returns `false` without tier update when it does not match.

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- src/auth/authService.test.ts
```

Expected: FAIL because service functions do not exist.

- [ ] **Step 3: Implement Firebase initialization**

Read all `VITE_FIREBASE_*` variables from `import.meta.env`, call `initializeApp`, export `auth = getAuth(app)` and `db = getFirestore(app)`.

- [ ] **Step 4: Implement auth service**

Use Firestore document paths:
- `users/{uid}`
- `appConfig/teacherAccess`

Teacher upgrade compares the entered passcode with `appConfig/teacherAccess.passcode` and updates `users/{uid}.tier` to `teacher` on match.

- [ ] **Step 5: Implement auth provider**

Subscribe with `onAuthStateChanged`. Load `users/{uid}` profile. Expose `user`, `profile`, `loading`, `signIn`, `signUp`, `signOut`, and `refreshProfile`.

- [ ] **Step 6: Gate the app**

Wrap `App` in `AuthProvider` from `src/main.tsx`. `App` renders the auth screen when no user exists and app shell when authenticated.

- [ ] **Step 7: Run tests and build**

Run:

```powershell
npm test -- src/auth/authService.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/firebase.ts src/auth src/App.tsx src/main.tsx
git commit -m "feat: add Firebase auth provider"
```

---

### Task 4: Firestore Services for Schedules, Posts, and Activity Logs

**Files:**
- Create: `src/services/scheduleService.ts`
- Create: `src/services/scheduleService.test.ts`
- Create: `src/services/postService.ts`
- Create: `src/services/postService.test.ts`
- Create: `src/services/activityLogService.ts`
- Create: `src/services/activityLogService.test.ts`
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `createScheduleRequest(input): Promise<string>`.
- Produces: `reviewScheduleRequest(requestId, reviewerUid, status): Promise<void>`.
- Produces: `createPost(input): Promise<string>`.
- Produces: `createActivityLog(input): Promise<string>`.
- Produces: `recognizeActivityLog(logId, teacherUid): Promise<void>`.

- [ ] **Step 1: Write failing tests**

Use mocked Firestore functions to verify:
- New schedule requests start as `pending`.
- Reviewing a schedule writes `status`, `reviewedBy`, `reviewedAt`, and `updatedAt`.
- New activity logs start as `submitted`.
- Recognizing an activity log writes `status: "recognized"`, `recognizedBy`, `recognizedAt`, and `updatedAt`.
- Board posts write the requested `type`, `title`, `body`, and `createdBy`.

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- src/services
```

Expected: FAIL because service modules do not exist.

- [ ] **Step 3: Extend shared types**

Add `ScheduleRequest`, `BoardPost`, `ActivityLog`, and input types to `src/types.ts` with the fields from the design spec.

- [ ] **Step 4: Implement services**

Use Firestore `collection`, `addDoc`, `doc`, `updateDoc`, and `serverTimestamp`. Keep service functions small and return created document IDs.

- [ ] **Step 5: Run tests**

Run:

```powershell
npm test -- src/services
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/types.ts src/services
git commit -m "feat: add Firestore domain services"
```

---

### Task 5: Auth, Profile, and App Shell UI

**Files:**
- Create: `src/screens/AuthScreen.tsx`
- Create: `src/screens/ProfileScreen.tsx`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/RoleBadge.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `useAuth()`.
- Consumes: `upgradeCurrentUserToTeacher(uid, passcode)`.
- Produces: authenticated navigation between Dashboard, Calendar, Board, Activity Logs, and Profile.

- [ ] **Step 1: Write UI smoke tests**

Add tests that render the auth screen when no user is present and render the internal navigation when a user/profile exists. Mock `useAuth`.

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- src/screens src/components
```

Expected: FAIL because screens and components do not exist.

- [ ] **Step 3: Implement auth screen**

Email/password login and signup share one screen. Show inline errors. On signup, call auth provider `signUp`.

- [ ] **Step 4: Implement app shell**

Use responsive navigation. Include role badge, sign-out button, and screen selection state. Ensure the app shell is the first authenticated screen.

- [ ] **Step 5: Implement profile teacher upgrade**

Profile shows current tier and passcode input. When the user enters `qwer1234`, call the upgrade service, refresh profile, and show success. Wrong passcode shows an inline error.

- [ ] **Step 6: Run tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/screens src/components src/App.tsx src/styles.css
git commit -m "feat: add auth-gated app shell"
```

---

### Task 6: Dashboard, Calendar, Board, and Activity Log Screens

**Files:**
- Create: `src/screens/DashboardScreen.tsx`
- Create: `src/screens/CalendarScreen.tsx`
- Create: `src/screens/BoardScreen.tsx`
- Create: `src/screens/ActivityLogsScreen.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/components/StatusPill.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: Firestore service modules.
- Consumes: permission helpers.
- Produces: student forms and teacher review controls.

- [ ] **Step 1: Write screen tests**

Mock services and auth profile. Verify:
- Student calendar screen shows request form and no approval buttons.
- Teacher calendar screen shows approval/rejection controls.
- Student activity screen shows own log form.
- Teacher activity screen shows recognition controls.

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- src/screens
```

Expected: FAIL because screens are missing behavior.

- [ ] **Step 3: Implement dashboard**

Show pending counts for the active role, upcoming approved schedules, and recent board posts. Empty data shows `EmptyState`.

- [ ] **Step 4: Implement calendar**

Student form creates schedule requests. Teacher list can approve or reject pending requests. Status pills show `pending`, `approved`, or `rejected`.

- [ ] **Step 5: Implement board**

Support post creation for `notice`, `volunteerIntro`, and `lessonPlan`. Students can create `volunteerIntro` and `lessonPlan`. Teachers can create all types.

- [ ] **Step 6: Implement activity logs**

Student form creates logs. Teacher list shows all logs and can mark submitted logs as recognized.

- [ ] **Step 7: Run tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/screens src/components src/App.tsx src/styles.css
git commit -m "feat: add volunteer workflow screens"
```

---

### Task 7: Google Calendar Integration

**Files:**
- Create: `src/services/googleCalendarService.ts`
- Create: `src/services/googleCalendarService.test.ts`
- Modify: `src/screens/CalendarScreen.tsx`
- Modify: `src/services/scheduleService.ts`
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `createGoogleCalendarEvent(input): Promise<string>`.
- Produces: `markScheduleGoogleEventCreated(requestId, eventId): Promise<void>`.
- Consumes: `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CALENDAR_ID`.

- [ ] **Step 1: Write calendar service tests**

Mock `window.google.accounts.oauth2.initTokenClient` and `fetch`. Verify the service requests a token, POSTs to `https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events`, and returns the event `id`.

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- src/services/googleCalendarService.test.ts
```

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement Google Calendar service**

Create event payload with:
- `summary`: `Volunteer schedule`
- `description`: request note and requester ID
- `start.dateTime`: local date plus start time
- `end.dateTime`: local date plus end time

Use the Calendar scope `https://www.googleapis.com/auth/calendar.events`.

- [ ] **Step 4: Add Firestore event ID update**

Implement `markScheduleGoogleEventCreated(requestId, eventId)` in `scheduleService.ts`.

- [ ] **Step 5: Wire teacher calendar action**

For approved requests without `googleCalendarEventId`, show `Add to Google Calendar`. On success, store the event ID and show the linked state.

- [ ] **Step 6: Run tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/services/googleCalendarService.ts src/services/googleCalendarService.test.ts src/services/scheduleService.ts src/screens/CalendarScreen.tsx src/types.ts
git commit -m "feat: add Google Calendar event creation"
```

---

### Task 8: Firestore Rules and Final Verification

**Files:**
- Create: `firestore.rules`
- Create: `README.md`
- Modify: `.env.example`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: deployable Firestore security rules.
- Produces: setup documentation for Firebase and Google OAuth configuration.

- [ ] **Step 1: Write Firestore rules**

Rules enforce:
- `request.auth != null` for all app data.
- Users can read and create their own user document.
- Students cannot set themselves to `teacher` through a normal user document create.
- Teachers can read all schedules and logs.
- Teachers can update schedule review fields and activity recognition fields.
- Authenticated users can read board posts.

- [ ] **Step 2: Add README setup**

Document:
- `npm install`
- copy `.env.example` to `.env`
- fill Firebase values
- enable Firebase Auth email/password
- create `appConfig/teacherAccess` with `passcode: "qwer1234"`
- configure Google OAuth client and Calendar API
- run `npm run dev`

- [ ] **Step 3: Run final verification**

Run:

```powershell
npm test
npm run build
git status --short
```

Expected: tests pass, build passes, and only intentional files are changed.

- [ ] **Step 4: Commit**

```powershell
git add firestore.rules README.md .env.example src/styles.css
git commit -m "docs: add Firebase setup and security rules"
```

---

## Self-Review

Spec coverage:
- Login-only app is covered by Tasks 3, 5, and 8.
- Student default tier and teacher passcode upgrade are covered by Tasks 2, 3, and 5.
- Firebase storage for posts, account tiers, passcode config, schedules, and logs is covered by Tasks 3, 4, and 8.
- Calendar interface, board interface, and activity log interface are covered by Task 6.
- Google Calendar event creation and event ID storage are covered by Task 7.
- `.env.example` is covered by Tasks 1 and 8.

Placeholder scan:
- No task contains unresolved markers or an unspecified implementation step.

Type consistency:
- The tier type is `Tier = "student" | "teacher"` across all tasks.
- Schedule statuses are `pending | approved | rejected`.
- Activity log statuses are `submitted | recognized`.
- Google Calendar event IDs are stored as `googleCalendarEventId`.
