import { FormEvent, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { createPost } from "../services/postService";
import { useFirestoreRecords } from "../services/useFirestoreRecords";
import type { BoardPost, BoardPostType, Tier, WithId } from "../types";

const teacherPostTypes: Array<{ label: string; value: BoardPostType }> = [
  { label: "Notice", value: "notice" },
  { label: "Activity Report", value: "activityReport" },
];

export function BoardScreen({
  posts,
  tier,
  userId,
}: {
  posts?: Array<WithId<BoardPost>>;
  tier: Tier;
  userId: string;
}) {
  const [type, setType] = useState<BoardPostType>(tier === "teacher" ? "notice" : "activityReport");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const liveRecords = useFirestoreRecords<BoardPost>({ collectionName: "posts", enabled: !posts });
  const allPosts = posts ?? liveRecords.records;
  const notices = allPosts.filter((post) => post.type === "notice");
  const reports = allPosts.filter(
    (post) => post.type === "activityReport" && (tier === "teacher" || post.createdBy === userId),
  );
  const postTypes =
    tier === "teacher" ? teacherPostTypes : [{ label: "Activity Report", value: "activityReport" as const }];

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createPost({ type, title, body, createdBy: userId });
    setTitle("");
    setBody("");
  }

  return (
    <section className="panel screen-grid">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Board</p>
          <h2>Notices and activity reports</h2>
        </div>
      </div>
      <form className="form-stack compact-form" onSubmit={handleCreate}>
        <label>
          Post type
          <select value={type} onChange={(event) => setType(event.target.value as BoardPostType)}>
            {postTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Body
          <textarea value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button className="primary-button" type="submit">
          Create post
        </button>
      </form>
      <div className="board-section">
        <h3>Notices</h3>
        <div className="item-list">
          {notices.length === 0 ? <EmptyState message="No notices yet." /> : null}
          {notices.map((post) => (
            <article className="list-item list-item--single" key={post.id}>
              <div>
                <strong>{post.title}</strong>
                <p>{post.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="board-section">
        <h3>{tier === "teacher" ? "All activity reports" : "My activity reports"}</h3>
        <div className="item-list">
          {reports.length === 0 ? <EmptyState message="No activity reports yet." /> : null}
          {reports.map((post) => (
            <article className="list-item list-item--single" key={post.id}>
              <div>
                <strong>{post.title}</strong>
                <p>{post.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

