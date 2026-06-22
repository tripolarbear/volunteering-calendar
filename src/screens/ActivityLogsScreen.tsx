import { FormEvent, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { StatusPill } from "../components/StatusPill";
import { isValidTimeRange } from "../domain/dateTime";
import { createActivityLog, recognizeActivityLog } from "../services/activityLogService";
import { useFirestoreRecords } from "../services/useFirestoreRecords";
import type { ActivityLog, Tier, WithId } from "../types";

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
  const [error, setError] = useState("");
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

  return (
    <section className="panel screen-grid">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Activity logs</p>
          <h2>Volunteer hour records</h2>
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
            Activity note
            <textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit">
            Submit activity log
          </button>
        </form>
      ) : null}
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

