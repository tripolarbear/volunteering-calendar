import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("shows at most two event boxes per day and summarizes the remaining events", () => {
    render(
      <CalendarScreen
        tier="teacher"
        userId="teacher-1"
        requests={[
          scheduleRequest({ id: "schedule-1", note: "Reading support" }),
          scheduleRequest({ id: "schedule-2", note: "Math games" }),
          scheduleRequest({ id: "schedule-3", note: "Snack prep" }),
          scheduleRequest({ id: "schedule-4", note: "Cleanup" }),
        ]}
      />,
    );

    const dayCell = screen.getByLabelText("2026-06-23");
    expect(within(dayCell).getByText("Reading support")).toBeInTheDocument();
    expect(within(dayCell).getByText("Math games")).toBeInTheDocument();
    expect(within(dayCell).getByText("+2 events")).toBeInTheDocument();
    expect(within(dayCell).queryByText("Snack prep")).not.toBeInTheDocument();
    expect(within(dayCell).queryByText("Cleanup")).not.toBeInTheDocument();
  });

  it("opens event details when an event is clicked and closes them with the X button", async () => {
    const user = userEvent.setup();
    render(
      <CalendarScreen
        tier="student"
        userId="student-1"
        requests={[scheduleRequest({ id: "schedule-detail", note: "Reading support" })]}
      />,
    );

    expect(screen.queryByRole("dialog", { name: "Schedule details" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reading support 09:00-10:00" }));

    const dialog = screen.getByRole("dialog", { name: "Schedule details" });
    expect(within(dialog).queryByText("Selected schedule")).not.toBeInTheDocument();
    expect(within(dialog).getByText("Title")).toBeInTheDocument();
    expect(within(dialog).getAllByText("Reading support")).toHaveLength(2);
    expect(within(dialog).getByText("Date")).toBeInTheDocument();
    expect(within(dialog).getByText("2026-06-23")).toBeInTheDocument();
    expect(within(dialog).getByText("Start time")).toBeInTheDocument();
    expect(within(dialog).getByText("09:00")).toBeInTheDocument();
    expect(within(dialog).getByText("End time")).toBeInTheDocument();
    expect(within(dialog).getByText("10:00")).toBeInTheDocument();
    expect(within(dialog).getByText("Duration")).toBeInTheDocument();
    expect(within(dialog).getByText("60 min")).toBeInTheDocument();
    expect(within(dialog).getByText("Status")).toBeInTheDocument();
    expect(within(dialog).getByText("approved")).toBeInTheDocument();
    expect(within(dialog).getByText("Note")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Close details" }));

    expect(screen.queryByRole("dialog", { name: "Schedule details" })).not.toBeInTheDocument();
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
    durationMinutes: 60,
    note: "Reading support",
    status: "approved",
    reviewedBy: "teacher-1",
    reviewedAt: "now",
    createdAt: "now",
    updatedAt: "now",
    ...overrides,
  };
}
