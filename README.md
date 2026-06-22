# Volunteer Calendar

Login-only internal web app for daycare volunteer coordination. Students request schedules, write class plans, introduce themselves, and submit activity logs. Teachers approve schedules, review logs, recognize volunteer hours, and add approved schedules to Google Calendar.

## Stack

- React + Vite + TypeScript
- Firebase Authentication
- Firestore
- Google Identity Services + Google Calendar API
- Vitest + Testing Library

## Setup

1. Install dependencies.

   ```powershell
   npm install
   ```

2. Copy the example environment file.

   ```powershell
   Copy-Item .env.example .env
   ```

3. Fill `.env`.

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

4. In Firebase Console, enable Email/Password Authentication.

5. In Firestore, create the teacher passcode config document.

   Collection: `appConfig`

   Document ID: `teacherAccess`

   Fields:

   ```json
   {
     "passcode": "qwer1234"
   }
   ```

6. Publish `firestore.rules` in Firebase Console or with Firebase CLI.

7. In Google Cloud Console, enable Google Calendar API and create an OAuth client ID for a web application. Put that client ID in `VITE_GOOGLE_CLIENT_ID`.

8. Start the app.

   ```powershell
   npm run dev
   ```

## Behavior

- New accounts are treated as `student`.
- A signed-in user can enter `qwer1234` on Profile to upgrade to `teacher`.
- Students can create schedule requests, board posts for volunteer intros and lesson plans, and activity logs.
- Teachers can approve or reject schedule requests.
- Teachers can recognize submitted activity logs.
- Teachers can add approved schedule requests to Google Calendar. The created event ID is stored on the request.

## Security Note

This MVP follows the requirement that the teacher passcode is stored in Firebase. A pure client-side app cannot make a plaintext passcode fully tamper-proof against a determined authenticated user. The validation is isolated in `src/auth/authService.ts` so a later version can move the check to a Cloud Function with hashed passcode validation.

## Verification

```powershell
npm test
npm run build
```
