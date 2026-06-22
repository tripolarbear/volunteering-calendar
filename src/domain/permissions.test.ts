import { describe, expect, it } from "vitest";
import {
  canApproveSchedule,
  canReadActivityLog,
  canRecognizeActivityLog,
} from "./permissions";

describe("permissions", () => {
  it("allows only teachers to approve schedules", () => {
    expect(canApproveSchedule("teacher")).toBe(true);
    expect(canApproveSchedule("student")).toBe(false);
  });

  it("allows only teachers to recognize activity logs", () => {
    expect(canRecognizeActivityLog("teacher")).toBe(true);
    expect(canRecognizeActivityLog("student")).toBe(false);
  });

  it("allows students to read their own logs and teachers to read all logs", () => {
    expect(canReadActivityLog("student", "student-1", "student-1")).toBe(true);
    expect(canReadActivityLog("student", "student-1", "student-2")).toBe(false);
    expect(canReadActivityLog("teacher", "student-1", "teacher-1")).toBe(true);
  });
});

