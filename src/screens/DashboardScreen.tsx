import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { StatusPill } from "../components/StatusPill";
import { recognizeActivityLog } from "../services/activityLogService";
import { reviewScheduleRequest } from "../services/scheduleService";
import { useFirestoreRecords } from "../services/useFirestoreRecords";
import type { ActivityLog, ScheduleRequest, ScheduleStatus, Tier, WithId } from "../types";

const PENDING_FILTERS = [{ field: "status", op: "==", value: "pending" }] as const;
const SUBMITTED_ACTIVITY_FILTERS = [{ field: "status", op: "==", value: "submitted" }] as const;

function getScheduleTitle(request: ScheduleRequest) {
  return request.title || request.note || "No title";
}

export function DashboardScreen({
  activityLogs,
  onNavigate,
  requests,
  tier,
  userId,
}: {
  activityLogs?: Array<WithId<ActivityLog>>;
  onNavigate(screen: "calendar" | "board" | "logs"): void;
  requests?: Array<WithId<ScheduleRequest>>;
  tier: Tier;
  userId: string;
}) {
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [activityLogsLoaded, setActivityLogsLoaded] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [recognizingLogId, setRecognizingLogId] = useState<string | null>(null);
  const [activityMessage, setActivityMessage] = useState("");
  const [activityError, setActivityError] = useState("");
  const liveRequests = useFirestoreRecords<ScheduleRequest>({
    collectionName: "scheduleRequests",
    enabled: requestsLoaded && !requests,
    filters: PENDING_FILTERS,
  });
  const liveActivityLogs = useFirestoreRecords<ActivityLog>({
    collectionName: "activityLogs",
    enabled: activityLogsLoaded && !activityLogs && tier === "teacher",
    filters: SUBMITTED_ACTIVITY_FILTERS,
  });
  const pendingRequests = (requests ?? liveRequests.records).filter((request) => request.status === "pending");
  const submittedActivityLogs = (activityLogs ?? liveActivityLogs.records).filter((log) => log.status === "submitted");
  const isTeacher = tier === "teacher";

  async function handleReview(requestId: string, status: Exclude<ScheduleStatus, "pending">) {
    setReviewingId(requestId);
    setReviewMessage("");
    setReviewError("");

    try {
      await reviewScheduleRequest(requestId, userId, status);
      setReviewMessage(status === "approved" ? "Schedule approved for the calendar." : "Schedule rejected.");
    } catch (error) {
      console.error("Schedule review failed", error);
      setReviewError("Could not update this schedule in the database. Check your teacher access and try again.");
    } finally {
      setReviewingId(null);
    }
  }

  async function handleRecognizeActivityLog(logId: string) {
    setRecognizingLogId(logId);
    setActivityMessage("");
    setActivityError("");

    try {
      await recognizeActivityLog(logId, userId);
      setActivityMessage("Activity hours recognized.");
    } catch (error) {
      console.error("Activity log recognition failed", error);
      setActivityError("Could not recognize these hours in the database. Check your teacher access and try again.");
    } finally {
      setRecognizingLogId(null);
    }
  }

  return (
    <section className="panel screen-grid">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>{isTeacher ? "Teacher review desk" : "Student volunteer desk"}</h2>
          <p className="muted">
            {isTeacher
              ? "Start with pending schedule requests, then recognize submitted volunteer hours."
              : "Request a volunteer shift first, then come back to submit your completed hours."}
          </p>
        </div>
        <div className="quick-actions" aria-label="Suggested next steps">
          {isTeacher ? (
            <>
              <button className="primary-button" onClick={() => setRequestsLoaded(true)} type="button">
                Load schedule requests
              </button>
              <button className="secondary-button" onClick={() => setActivityLogsLoaded(true)} type="button">
                Load activity logs
              </button>
            </>
          ) : (
            <>
              <button className="primary-button" onClick={() => onNavigate("logs")} type="button">
                Request a volunteer shift
              </button>
              <button className="secondary-button" onClick={() => onNavigate("logs")} type="button">
                Submit completed hours
              </button>
            </>
          )}
        </div>
      </div>
      {!isTeacher ? (
        <button className="primary-button dashboard-load-button" onClick={() => setRequestsLoaded(true)} type="button">
          Load schedule requests
        </button>
      ) : null}
      {requestsLoaded ? (
        <div className="dashboard-pending">
          <h3>Pending requests</h3>
          {reviewMessage ? <p className="form-success">{reviewMessage}</p> : null}
          {reviewError ? <p className="form-error">{reviewError}</p> : null}
          <div className="item-list">
            {liveRequests.loading ? <EmptyState message="Loading pending requests." /> : null}
            {!liveRequests.loading && pendingRequests.length === 0 ? <EmptyState message="No pending requests." /> : null}
            {pendingRequests.map((request) => (
              <article className="list-item" key={request.id}>
                <div>
                  <strong>{getScheduleTitle(request)}</strong>
                  <p className="muted">
                    {request.date} {request.startTime}-{request.endTime} - {request.note || "No note"}
                  </p>
                </div>
                <StatusPill status={request.status} />
                {isTeacher ? (
                  <>
                    <button
                      className="primary-button"
                      disabled={reviewingId === request.id}
                      onClick={() => void handleReview(request.id, "approved")}
                      type="button"
                    >
                      Approve schedule
                    </button>
                    <button
                      className="secondary-button"
                      disabled={reviewingId === request.id}
                      onClick={() => void handleReview(request.id, "rejected")}
                      type="button"
                    >
                      Reject schedule
                    </button>
                  </>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {activityLogsLoaded ? (
        <div className="dashboard-pending">
          <h3>Submitted activity logs</h3>
          {activityMessage ? <p className="form-success">{activityMessage}</p> : null}
          {activityError ? <p className="form-error">{activityError}</p> : null}
          <div className="item-list">
            {liveActivityLogs.loading ? <EmptyState message="Loading submitted activity logs." /> : null}
            {!liveActivityLogs.loading && submittedActivityLogs.length === 0 ? (
              <EmptyState message="No submitted activity logs." />
            ) : null}
            {submittedActivityLogs.map((log) => (
              <article className="list-item" key={log.id}>
                <div>
                  <strong>{log.date}</strong>
                  <p className="muted">
                    {log.startTime}-{log.endTime} - {log.note || "No note"}
                  </p>
                </div>
                <StatusPill status={log.status} />
                <button
                  className="primary-button"
                  disabled={recognizingLogId === log.id}
                  onClick={() => void handleRecognizeActivityLog(log.id)}
                  type="button"
                >
                  Recognize hours
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
