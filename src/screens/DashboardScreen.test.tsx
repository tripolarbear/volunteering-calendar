import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recognizeActivityLog } from "../services/activityLogService";
import { reviewScheduleRequest } from "../services/scheduleService";
import { DashboardScreen } from "./DashboardScreen";
import type { ActivityLog, ScheduleRequest, WithId } from "../types";

vi.mock("../services/activityLogService", () => ({
  recognizeActivityLog: vi.fn(),
}));

vi.mock("../services/scheduleService", () => ({
  reviewScheduleRequest: vi.fn(),
}));

const mockedRecognizeActivityLog = vi.mocked(recognizeActivityLog);
const mockedReviewScheduleRequest = vi.mocked(reviewScheduleRequest);

describe("DashboardScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads pending schedule requests below the dashboard on demand", async () => {
    const user = userEvent.setup();

    render(
      <DashboardScreen
        activityLogs={[]}
        onNavigate={vi.fn()}
        requests={[
          scheduleRequest({ id: "pending-1", title: "Library shelving", note: "Reading support", status: "pending" }),
          scheduleRequest({ id: "approved-1", note: "Approved support", status: "approved" }),
        ]}
        tier="teacher"
        userId="teacher-1"
      />,
    );

    expect(screen.queryByText("Library shelving")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review schedule requests" })).not.toBeInTheDocument();
    expect(screen.queryByText("Pending schedule requests")).not.toBeInTheDocument();
    expect(screen.queryByText("Activity logs awaiting recognition")).not.toBeInTheDocument();
    expect(screen.queryByText("Internal board posts")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Recognize activity logs" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load schedule requests" }));

    expect(screen.getByText("Pending requests")).toBeInTheDocument();
    expect(screen.getByText(/Library shelving/)).toBeInTheDocument();
    expect(screen.queryByText("Approved support")).not.toBeInTheDocument();
  });

  it("routes student requests to Hours without exposing a Schedule shortcut", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    const { rerender } = render(
      <DashboardScreen activityLogs={[]} onNavigate={onNavigate} requests={[]} tier="teacher" userId="teacher-1" />,
    );
    expect(screen.queryByRole("button", { name: "Review schedule requests" })).not.toBeInTheDocument();

    rerender(<DashboardScreen activityLogs={[]} onNavigate={onNavigate} requests={[]} tier="student" userId="student-1" />);
    await user.click(screen.getByRole("button", { name: "Request a volunteer shift" }));
    expect(onNavigate).toHaveBeenCalledWith("logs");
  });

  it("lets teachers approve pending schedule requests into the calendar", async () => {
    const user = userEvent.setup();
    mockedReviewScheduleRequest.mockResolvedValue(undefined);

    render(
      <DashboardScreen
        activityLogs={[]}
        onNavigate={vi.fn()}
        requests={[scheduleRequest({ id: "pending-1", note: "Reading support", status: "pending" })]}
        tier="teacher"
        userId="teacher-1"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Load schedule requests" }));
    await user.click(screen.getByRole("button", { name: "Approve schedule" }));

    expect(mockedReviewScheduleRequest).toHaveBeenCalledWith("pending-1", "teacher-1", "approved");
    expect(await screen.findByText("Schedule approved for the calendar.")).toBeInTheDocument();
  });

  it("lets teachers recognize submitted volunteer hours from the dashboard", async () => {
    const user = userEvent.setup();
    mockedRecognizeActivityLog.mockResolvedValue(undefined);

    render(
      <DashboardScreen
        activityLogs={[activityLog({ id: "log-1", note: "Shelved books", status: "submitted" })]}
        onNavigate={vi.fn()}
        requests={[]}
        tier="teacher"
        userId="teacher-1"
      />,
    );

    expect(screen.queryByText("Shelved books")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load activity logs" }));
    await user.click(screen.getByRole("button", { name: "Recognize hours" }));

    expect(mockedRecognizeActivityLog).toHaveBeenCalledWith("log-1", "teacher-1");
    expect(await screen.findByText("Activity hours recognized.")).toBeInTheDocument();
  });
});

function scheduleRequest(
  overrides: Partial<WithId<ScheduleRequest>> = {},
): WithId<ScheduleRequest> {
  return {
    id: "schedule-1",
    createdBy: "student-1",
    title: "Reading support",
    date: "2026-06-23",
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    note: "Reading support",
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: "now",
    updatedAt: "now",
    ...overrides,
  };
}

function activityLog(overrides: Partial<WithId<ActivityLog>> = {}): WithId<ActivityLog> {
  return {
    id: "log-1",
    createdBy: "student-1",
    scheduleRequestId: null,
    date: "2026-06-23",
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    note: "Shelved books",
    status: "submitted",
    recognizedBy: null,
    recognizedAt: null,
    createdAt: "now",
    updatedAt: "now",
    ...overrides,
  };
}
