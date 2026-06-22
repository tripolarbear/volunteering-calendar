# Volunteer Calendar

Login-only internal web app for daycare volunteer coordination. Students request schedules, write class plans, introduce themselves, and submit activity logs. Teachers approve schedules, review logs, recognize volunteer hours, and load approved schedules from Firebase as an internal calendar.

## Stack

- React + Vite + TypeScript
- Electron
- Firebase Authentication
- Firestore
- Vitest + Testing Library

## Setup

1. Install dependencies.

   ```powershell
   npm install
   ```

2. Confirm the Firebase web app config in `src/firebase.public.config.ts`.

   This file is bundled into the app and should only contain Firebase client
   configuration that is public by design. Do not put service account JSON,
   private keys, Admin SDK credentials, or third-party API secrets in this file.

3. In Firebase Console, enable Email/Password Authentication.

4. In Firestore, create the teacher passcode config document.

   Collection: `appConfig`

   Document ID: `teacherAccess`

   Fields:

   ```json
   {
     "passcode": "qwer1234"
   }
   ```

5. Publish `firestore.rules` in Firebase Console or with Firebase CLI.

6. Start the app.

   ```powershell
   npm run dev
   ```

   To run the desktop app during development:

   ```powershell
   npm run electron:dev
   ```

   To build the Windows installer and portable exe:

   ```powershell
   npm run dist:win
   ```

## Behavior

- New accounts are treated as `student`.
- A signed-in user can enter `qwer1234` on Profile to upgrade to `teacher`.
- Students can create schedule requests, board posts for volunteer intros and lesson plans, and activity logs.
- Teachers can approve or reject schedule requests.
- Teachers can recognize submitted activity logs.
- Users can load approved schedules as an internal Firebase-backed calendar on request. The calendar query does not start until the Load calendar button is clicked.

## Security Note

This MVP follows the requirement that the teacher passcode is stored in Firebase. A pure client-side app cannot make a plaintext passcode fully tamper-proof against a determined authenticated user. The validation is isolated in `src/auth/authService.ts` so a later version can move the check to a Cloud Function with hashed passcode validation.

## Verification

```powershell
npm test
npm run build
```
