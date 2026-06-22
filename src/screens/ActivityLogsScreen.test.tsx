import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActivityLogsScreen } from "./ActivityLogsScreen";

describe("ActivityLogsScreen", () => {
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
});

