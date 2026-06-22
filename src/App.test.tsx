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

  it("upgrades the current user to teacher from profile", async () => {
    const user = userEvent.setup();
    const refreshProfile = vi.fn();
    mockedUpgrade.mockResolvedValue(true);
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
});
