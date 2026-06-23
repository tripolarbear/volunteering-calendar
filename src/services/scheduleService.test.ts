import { beforeEach, describe, expect, it, vi } from "vitest";
import { createScheduleService, type ScheduleServiceDeps } from "./scheduleService";

describe("scheduleService", () => {
  let deps: ScheduleServiceDeps;

  beforeEach(() => {
    deps = {
      addDocument: vi.fn().mockResolvedValue("schedule-1"),
      updateDocument: vi.fn().mockResolvedValue(undefined),
      now: vi.fn(() => "now"),
    };
  });

  it("creates pending schedule requests", async () => {
    const service = createScheduleService(deps);

    await expect(
      service.createScheduleRequest({
        createdBy: "student-1",
        title: "Library shelving",
        date: "2026-06-23",
        startTime: "09:00",
        endTime: "10:00",
        durationMinutes: 60,
        note: "Story class support",
      }),
    ).resolves.toBe("schedule-1");

    expect(deps.addDocument).toHaveBeenCalledWith("scheduleRequests", {
      createdBy: "student-1",
      title: "Library shelving",
      date: "2026-06-23",
      startTime: "09:00",
      endTime: "10:00",
      durationMinutes: 60,
      note: "Story class support",
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: "now",
      updatedAt: "now",
    });
  });

  it("reviews schedule requests with teacher metadata", async () => {
    const service = createScheduleService(deps);

    await service.reviewScheduleRequest("schedule-1", "teacher-1", "approved");

    expect(deps.updateDocument).toHaveBeenCalledWith("scheduleRequests", "schedule-1", {
      status: "approved",
      reviewedBy: "teacher-1",
      reviewedAt: "now",
      updatedAt: "now",
    });
  });

});

