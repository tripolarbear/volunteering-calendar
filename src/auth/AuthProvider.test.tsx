import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthProvider";

const createUserWithEmailAndPassword = vi.fn();
const signInWithEmailAndPassword = vi.fn();
const firebaseSignOut = vi.fn();
let authStateCallback: (user: { uid: string; email: string | null; displayName: string | null } | null) => void;

vi.mock("../firebase", () => ({
  auth: {},
  db: {},
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: (...args: unknown[]) => createUserWithEmailAndPassword(...args),
  onAuthStateChanged: (_auth: unknown, callback: typeof authStateCallback) => {
    authStateCallback = callback;
    return vi.fn();
  },
  signInWithEmailAndPassword: (...args: unknown[]) => signInWithEmailAndPassword(...args),
  signOut: (...args: unknown[]) => firebaseSignOut(...args),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((...parts: string[]) => parts.join("/")),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      uid: "user-1",
      email: "student@example.com",
      displayName: "Student One",
      tier: "student",
      createdAt: "now",
      updatedAt: "now",
    }),
  }),
}));

const ensureUserProfile = vi.fn().mockResolvedValue(undefined);

vi.mock("./authService", () => ({
  ensureUserProfile: (...args: unknown[]) => ensureUserProfile(...args),
}));

function Harness() {
  const auth = useAuth();

  if (auth.loading) {
    return <p>Loading</p>;
  }

  return (
    <div>
      <p>{auth.profile?.tier ?? "signed-out"}</p>
      <button onClick={() => auth.signUp("student@example.com", "password123", "Student One")}>
        Sign up
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "user-1", email: "student@example.com", displayName: "Student One" },
    });
  });

  it("exposes a student profile after Firebase auth state resolves", async () => {
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await act(async () => {
      authStateCallback({ uid: "user-1", email: "student@example.com", displayName: "Student One" });
    });

    await waitFor(() => expect(screen.getByText("student")).toBeInTheDocument());
    expect(ensureUserProfile).toHaveBeenCalledWith("user-1", "student@example.com", "Student One");
  });

  it("creates Firebase accounts from signUp", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );
    await act(async () => {
      authStateCallback(null);
    });

    await user.click(await screen.findByRole("button", { name: "Sign up" }));

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({}, "student@example.com", "password123");
  });
});
