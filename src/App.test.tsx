import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { useAuth } from "./auth/AuthProvider";
import { upgradeCurrentUserToTeacher } from "./auth/authService";

vi.mock("./auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("./auth/authService", () => ({
  upgradeCurrentUserToTeacher: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUpgrade = vi.mocked(upgradeCurrentUserToTeacher);

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockedUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });
  });

  it("renders the auth screen for signed-out visitors", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Volunteer Calendar" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows the Firebase sign-in failure reason", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const signIn = vi.fn().mockRejectedValue({ code: "auth/invalid-credential" });
    mockedUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signIn,
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(<App />);
    await user.type(screen.getByLabelText("Email"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Email or password is incorrect. Check the account and try again."),
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith("Authentication failed", { code: "auth/invalid-credential" });
    consoleError.mockRestore();
  });

  it("shows a Firebase setup message when Auth is not configured", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const signUp = vi.fn().mockRejectedValue({ code: "auth/configuration-not-found" });
    mockedUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signIn: vi.fn(),
      signUp,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Create a student account" }));
    await user.type(screen.getByLabelText("Display name"), "Student One");
    await user.type(screen.getByLabelText("Email"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText(
        "Firebase Authentication is not configured for this project. Enable Email/Password sign-in in Firebase Console and confirm this app uses the matching Firebase web config.",
      ),
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith("Authentication failed", {
      code: "auth/configuration-not-found",
    });
    consoleError.mockRestore();
  });

  it("loads the last remembered credentials into the auth form", () => {
    window.localStorage.setItem(
      "volunteer-calendar:remembered-auth",
      JSON.stringify({ email: "student@example.com", password: "saved-password" }),
    );

    render(<App />);

    expect(screen.getByLabelText("Email")).toHaveValue("student@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("saved-password");
    expect(screen.getByRole("checkbox", { name: "Remember password on this device" })).toBeChecked();
  });

  it("remembers the last password after a successful sign in", async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signIn,
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(<App />);
    await user.type(screen.getByLabelText("Email"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(window.localStorage.getItem("volunteer-calendar:remembered-auth")).toBe(
      JSON.stringify({ email: "student@example.com", password: "password123" }),
    );
  });

  it("renders internal navigation for authenticated users", () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: "user-1" } as never,
      profile: {
        uid: "user-1",
        email: "student@example.com",
        displayName: "Student One",
        tier: "student",
        createdAt: "now",
        updatedAt: "now",
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("student")).toBeInTheDocument();
  });

  it("asks for confirmation before signing out", async () => {
    const user = userEvent.setup();
    const signOut = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    mockedUseAuth.mockReturnValue({
      user: { uid: "user-1" } as never,
      profile: {
        uid: "user-1",
        email: "student@example.com",
        displayName: "Student One",
        tier: "student",
        createdAt: "now",
        updatedAt: "now",
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut,
      refreshProfile: vi.fn(),
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(confirm).toHaveBeenCalledWith("Sign out of Volunteer Calendar?");
    expect(signOut).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("offers student workflow shortcuts from the dashboard", async () => {
    const user = userEvent.setup();
    mockedUseAuth.mockReturnValue({
      user: { uid: "user-1" } as never,
      profile: {
        uid: "user-1",
        email: "student@example.com",
        displayName: "Student One",
        tier: "student",
        createdAt: "now",
        updatedAt: "now",
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("heading", { name: "Student volunteer desk" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Request a volunteer shift" }));

    expect(screen.getByRole("heading", { name: "Volunteer hour records" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Schedule request" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request schedule" })).toBeInTheDocument();
  });

  it("offers teacher review shortcuts from the dashboard", async () => {
    const user = userEvent.setup();
    mockedUseAuth.mockReturnValue({
      user: { uid: "teacher-1" } as never,
      profile: {
        uid: "teacher-1",
        email: "teacher@example.com",
        displayName: "Teacher One",
        tier: "teacher",
        createdAt: "now",
        updatedAt: "now",
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("heading", { name: "Teacher review desk" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Review schedule requests" }));

    expect(screen.getByRole("heading", { name: "Review volunteer schedule requests" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request schedule" })).not.toBeInTheDocument();
  });

  it("upgrades the current user to teacher from profile", async () => {
    const user = userEvent.setup();
    const refreshProfile = vi.fn();
    mockedUpgrade.mockResolvedValue({ ok: true });
    mockedUseAuth.mockReturnValue({
      user: { uid: "user-1" } as never,
      profile: {
        uid: "user-1",
        email: "student@example.com",
        displayName: "Student One",
        tier: "student",
        createdAt: "now",
        updatedAt: "now",
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile,
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Profile" }));
    await user.type(screen.getByLabelText("Teacher passcode"), "qwer1234");
    await user.click(screen.getByRole("button", { name: "Upgrade to teacher" }));

    expect(mockedUpgrade).toHaveBeenCalledWith("user-1", "qwer1234");
    expect(refreshProfile).toHaveBeenCalled();
    expect(await screen.findByText("Teacher tier enabled.")).toBeInTheDocument();
  });

  it("explains when the teacher passcode document is missing", async () => {
    const user = userEvent.setup();
    mockedUpgrade.mockResolvedValue({ ok: false, reason: "missing-config" });
    mockedUseAuth.mockReturnValue({
      user: { uid: "user-1" } as never,
      profile: {
        uid: "user-1",
        email: "student@example.com",
        displayName: "Student One",
        tier: "student",
        createdAt: "now",
        updatedAt: "now",
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Profile" }));
    await user.type(screen.getByLabelText("Teacher passcode"), "qwer1234");
    await user.click(screen.getByRole("button", { name: "Upgrade to teacher" }));

    expect(
      await screen.findByText(
        "Teacher passcode is not configured. Create appConfig/teacherAccess in Firestore with passcode set to qwer1234.",
      ),
    ).toBeInTheDocument();
  });

  it("disables the teacher passcode form for existing teachers", async () => {
    const user = userEvent.setup();
    mockedUseAuth.mockReturnValue({
      user: { uid: "teacher-1" } as never,
      profile: {
        uid: "teacher-1",
        email: "teacher@example.com",
        displayName: "Teacher One",
        tier: "teacher",
        createdAt: "now",
        updatedAt: "now",
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Profile" }));

    expect(screen.getByLabelText("Teacher passcode")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Upgrade to teacher" })).toBeDisabled();
    expect(screen.getByText("You are already a teacher. No passcode is needed.")).toBeInTheDocument();
  });
});
