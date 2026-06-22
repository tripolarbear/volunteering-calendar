import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAuthService,
  ensureUserProfile,
  upgradeCurrentUserToTeacher,
  type AuthServiceDeps,
} from "./authService";

describe("authService", () => {
  let deps: AuthServiceDeps;

  beforeEach(() => {
    deps = {
      getUserProfile: vi.fn().mockResolvedValue(null),
      createUserProfile: vi.fn().mockResolvedValue(undefined),
      updateUserProfile: vi.fn().mockResolvedValue(undefined),
      getTeacherPasscode: vi.fn().mockResolvedValue("qwer1234"),
      now: vi.fn(() => "now"),
    };
  });

  it("creates new user profiles as students", async () => {
    const service = createAuthService(deps);

    await service.ensureUserProfile("user-1", "student@example.com", "Student One");

    expect(deps.createUserProfile).toHaveBeenCalledWith({
      uid: "user-1",
      email: "student@example.com",
      displayName: "Student One",
      tier: "student",
      createdAt: "now",
      updatedAt: "now",
    });
  });

  it("does not recreate an existing user profile", async () => {
    deps.getUserProfile = vi.fn().mockResolvedValue({
      uid: "user-1",
      email: "student@example.com",
      displayName: "Student One",
      tier: "student",
      createdAt: "before",
      updatedAt: "before",
    });
    const service = createAuthService(deps);

    await service.ensureUserProfile("user-1", "student@example.com", "Student One");

    expect(deps.createUserProfile).not.toHaveBeenCalled();
  });

  it("upgrades a user to teacher when the passcode matches", async () => {
    const service = createAuthService(deps);

    await expect(service.upgradeCurrentUserToTeacher("user-1", "qwer1234")).resolves.toBe(true);

    expect(deps.updateUserProfile).toHaveBeenCalledWith("user-1", {
      tier: "teacher",
      updatedAt: "now",
    });
  });

  it("rejects teacher upgrade when the passcode does not match", async () => {
    const service = createAuthService(deps);

    await expect(service.upgradeCurrentUserToTeacher("user-1", "wrong")).resolves.toBe(false);

    expect(deps.updateUserProfile).not.toHaveBeenCalled();
  });

  it("exports default Firebase-backed auth service functions", () => {
    expect(ensureUserProfile).toBeTypeOf("function");
    expect(upgradeCurrentUserToTeacher).toBeTypeOf("function");
  });
});
