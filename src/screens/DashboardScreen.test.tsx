import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DashboardScreen } from "./DashboardScreen";
import type { ScheduleRequest, WithId } from "../types";

describe("DashboardScreen", () => {
  it("loads pending schedule requests below the dashboard on demand", async () => {
    const user = userEvent.setup();

    render(
      <DashboardScreen
        onNavigate={vi.fn()}
        requests={[
          scheduleRequest({ id: "pending-1", note: "Reading support", status: "pending" }),
          scheduleRequest({ id: "approved-1", note: "Approved support", status: "approved" }),
        ]}
        tier="teacher"
      />,
    );

    expect(screen.queryByText("Reading support")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review schedule requests" })).not.toBeInTheDocument();
    expect(screen.queryByText("Pending schedule requests")).not.toBeInTheDocument();
    expect(screen.queryByText("Activity logs awaiting recognition")).not.toBeInTheDocument();
    expect(screen.queryByText("Internal board posts")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Recognize activity logs" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load schedule requests" }));

    expect(screen.getByText("Pending requests")).toBeInTheDocument();
    expect(screen.getByText(/Reading support/)).toBeInTheDocument();
    expect(screen.queryByText("Approved support")).not.toBeInTheDocument();
  });

  it("routes student requests to Hours without exposing a Schedule shortcut", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    const { rerender } = render(<DashboardScreen onNavigate={onNavigate} requests={[]} tier="teacher" />);
    expect(screen.queryByRole("button", { name: "Review schedule requests" })).not.toBeInTheDocument();

    rerender(<DashboardScreen onNavigate={onNavigate} requests={[]} tier="student" />);
    await user.click(screen.getByRole("button", { name: "Request a volunteer shift" }));
    expect(onNavigate).toHaveBeenCalledWith("logs");
  });
});

function scheduleRequest(
  overrides: Partial<WithId<ScheduleRequest>> = {},
): WithId<ScheduleRequest> {
  return {
    id: "schedule-1",
    createdBy: "student-1",
    date: "2026-06-23",
    startTime: "09:00",
    endTime: "10:00",
    note: "Reading support",
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: "now",
    updatedAt: "now",
    ...overrides,
  };
}
