import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityLogsScreen } from "./ActivityLogsScreen";

describe("ActivityLogsScreen", () => {
  it("shows activity log form to students", () => {
    render(<ActivityLogsScreen logs={[]} tier="student" userId="student-1" />);

    expect(screen.getByRole("button", { name: "Submit activity log" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Recognize hours" })).not.toBeInTheDocument();
  });

  it("shows recognition controls to teachers", () => {
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

    expect(screen.getByRole("button", { name: "Recognize hours" })).toBeInTheDocument();
  });
});

