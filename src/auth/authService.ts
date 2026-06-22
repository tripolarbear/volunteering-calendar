import type { UserProfile } from "../types";

export interface AuthServiceDeps {
  getUserProfile(uid: string): Promise<UserProfile | null>;
  createUserProfile(profile: UserProfile): Promise<void>;
  updateUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void>;
  getTeacherPasscode(): Promise<string | null>;
  now(): unknown;
}

export function createAuthService(deps: AuthServiceDeps) {
  async function ensureUserProfile(uid: string, email: string, displayName: string) {
    const existingProfile = await deps.getUserProfile(uid);
    if (existingProfile) {
      return;
    }

    const timestamp = deps.now();
    await deps.createUserProfile({
      uid,
      email,
      displayName,
      tier: "student",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async function upgradeCurrentUserToTeacher(uid: string, passcode: string) {
    const configuredPasscode = await deps.getTeacherPasscode();
    if (!configuredPasscode || configuredPasscode !== passcode) {
      return false;
    }

    await deps.updateUserProfile(uid, {
      tier: "teacher",
      updatedAt: deps.now(),
    });
    return true;
  }

  return {
    ensureUserProfile,
    upgradeCurrentUserToTeacher,
  };
}

async function getFirebaseAuthService() {
  const [{ doc, getDoc, serverTimestamp, setDoc, updateDoc }, { db }] = await Promise.all([
    import("firebase/firestore"),
    import("../firebase"),
  ]);

  return createAuthService({
    async getUserProfile(uid) {
      const snapshot = await getDoc(doc(db, "users", uid));
      return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
    },
    async createUserProfile(profile) {
      await setDoc(doc(db, "users", profile.uid), profile);
    },
    async updateUserProfile(uid, profile) {
      await updateDoc(doc(db, "users", uid), profile);
    },
    async getTeacherPasscode() {
      const snapshot = await getDoc(doc(db, "appConfig", "teacherAccess"));
      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data() as { passcode?: string };
      return data.passcode ?? null;
    },
    now() {
      return serverTimestamp();
    },
  });
}

export async function ensureUserProfile(uid: string, email: string, displayName: string) {
  const service = await getFirebaseAuthService();
  return service.ensureUserProfile(uid, email, displayName);
}

export async function upgradeCurrentUserToTeacher(uid: string, passcode: string) {
  const service = await getFirebaseAuthService();
  return service.upgradeCurrentUserToTeacher(uid, passcode);
}
