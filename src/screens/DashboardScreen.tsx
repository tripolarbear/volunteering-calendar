import type { ActivityLog, BoardPost, ScheduleRequest, Tier, WithId } from "../types";

export function DashboardScreen({
  logs,
  posts,
  requests,
  tier,
}: {
  logs: Array<WithId<ActivityLog>>;
  posts: Array<WithId<BoardPost>>;
  requests: Array<WithId<ScheduleRequest>>;
  tier: Tier;
}) {
  const pendingRequests = requests.filter((request) => request.status === "pending").length;
  const submittedLogs = logs.filter((log) => log.status === "submitted").length;

  return (
    <section className="panel">
      <p className="eyebrow">Dashboard</p>
      <h2>{tier === "teacher" ? "Teacher review desk" : "Student volunteer desk"}</h2>
      <div className="metric-grid">
        <article>
          <strong>{pendingRequests}</strong>
          <span>Pending schedule requests</span>
        </article>
        <article>
          <strong>{submittedLogs}</strong>
          <span>Activity logs awaiting recognition</span>
        </article>
        <article>
          <strong>{posts.length}</strong>
          <span>Internal board posts</span>
        </article>
      </div>
    </section>
  );
}
