import { FormEvent, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { StatusPill } from "../components/StatusPill";
import { isValidTimeRange } from "../domain/dateTime";
import { createActivityLog, recognizeActivityLog } from "../services/activityLogService";
import { createScheduleRequest } from "../services/scheduleService";
import { useFirestoreRecords } from "../services/useFirestoreRecords";
import type { ActivityLog, Tier, WithId } from "../types";

const DURATION_OPTIONS = Array.from({ length: 12 }, (_, index) => (index + 1) * 15);

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTimeInput(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function addMinutesToTime(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return "";
  }
  const date = new Date(2000, 0, 1, hour, minute + minutes);
  return formatTimeInput(date);
}

export function ActivityLogsScreen({
  logs,
  tier,
  userId,
}: {
  logs?: Array<WithId<ActivityLog>>;
  tier: Tier;
  userId: string;
}) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleStartTime, setScheduleStartTime] = useState("");
  const [scheduleEndTime, setScheduleEndTime] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [error, setError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const liveRecords = useFirestoreRecords<ActivityLog>({
    collectionName: "activityLogs",
    enabled: !logs,
    ownerField: tier === "student" ? "createdBy" : undefined,
    ownerUid: tier === "student" ? userId : undefined,
  });
  const visibleLogs = logs ?? liveRecords.records;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!date || !isValidTimeRange(startTime, endTime)) {
      setError("Choose a valid date and time range.");
      return;
    }

    await createActivityLog({
      createdBy: userId,
      scheduleRequestId: null,
      date,
      startTime,
      endTime,
      note,
    });
    setDate("");
    setStartTime("");
    setEndTime("");
    setNote("");
  }

  async function handleCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScheduleError("");
    if (!scheduleDate || !isValidTimeRange(scheduleStartTime, scheduleEndTime)) {
      setScheduleError("Choose a valid date and time range.");
      return;
    }

    await createScheduleRequest({
      createdBy: userId,
      date: scheduleDate,
      startTime: scheduleStartTime,
      endTime: scheduleEndTime,
      note: scheduleNote,
    });
    setScheduleDate("");
    setScheduleStartTime("");
    setScheduleEndTime("");
    setScheduleNote("");
  }

  function applyScheduleCurrentTime() {
    const now = new Date();
    setScheduleDate(formatDateInput(now));
    setScheduleStartTime(formatTimeInput(now));
    setScheduleEndTime(formatTimeInput(new Date(now.getTime() + 60 * 60 * 1000)));
  }

  function applyActivityCurrentTime() {
    const now = new Date();
    setDate(formatDateInput(now));
    setStartTime(formatTimeInput(now));
    setEndTime(formatTimeInput(new Date(now.getTime() + 60 * 60 * 1000)));
  }

  return (
    <section className="panel screen-grid">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Activity logs</p>
          <h2>Volunteer hour records</h2>
        </div>
      </div>
      <form aria-label="Schedule request" className="form-stack compact-form" onSubmit={handleCreateSchedule}>
        <h3>Schedule request</h3>
        <button className="secondary-button" onClick={applyScheduleCurrentTime} type="button">
          Use current time
        </button>
        <label>
          Date
          <input value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} type="date" />
        </label>
        <label>
          Start time
          <input
            value={scheduleStartTime}
            onChange={(event) => setScheduleStartTime(event.target.value)}
            type="time"
          />
        </label>
        <label>
          End time
          <input value={scheduleEndTime} onChange={(event) => setScheduleEndTime(event.target.value)} type="time" />
        </label>
        <div className="time-chip-grid" aria-label="Schedule duration options">
          {DURATION_OPTIONS.map((minutes) => (
            <button
              className="time-chip"
              key={minutes}
              onClick={() => setScheduleEndTime(addMinutesToTime(scheduleStartTime, minutes))}
              type="button"
            >
              +{minutes} min
            </button>
          ))}
        </div>
        <label>
          Note
          <textarea value={scheduleNote} onChange={(event) => setScheduleNote(event.target.value)} />
        </label>
        {scheduleError ? <p className="form-error">{scheduleError}</p> : null}
        <button className="primary-button" type="submit">
          Request schedule
        </button>
      </form>
      <form aria-label="Activity report" className="form-stack compact-form" onSubmit={handleCreate}>
        <h3>Activity report</h3>
        <button className="secondary-button" onClick={applyActivityCurrentTime} type="button">
          Use current time
        </button>
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
        <div className="time-chip-grid" aria-label="Activity duration options">
          {DURATION_OPTIONS.map((minutes) => (
            <button
              className="time-chip"
              key={minutes}
              onClick={() => setEndTime(addMinutesToTime(startTime, minutes))}
              type="button"
            >
              +{minutes} min
            </button>
          ))}
        </div>
        <label>
          Activity note
          <textarea value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" type="submit">
          Submit activity log
        </button>
      </form>
      <div className="item-list">
        {visibleLogs.length === 0 ? <EmptyState message="No activity logs yet." /> : null}
        {visibleLogs.map((log) => (
          <article className="list-item" key={log.id}>
            <div>
              <strong>{log.date}</strong>
              <p className="muted">
                {log.startTime}-{log.endTime} · {log.note}
              </p>
            </div>
            <StatusPill status={log.status} />
            {tier === "teacher" && log.status === "submitted" ? (
              <button
                className="primary-button"
                onClick={() => recognizeActivityLog(log.id, userId)}
                type="button"
              >
                Recognize hours
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

