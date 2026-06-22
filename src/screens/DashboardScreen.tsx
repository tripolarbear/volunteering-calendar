import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { StatusPill } from "../components/StatusPill";
import { useFirestoreRecords } from "../services/useFirestoreRecords";
import type { ScheduleRequest, Tier, WithId } from "../types";

const PENDING_FILTERS = [{ field: "status", op: "==", value: "pending" }] as const;

export function DashboardScreen({
  onNavigate,
  requests,
  tier,
}: {
  onNavigate(screen: "calendar" | "board" | "logs"): void;
  requests?: Array<WithId<ScheduleRequest>>;
  tier: Tier;
}) {
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const liveRequests = useFirestoreRecords<ScheduleRequest>({
    collectionName: "scheduleRequests",
    enabled: requestsLoaded && !requests,
    filters: PENDING_FILTERS,
  });
  const pendingRequests = (requests ?? liveRequests.records).filter((request) => request.status === "pending");
  const isTeacher = tier === "teacher";

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
            <button className="primary-button" onClick={() => setRequestsLoaded(true)} type="button">
              Load schedule requests
            </button>
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
          <div className="item-list">
            {liveRequests.loading ? <EmptyState message="Loading pending requests." /> : null}
            {!liveRequests.loading && pendingRequests.length === 0 ? <EmptyState message="No pending requests." /> : null}
            {pendingRequests.map((request) => (
              <article className="list-item" key={request.id}>
                <div>
                  <strong>{request.date}</strong>
                  <p className="muted">
                    {request.startTime}-{request.endTime} - {request.note || "No note"}
                  </p>
                </div>
                <StatusPill status={request.status} />
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
