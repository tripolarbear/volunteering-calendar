import { FormEvent, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { StatusPill } from "../components/StatusPill";
import { addMinutesToTime, isValidTimeRange, roundDownToTenMinutes } from "../domain/dateTime";
import { createActivityLog, recognizeActivityLog } from "../services/activityLogService";
import { createScheduleRequest } from "../services/scheduleService";
import { useFirestoreRecords } from "../services/useFirestoreRecords";
import type { ActivityLog, Tier, WithId } from "../types";

const DURATION_OPTIONS = Array.from({ length: 18 }, (_, index) => (index + 1) * 10);
const DEFAULT_DURATION_MINUTES = 60;

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getCurrentDefaults() {
  const now = new Date();
  return {
    date: formatDateInput(now),
    startTime: roundDownToTenMinutes(now),
    durationMinutes: DEFAULT_DURATION_MINUTES,
  };
}

function getScheduleSaveErrorMessage(error: unknown) {
  if (
    typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "permission-denied"
  ) {
    return "Firestore rejected this schedule. Publish the updated firestore.rules so the title field is allowed.";
  }

  return "Could not save this schedule to the database. Check your connection and try again.";
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
  const [date, setDate] = useState(() => getCurrentDefaults().date);
  const [startTime, setStartTime] = useState(() => getCurrentDefaults().startTime);
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION_MINUTES);
  const [note, setNote] = useState("");
  const [scheduleDate, setScheduleDate] = useState(() => getCurrentDefaults().date);
  const [scheduleStartTime, setScheduleStartTime] = useState(() => getCurrentDefaults().startTime);
  const [scheduleDurationMinutes, setScheduleDurationMinutes] = useState(DEFAULT_DURATION_MINUTES);
  const [scheduleTitle, setScheduleTitle] = useState("");
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
  const endTime = addMinutesToTime(startTime, durationMinutes);
  const scheduleEndTime = addMinutesToTime(scheduleStartTime, scheduleDurationMinutes);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!date || !isValidTimeRange(startTime, endTime)) {
      setError("Choose a valid date and time range.");
      return;
    }

    try {
      await createActivityLog({
        createdBy: userId,
        scheduleRequestId: null,
        date,
        startTime,
        endTime,
        durationMinutes,
        note,
      });
      const defaults = getCurrentDefaults();
      setDate(defaults.date);
      setStartTime(defaults.startTime);
      setDurationMinutes(defaults.durationMinutes);
      setNote("");
    } catch (error) {
      console.error("Activity log create failed", error);
      setError("Could not save this activity log to the database. Check your connection and try again.");
    }
  }

  async function handleCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScheduleError("");
    const trimmedScheduleTitle = scheduleTitle.trim();
    if (!trimmedScheduleTitle) {
      setScheduleError("Enter a volunteer title.");
      return;
    }
    if (!scheduleDate || !isValidTimeRange(scheduleStartTime, scheduleEndTime)) {
      setScheduleError("Choose a valid date and time range.");
      return;
    }

    try {
      await createScheduleRequest({
        createdBy: userId,
        title: trimmedScheduleTitle,
        date: scheduleDate,
        startTime: scheduleStartTime,
        endTime: scheduleEndTime,
        durationMinutes: scheduleDurationMinutes,
        note: scheduleNote,
      });
      const defaults = getCurrentDefaults();
      setScheduleDate(defaults.date);
      setScheduleStartTime(defaults.startTime);
      setScheduleDurationMinutes(defaults.durationMinutes);
      setScheduleTitle("");
      setScheduleNote("");
    } catch (error) {
      console.error("Schedule request create failed", error);
      setScheduleError(getScheduleSaveErrorMessage(error));
    }
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
        <label>
          Volunteer title
          <input
            value={scheduleTitle}
            onChange={(event) => setScheduleTitle(event.target.value)}
            placeholder="Library shelving"
            type="text"
          />
        </label>
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
          <input readOnly value={scheduleEndTime} type="time" />
        </label>
        <label>
          Duration
          <select
            value={scheduleDurationMinutes}
            onChange={(event) => setScheduleDurationMinutes(Number(event.target.value))}
          >
            {DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes}
              </option>
            ))}
          </select>
        </label>
        <div className="time-chip-grid" aria-label="Schedule duration options">
          {DURATION_OPTIONS.map((minutes) => (
            <button
              className="time-chip"
              key={minutes}
              onClick={() => setScheduleDurationMinutes(minutes)}
              type="button"
            >
              {minutes === 180 ? "+180 min" : `${minutes} min`}
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
          <input readOnly value={endTime} type="time" />
        </label>
        <label>
          Duration
          <select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}>
            {DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes}
              </option>
            ))}
          </select>
        </label>
        <div className="time-chip-grid" aria-label="Activity duration options">
          {DURATION_OPTIONS.map((minutes) => (
            <button
              className="time-chip"
              key={minutes}
              onClick={() => setDurationMinutes(minutes)}
              type="button"
            >
              {minutes === 180 ? "+180 min" : `${minutes} min`}
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

