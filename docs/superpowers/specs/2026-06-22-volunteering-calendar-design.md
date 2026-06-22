# Volunteering Calendar Internal App Design

## Context

The app supports fast internal communication for a daycare volunteer program. It is a login-only web app for authenticated students and teachers. No app route is public in the first version.

The selected stack is React, Vite, and Firebase. Firebase API keys and project configuration will live in local environment variables, with an example file committed for setup.

## Goals

- Let new users sign up as `student` by default.
- Let users become `teacher` when they enter the teacher passcode `qwer1234`.
- Store user tiers, posts, schedule requests, lesson plans, activity logs, and app configuration in Firebase.
- Provide a calendar interface for volunteer schedule requests and teacher approval.
- Provide a board interface for internal posts, volunteer introductions, and major class plans.
- Let teachers review activity logs and mark volunteer hours as recognized.
- Integrate approved volunteer schedules with Google Calendar.

## Non-Goals

- Public, anonymous, or non-login access.
- Payroll, invoicing, or formal attendance hardware integration.
- Multi-day recurring Google Calendar sync in the first implementation.
- Server-side admin console beyond Firebase Console.

## Product Model

### Tiers

`student` is the default tier assigned after signup.

Student permissions:
- Create and edit their own volunteer introduction.
- Request volunteer schedules from the calendar.
- Create and edit major class plan posts.
- Create and edit their own post-volunteer activity logs with date, time, and a short note.
- Read their own schedule requests, posts, lesson plans, and activity logs.

`teacher` is assigned when a user enters the configured teacher passcode. The first passcode value is `qwer1234`; it is stored in Firebase app configuration so it can be changed later without a code deploy.

Teacher permissions:
- Read all volunteer activity logs.
- Approve or reject volunteer schedule requests.
- Mark activity logs as recognized for volunteer hours.
- Read all internal board content.
- Create, edit, or delete board posts where appropriate.

### Auth Flow

The app uses Firebase Authentication. Email/password auth is the first target because it is simple for a closed internal app. Google sign-in can be added later without changing the tier model.

On first login, the app creates or updates `users/{uid}`:
- `uid`
- `email`
- `displayName`
- `tier`
- `createdAt`
- `updatedAt`

By default, `tier` is `student`.

The teacher upgrade flow asks for the teacher passcode. The app compares it with the configured passcode stored in Firestore. The implementation should keep the passcode access isolated so it can later move to Cloud Functions or hashed validation.

## Interface Design

### App Shell

The login screen is the only unauthenticated route. After login, the app uses a compact internal-tool shell:
- Left or top navigation depending on viewport width.
- Main tabs: Dashboard, Calendar, Board, Activity Logs, Profile.
- Role badge showing `student` or `teacher`.
- Clear pending states for teacher approvals and student submissions.

### Dashboard

The dashboard summarizes the next useful actions:
- Upcoming approved volunteer schedules.
- Student: pending schedule requests and activity logs to complete.
- Teacher: schedule requests waiting for approval and activity logs waiting for recognition.
- Recent board posts.

### Calendar

Students can create a schedule request with:
- Date
- Start time
- End time
- Short purpose or note

Requests have statuses:
- `pending`
- `approved`
- `rejected`

Teachers can approve or reject pending requests. Approved requests become eligible for Google Calendar event creation.

### Board

Board post types:
- `notice`
- `volunteerIntro`
- `lessonPlan`

Students can create their own volunteer introduction and lesson plan posts. Teachers can read all posts and manage posts when needed.

### Activity Logs

Students create activity logs after volunteering:
- Date
- Start time
- End time
- Short activity note
- Linked schedule request when available

Activity log recognition states:
- `submitted`
- `recognized`

Teachers can review all submitted logs and mark them as recognized.

## Firebase Data Model

### `users/{uid}`

```json
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "tier": "student | teacher",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `appConfig/teacherAccess`

```json
{
  "passcode": "qwer1234",
  "updatedAt": "timestamp"
}
```

This is acceptable for the classroom MVP because the requirement says the password is stored in the database. The code must isolate this lookup so a later version can switch to hashed validation or a callable Cloud Function.

### `scheduleRequests/{requestId}`

```json
{
  "createdBy": "uid",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "note": "string",
  "status": "pending | approved | rejected",
  "reviewedBy": "uid | null",
  "reviewedAt": "timestamp | null",
  "googleCalendarEventId": "string | null",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `posts/{postId}`

```json
{
  "type": "notice | volunteerIntro | lessonPlan",
  "title": "string",
  "body": "string",
  "createdBy": "uid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `activityLogs/{logId}`

```json
{
  "createdBy": "uid",
  "scheduleRequestId": "string | null",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "note": "string",
  "status": "submitted | recognized",
  "recognizedBy": "uid | null",
  "recognizedAt": "timestamp | null",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Firebase Security Rules

Rules should enforce:
- Unauthenticated users cannot read or write app data.
- Users can read their own user document.
- Users can create their own user document with `tier: "student"`.
- Students can manage only their own schedule requests and activity logs, with restricted status changes.
- Teachers can read all schedule requests and activity logs.
- Teachers can update schedule request review fields.
- Teachers can update activity log recognition fields.
- Board access is authenticated-only.

Because a pure client app cannot securely hide a plaintext teacher passcode from a determined authenticated user, this MVP follows the explicit requirement to store the passcode in Firebase while keeping the validation boundary easy to replace.

## Google Calendar Integration

The app uses Google Calendar API from the client. Firebase config stays in `.env`; Google OAuth client configuration also uses `.env`.

First implementation behavior:
- A teacher approves a schedule request.
- The teacher can create a Google Calendar event for the approved schedule.
- The created Google Calendar event ID is stored on the schedule request.
- The UI shows whether the approved request has already been added to Google Calendar.

This avoids silent background sync and makes permission prompts explicit.

## Environment Files

Commit `.env.example` with:

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

Do not commit `.env`.

## Error Handling

- Auth errors appear inline on the login form.
- Firestore permission failures show a role-aware message.
- Calendar event creation failures keep the schedule request approved but show the failed integration state.
- Empty states explain the next useful action for each tier.

## Testing and Verification

Implementation should include:
- Unit tests for tier and permission helpers.
- Component tests for role-based visibility where practical.
- Manual verification with a student user and teacher user.
- Firebase rules validation if the project includes emulator tooling.
- Build verification with `npm run build`.

## Acceptance Criteria

- A new account becomes `student`.
- Entering `qwer1234` upgrades the account to `teacher`.
- The committed example environment file documents all required Firebase and Google variables.
- The app blocks unauthenticated access to all internal screens.
- Students can create schedule requests, lesson plan posts, introductions, and activity logs.
- Teachers can approve schedule requests.
- Teachers can read all activity logs and mark them as recognized.
- Approved schedule requests can be added to Google Calendar and store the event ID.
- Firebase stores posts, account tiers, app passcode config, schedule requests, and activity logs.
