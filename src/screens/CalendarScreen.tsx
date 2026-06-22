import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { useFirestoreRecords } from "../services/useFirestoreRecords";
import type { ScheduleRequest, Tier, WithId } from "../types";

const APPROVED_CALENDAR_FILTERS = [{ field: "status", op: "==", value: "approved" }] as const;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function CalendarScreen({
  requests,
  tier,
  userId,
}: {
  requests?: Array<WithId<ScheduleRequest>>;
  tier: Tier;
  userId: string;
}) {
  const liveRecords = useFirestoreRecords<ScheduleRequest>({
    collectionName: "scheduleRequests",
    enabled: !requests,
    ownerField: tier === "student" ? "createdBy" : undefined,
    ownerUid: tier === "student" ? userId : undefined,
    filters: APPROVED_CALENDAR_FILTERS,
  });
  const visibleRequests = (requests ?? liveRecords.records).filter((request) => request.status === "approved");
  const [selectedRequest, setSelectedRequest] = useState<WithId<ScheduleRequest> | null>(null);
  const isTeacher = tier === "teacher";
  const monthDate = visibleRequests[0]?.date ? new Date(`${visibleRequests[0].date}T00:00:00`) : new Date();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <section className="panel screen-grid">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>Volunteer calendar</h2>
          <p className="muted">
            {isTeacher
              ? "Approved volunteer schedules from every student."
              : "Your approved volunteer schedules."}
          </p>
        </div>
      </div>
      <div className="calendar-month-heading">{`${MONTHS[month]} ${year}`}</div>
      <div className="calendar-grid">
        {WEEKDAYS.map((weekday) => (
          <div className="calendar-weekday" key={weekday}>
            {weekday}
          </div>
        ))}
        {calendarDays.map((day, index) => {
          const dateKey = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
          const dayRequests = visibleRequests.filter((request) => request.date === dateKey);
          const visibleDayRequests = dayRequests.slice(0, 2);
          const hiddenEventCount = dayRequests.length - visibleDayRequests.length;
          return (
            <div aria-label={dateKey || undefined} className="calendar-day" key={`${dateKey}-${index}`}>
              {day ? <strong>{day}</strong> : null}
              {visibleDayRequests.map((request) => (
                <button
                  aria-label={`${request.note || "Volunteer shift"} ${request.startTime}-${request.endTime}`}
                  className="calendar-event"
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  type="button"
                >
                  <span>{request.note || "Volunteer shift"}</span>
                  <small>
                    {request.startTime}-{request.endTime}
                  </small>
                </button>
              ))}
              {hiddenEventCount > 0 ? <div className="calendar-more">+{hiddenEventCount} events</div> : null}
            </div>
          );
        })}
      </div>
      {selectedRequest ? (
        <div aria-label="Schedule details" className="calendar-detail" role="dialog">
          <button
            aria-label="Close details"
            className="calendar-detail-close"
            onClick={() => setSelectedRequest(null)}
            type="button"
          >
            X
          </button>
          <p className="eyebrow">Selected schedule</p>
          <h3>{selectedRequest.note || "Volunteer shift"}</h3>
          <dl>
            <div>
              <dt>Date</dt>
              <dd>{selectedRequest.date}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>
                {selectedRequest.startTime}-{selectedRequest.endTime}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedRequest.status}</dd>
            </div>
          </dl>
        </div>
      ) : null}
      {liveRecords.loading ? <EmptyState message="Loading approved schedules." /> : null}
      {!liveRecords.loading && visibleRequests.length === 0 ? <EmptyState message="No approved schedules yet." /> : null}
    </section>
  );
}
