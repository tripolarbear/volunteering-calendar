import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { UserProfile } from "../types";
import { ensureUserProfile } from "./authService";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, displayName: string): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadUserProfile(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }

    setProfile(await loadUserProfile(auth.currentUser.uid));
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      await ensureUserProfile(
        nextUser.uid,
        nextUser.email ?? "",
        nextUser.displayName ?? nextUser.email ?? "Volunteer",
      );
      setProfile(await loadUserProfile(nextUser.uid));
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      async signIn(email, password) {
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signUp(email, password) {
        await createUserWithEmailAndPassword(auth, email, password);
      },
      async signOut() {
        await firebaseSignOut(auth);
      },
      refreshProfile,
    }),
    [loading, profile, refreshProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
