import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarScreen } from "./CalendarScreen";

describe("CalendarScreen", () => {
  it("shows schedule request form to students without approval controls", () => {
    render(<CalendarScreen requests={[]} tier="student" userId="student-1" />);

    expect(screen.getByRole("button", { name: "Request schedule" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("shows approval controls to teachers", () => {
    render(
      <CalendarScreen
        tier="teacher"
        userId="teacher-1"
        requests={[
          {
            id: "schedule-1",
            createdBy: "student-1",
            date: "2026-06-23",
            startTime: "09:00",
            endTime: "10:00",
            note: "Reading support",
            status: "pending",
            reviewedBy: null,
            reviewedAt: null,
            googleCalendarEventId: null,
            createdAt: "now",
            updatedAt: "now",
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("shows Google Calendar action for approved teacher requests without event ids", () => {
    render(
      <CalendarScreen
        tier="teacher"
        userId="teacher-1"
        requests={[
          {
            id: "schedule-1",
            createdBy: "student-1",
            date: "2026-06-23",
            startTime: "09:00",
            endTime: "10:00",
            note: "Reading support",
            status: "approved",
            reviewedBy: "teacher-1",
            reviewedAt: "now",
            googleCalendarEventId: null,
            createdAt: "now",
            updatedAt: "now",
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Add to Google Calendar" })).toBeInTheDocument();
  });
});
