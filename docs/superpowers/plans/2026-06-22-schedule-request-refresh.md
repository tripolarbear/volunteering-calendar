# Schedule Request Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update schedule request, calendar details, and board report behavior to match the requested privacy, duration, and compact reading workflow.

**Architecture:** Keep existing Firestore collections and document-per-record reads for the UI changes, adding `durationMinutes` while preserving `endTime` for compatibility. Enforce 3,000-character post bodies now; treat 1MiB packed documents as the target limit for future post chunking because Firestore documents cannot exceed 1MiB.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Firebase Firestore.

## Global Constraints

- All schedule times use 10-minute increments.
- Users choose Date, Start time, End time, and Duration, but End time is derived from Start time plus Duration.
- "Use current time" is the default state, not a button.
- Use the label "Schedule request" instead of "Activity Report".
- Other users' schedule request posts show titles only; opening them shows `비밀글입니다.`
- Board rows are compact and bodies open in a page-style detail view.
- Board post bodies are limited to 3,000 characters.
- Firestore packed storage must stay under the official 1MiB document limit.

---

### Task 1: Duration-Based Schedule and Calendar UI

**Files:**
- Modify: `src/domain/dateTime.ts`
- Modify: `src/domain/dateTime.test.ts`
- Modify: `src/types.ts`
- Modify: `src/screens/ActivityLogsScreen.tsx`
- Modify: `src/screens/ActivityLogsScreen.test.tsx`
- Modify: `src/screens/CalendarScreen.tsx`
- Modify: `src/screens/CalendarScreen.test.tsx`
- Modify: `src/services/scheduleService.test.ts`
- Modify: `src/services/activityLogService.test.ts`
- Modify: `firestore.rules`

**Interfaces:**
- Produces: `roundDownToTenMinutes(date: Date): string`
- Produces: `addMinutesToTime(time: string, minutes: number): string`
- Produces: `getDurationMinutes(startTime: string, endTime: string): number | null`
- Produces: `durationMinutes?: number` on schedule requests and activity logs.

**Steps:**
- [ ] Write failing tests for 10-minute default time, duration-derived end time, and calendar detail fields.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement date/time helpers and wire forms to derived end times.
- [ ] Update Firestore rules and service tests for `durationMinutes`.
- [ ] Run focused tests and confirm pass.

### Task 2: Board Schedule Request Privacy and Detail View

**Files:**
- Modify: `src/screens/BoardScreen.tsx`
- Modify: `src/screens/BoardScreen.test.tsx`
- Modify: `src/services/postService.ts`
- Modify: `src/services/postService.test.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `MAX_POST_BODY_LENGTH = 3000`
- Produces: page-style selected post detail in `BoardScreen`.

**Steps:**
- [ ] Write failing tests for label unification, hidden body rows, secret-message detail, own-post detail, and 3,000-character validation.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement compact board rows and selected detail view.
- [ ] Add UI and service-level 3,000-character limits.
- [ ] Run focused tests and confirm pass.

### Task 3: Final Verification

**Files:**
- Check: all changed source and tests.

**Steps:**
- [ ] Run `npm test`.
- [ ] Run `npm run build:web`.
- [ ] Review `git diff --stat` and ensure only requested areas changed.
