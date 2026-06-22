import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarScreen } from "./CalendarScreen";
import { useFirestoreRecords } from "../services/useFirestoreRecords";
import type { ScheduleRequest, WithId } from "../types";

vi.mock("../services/useFirestoreRecords", () => ({
  useFirestoreRecords: vi.fn(() => ({ records: [], loading: false })),
}));

describe("CalendarScreen", () => {
  beforeEach(() => {
    vi.mocked(useFirestoreRecords).mockReturnValue({ records: [], loading: false });
  });

  it("shows approved student schedule requests in a monthly calendar", () => {
    render(
      <CalendarScreen
        requests={[
          scheduleRequest({
            id: "mine-approved",
            createdBy: "student-1",
            date: "2026-06-23",
            note: "Reading support",
            status: "approved",
          }),
          scheduleRequest({
            id: "mine-pending",
            createdBy: "student-1",
            date: "2026-06-24",
            note: "Pending support",
            status: "pending",
          }),
        ]}
        tier="student"
        userId="student-1"
      />,
    );

    expect(screen.getByRole("heading", { name: "Volunteer calendar" })).toBeInTheDocument();
    expect(screen.getByText("June 2026")).toBeInTheDocument();
    expect(screen.getByText("Reading support")).toBeInTheDocument();
    expect(screen.queryByText("Pending support")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request schedule" })).not.toBeInTheDocument();
  });

  it("shows approved requests from all students to teachers", () => {
    render(
      <CalendarScreen
        tier="teacher"
        userId="teacher-1"
        requests={[
          scheduleRequest({
            id: "schedule-1",
            createdBy: "student-1",
            date: "2026-06-23",
            note: "Reading support",
            status: "approved",
          }),
          scheduleRequest({
            id: "schedule-2",
            createdBy: "student-2",
            date: "2026-06-23",
            note: "Math games",
            status: "approved",
          }),
        ]}
      />,
    );

    const dayCell = screen.getByLabelText("2026-06-23");
    expect(within(dayCell).getByText("Reading support")).toBeInTheDocument();
    expect(within(dayCell).getByText("Math games")).toBeInTheDocument();
  });

  it("subscribes to only the signed-in student's approved requests for students", () => {
    render(<CalendarScreen tier="student" userId="student-1" />);

    expect(vi.mocked(useFirestoreRecords)).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionName: "scheduleRequests",
        enabled: true,
        ownerField: "createdBy",
        ownerUid: "student-1",
        filters: [{ field: "status", op: "==", value: "approved" }],
      }),
    );
  });

  it("subscribes to all approved requests for teachers", () => {
    render(<CalendarScreen tier="teacher" userId="teacher-1" />);

    expect(vi.mocked(useFirestoreRecords)).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionName: "scheduleRequests",
        enabled: true,
        ownerField: undefined,
        ownerUid: undefined,
        filters: [{ field: "status", op: "==", value: "approved" }],
      }),
    );
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
    status: "approved",
    reviewedBy: "teacher-1",
    reviewedAt: "now",
    createdAt: "now",
    updatedAt: "now",
    ...overrides,
  };
}
