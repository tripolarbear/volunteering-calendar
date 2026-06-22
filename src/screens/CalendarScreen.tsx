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
          return (
            <div aria-label={dateKey || undefined} className="calendar-day" key={`${dateKey}-${index}`}>
              {day ? <strong>{day}</strong> : null}
              {dayRequests.map((request) => (
                <div className="calendar-event" key={request.id}>
                  <span>{request.note || "Volunteer shift"}</span>
                  <small>
                    {request.startTime}-{request.endTime}
                  </small>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {liveRecords.loading ? <EmptyState message="Loading approved schedules." /> : null}
      {!liveRecords.loading && visibleRequests.length === 0 ? <EmptyState message="No approved schedules yet." /> : null}
    </section>
  );
}
