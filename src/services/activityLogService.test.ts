import { beforeEach, describe, expect, it, vi } from "vitest";
import { createActivityLogService, type ActivityLogServiceDeps } from "./activityLogService";

describe("activityLogService", () => {
  let deps: ActivityLogServiceDeps;

  beforeEach(() => {
    deps = {
      addDocument: vi.fn().mockResolvedValue("log-1"),
      updateDocument: vi.fn().mockResolvedValue(undefined),
      now: vi.fn(() => "now"),
    };
  });

  it("creates submitted activity logs", async () => {
    const service = createActivityLogService(deps);

    await expect(
      service.createActivityLog({
        createdBy: "student-1",
        scheduleRequestId: "schedule-1",
        date: "2026-06-23",
        startTime: "09:00",
        endTime: "10:00",
        note: "Helped with reading class.",
      }),
    ).resolves.toBe("log-1");

    expect(deps.addDocument).toHaveBeenCalledWith("activityLogs", {
      createdBy: "student-1",
      scheduleRequestId: "schedule-1",
      date: "2026-06-23",
      startTime: "09:00",
      endTime: "10:00",
      note: "Helped with reading class.",
      status: "submitted",
      recognizedBy: null,
      recognizedAt: null,
      createdAt: "now",
      updatedAt: "now",
    });
  });

  it("recognizes activity logs with teacher metadata", async () => {
    const service = createActivityLogService(deps);

    await service.recognizeActivityLog("log-1", "teacher-1");

    expect(deps.updateDocument).toHaveBeenCalledWith("activityLogs", "log-1", {
      status: "recognized",
      recognizedBy: "teacher-1",
      recognizedAt: "now",
      updatedAt: "now",
    });
  });
});
