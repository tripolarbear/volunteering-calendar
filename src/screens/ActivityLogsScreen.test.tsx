import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createActivityLog, recognizeActivityLog } from "../services/activityLogService";
import { createScheduleRequest } from "../services/scheduleService";
import { ActivityLogsScreen } from "./ActivityLogsScreen";

vi.mock("../services/activityLogService", () => ({
  createActivityLog: vi.fn(),
  recognizeActivityLog: vi.fn(),
}));

vi.mock("../services/scheduleService", () => ({
  createScheduleRequest: vi.fn(),
}));

const mockedCreateActivityLog = vi.mocked(createActivityLog);
const mockedCreateScheduleRequest = vi.mocked(createScheduleRequest);

describe("ActivityLogsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateActivityLog.mockResolvedValue("log-1");
    mockedCreateScheduleRequest.mockResolvedValue("schedule-1");
    vi.mocked(recognizeActivityLog).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the same request and activity log forms to students", () => {
    render(<ActivityLogsScreen logs={[]} tier="student" userId="student-1" />);

    expect(screen.getByRole("button", { name: "Request schedule" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit activity log" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Recognize hours" })).not.toBeInTheDocument();
  });

  it("shows the same request and activity log forms to teachers", () => {
    render(
      <ActivityLogsScreen
        tier="teacher"
        userId="teacher-1"
        logs={[
          {
            id: "log-1",
            createdBy: "student-1",
            scheduleRequestId: "schedule-1",
            date: "2026-06-23",
            startTime: "09:00",
            endTime: "10:00",
            durationMinutes: 60,
            note: "Helped reading class.",
            status: "submitted",
            recognizedBy: null,
            recognizedAt: null,
            createdAt: "now",
            updatedAt: "now",
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Request schedule" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recognize hours" })).toBeInTheDocument();
  });

  it("defaults schedule requests to today's date, rounded current time, and a one-hour duration", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T14:07:00"));

    render(<ActivityLogsScreen logs={[]} tier="student" userId="student-1" />);

    const scheduleForm = screen.getByRole("form", { name: "Schedule request" });

    expect(within(scheduleForm).getByLabelText("Volunteer title")).toHaveValue("");
    expect(within(scheduleForm).getByLabelText("Date")).toHaveValue("2026-06-22");
    expect(within(scheduleForm).getByLabelText("Start time")).toHaveValue("14:00");
    expect(within(scheduleForm).getByLabelText("Duration")).toHaveValue("60");
    expect(within(scheduleForm).getByLabelText("End time")).toHaveValue("15:00");
    expect(within(scheduleForm).queryByRole("button", { name: "Use current time" })).not.toBeInTheDocument();
  });

  it("offers 10-minute duration increments and derives the end time", async () => {
    const user = userEvent.setup();

    render(<ActivityLogsScreen logs={[]} tier="student" userId="student-1" />);

    const scheduleForm = screen.getByRole("form", { name: "Schedule request" });
    await user.clear(within(scheduleForm).getByLabelText("Start time"));
    await user.type(within(scheduleForm).getByLabelText("Start time"), "09:00");

    expect(within(scheduleForm).getByRole("button", { name: "10 min" })).toBeInTheDocument();
    expect(within(scheduleForm).getByRole("button", { name: "+180 min" })).toBeInTheDocument();

    await user.click(within(scheduleForm).getByRole("button", { name: "30 min" }));

    expect(within(scheduleForm).getByLabelText("Duration")).toHaveValue("30");
    expect(within(scheduleForm).getByLabelText("End time")).toHaveValue("09:30");
  });

  it("submits schedule requests with a required title and time details", async () => {
    const user = userEvent.setup();

    render(<ActivityLogsScreen logs={[]} tier="student" userId="student-1" />);

    const scheduleForm = screen.getByRole("form", { name: "Schedule request" });
    await user.type(within(scheduleForm).getByLabelText("Volunteer title"), "Library shelving");
    await user.clear(within(scheduleForm).getByLabelText("Date"));
    await user.type(within(scheduleForm).getByLabelText("Date"), "2026-06-23");
    await user.clear(within(scheduleForm).getByLabelText("Start time"));
    await user.type(within(scheduleForm).getByLabelText("Start time"), "09:00");
    await user.click(within(scheduleForm).getByRole("button", { name: "30 min" }));
    await user.type(within(scheduleForm).getByLabelText("Note"), "Bring cart.");
    await user.click(within(scheduleForm).getByRole("button", { name: "Request schedule" }));

    expect(mockedCreateScheduleRequest).toHaveBeenCalledWith({
      createdBy: "student-1",
      title: "Library shelving",
      date: "2026-06-23",
      startTime: "09:00",
      endTime: "09:30",
      durationMinutes: 30,
      note: "Bring cart.",
    });
  });

  it("does not submit a schedule request without a title", async () => {
    const user = userEvent.setup();

    render(<ActivityLogsScreen logs={[]} tier="student" userId="student-1" />);

    const scheduleForm = screen.getByRole("form", { name: "Schedule request" });
    await user.click(within(scheduleForm).getByRole("button", { name: "Request schedule" }));

    expect(mockedCreateScheduleRequest).not.toHaveBeenCalled();
    expect(within(scheduleForm).getByText("Enter a volunteer title.")).toBeInTheDocument();
  });

  it("explains when Firestore rules reject schedule requests", async () => {
    const user = userEvent.setup();
    mockedCreateScheduleRequest.mockRejectedValue({ code: "permission-denied" });

    render(<ActivityLogsScreen logs={[]} tier="student" userId="student-1" />);

    const scheduleForm = screen.getByRole("form", { name: "Schedule request" });
    await user.type(within(scheduleForm).getByLabelText("Volunteer title"), "Library shelving");
    await user.click(within(scheduleForm).getByRole("button", { name: "Request schedule" }));

    expect(
      await within(scheduleForm).findByText(
        "Firestore rejected this schedule. Publish the updated firestore.rules so the title field is allowed.",
      ),
    ).toBeInTheDocument();
  });
});

