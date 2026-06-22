import { FormEvent, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { StatusPill } from "../components/StatusPill";
import { isValidTimeRange } from "../domain/dateTime";
import {
  createScheduleRequest,
  markScheduleGoogleEventCreated,
  reviewScheduleRequest,
} from "../services/scheduleService";
import { createGoogleCalendarEvent } from "../services/googleCalendarService";
import { useFirestoreRecords } from "../services/useFirestoreRecords";
import type { ScheduleRequest, Tier, WithId } from "../types";

export function CalendarScreen({
  requests,
  tier,
  userId,
}: {
  requests?: Array<WithId<ScheduleRequest>>;
  tier: Tier;
  userId: string;
}) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const liveRecords = useFirestoreRecords<ScheduleRequest>({
    collectionName: "scheduleRequests",
    enabled: !requests,
    ownerField: tier === "student" ? "createdBy" : undefined,
    ownerUid: tier === "student" ? userId : undefined,
  });
  const visibleRequests = requests ?? liveRecords.records;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!date || !isValidTimeRange(startTime, endTime)) {
      setError("Choose a valid date and time range.");
      return;
    }

    await createScheduleRequest({ createdBy: userId, date, startTime, endTime, note });
    setMessage("Schedule request submitted.");
    setDate("");
    setStartTime("");
    setEndTime("");
    setNote("");
  }

  async function handleReview(requestId: string, status: "approved" | "rejected") {
    await reviewScheduleRequest(requestId, userId, status);
  }

  async function handleAddToGoogleCalendar(request: WithId<ScheduleRequest>) {
    const eventId = await createGoogleCalendarEvent({
      requestId: request.id,
      requesterId: request.createdBy,
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime,
      note: request.note,
    });
    await markScheduleGoogleEventCreated(request.id, eventId);
  }

  return (
    <section className="panel screen-grid">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>Volunteer schedule requests</h2>
        </div>
      </div>
      {tier === "student" ? (
        <form className="form-stack compact-form" onSubmit={handleCreate}>
          <label>
            Date
            <input value={date} onChange={(event) => setDate(event.target.value)} type="date" />
          </label>
          <label>
            Start time
            <input
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              type="time"
            />
          </label>
          <label>
            End time
            <input value={endTime} onChange={(event) => setEndTime(event.target.value)} type="time" />
          </label>
          <label>
            Note
            <textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          {message ? <p className="form-success">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit">
            Request schedule
          </button>
        </form>
      ) : null}
      <div className="item-list">
        {visibleRequests.length === 0 ? <EmptyState message="No schedule requests yet." /> : null}
        {visibleRequests.map((request) => (
          <article className="list-item" key={request.id}>
            <div>
              <strong>{request.date}</strong>
              <p className="muted">
                {request.startTime}-{request.endTime} · {request.note || "No note"}
              </p>
            </div>
            <StatusPill status={request.status} />
            {tier === "teacher" && request.status === "pending" ? (
              <div className="inline-actions">
                <button className="primary-button" onClick={() => handleReview(request.id, "approved")} type="button">
                  Approve
                </button>
                <button className="secondary-button" onClick={() => handleReview(request.id, "rejected")} type="button">
                  Reject
                </button>
              </div>
            ) : null}
            {tier === "teacher" && request.status === "approved" && !request.googleCalendarEventId ? (
              <button
                className="primary-button"
                onClick={() => handleAddToGoogleCalendar(request)}
                type="button"
              >
                Add to Google Calendar
              </button>
            ) : null}
            {request.googleCalendarEventId ? (
              <span className="status-pill status-pill--recognized">Google Calendar linked</span>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
