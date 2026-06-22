import { EmptyState } from "../components/EmptyState";
import { StatusPill } from "../components/StatusPill";
import { reviewScheduleRequest } from "../services/scheduleService";
import { useFirestoreRecords } from "../services/useFirestoreRecords";
import type { ScheduleRequest, Tier, WithId } from "../types";

const PENDING_FILTERS = [{ field: "status", op: "==", value: "pending" }] as const;

export function ScheduleScreen({
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
    filters: tier === "teacher" ? PENDING_FILTERS : undefined,
  });
  const visibleRequests = requests ?? liveRecords.records;
  const isTeacher = tier === "teacher";

  async function handleReview(requestId: string, status: "approved" | "rejected") {
    await reviewScheduleRequest(requestId, userId, status);
  }

  return (
    <section className="panel screen-grid">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>{isTeacher ? "Review volunteer schedule requests" : "My schedule requests"}</h2>
          <p className="muted">
            {isTeacher
              ? "Approve or reject pending volunteer schedule requests."
              : "Check whether your volunteer schedule requests are pending, approved, or rejected."}
          </p>
        </div>
      </div>
      <div className="item-list">
        {visibleRequests.length === 0 ? <EmptyState message="No schedule requests yet." /> : null}
        {visibleRequests.map((request) => (
          <article className="list-item" key={request.id}>
            <div>
              <strong>{request.date}</strong>
              <p className="muted">
                {request.startTime}-{request.endTime} - {request.note || "No note"}
              </p>
            </div>
            <StatusPill status={request.status} />
            {isTeacher && request.status === "pending" ? (
              <div className="inline-actions">
                <button className="primary-button" onClick={() => handleReview(request.id, "approved")} type="button">
                  Approve
                </button>
                <button className="secondary-button" onClick={() => handleReview(request.id, "rejected")} type="button">
                  Reject
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
