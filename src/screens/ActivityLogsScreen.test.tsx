import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("fills today's date, current time, and a one-hour end time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T14:07:00"));

    render(<ActivityLogsScreen logs={[]} tier="student" userId="student-1" />);

    const scheduleForm = screen.getByRole("form", { name: "Schedule request" });
    fireEvent.click(within(scheduleForm).getByRole("button", { name: "Use current time" }));

    expect(within(scheduleForm).getByLabelText("Date")).toHaveValue("2026-06-22");
    expect(within(scheduleForm).getByLabelText("Start time")).toHaveValue("14:07");
    expect(within(scheduleForm).getByLabelText("End time")).toHaveValue("15:07");
  });

  it("offers 15-minute end-time increments up to three hours", async () => {
    const user = userEvent.setup();

    render(<ActivityLogsScreen logs={[]} tier="student" userId="student-1" />);

    const scheduleForm = screen.getByRole("form", { name: "Schedule request" });
    await user.type(within(scheduleForm).getByLabelText("Start time"), "09:00");

    expect(within(scheduleForm).getByRole("button", { name: "+15 min" })).toBeInTheDocument();
    expect(within(scheduleForm).getByRole("button", { name: "+180 min" })).toBeInTheDocument();

    await user.click(within(scheduleForm).getByRole("button", { name: "+45 min" }));

    expect(within(scheduleForm).getByLabelText("End time")).toHaveValue("09:45");
  });
});

