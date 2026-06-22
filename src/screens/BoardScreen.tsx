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
  const [writerOpen, setWriterOpen] = useState(false);
  const liveRecords = useFirestoreRecords<BoardPost>({ collectionName: "posts", enabled: !posts });
  const allPosts = posts ?? liveRecords.records;
  const visiblePosts = allPosts
    .filter((post) => post.type === "notice" || (post.type === "activityReport" && (tier === "teacher" || post.createdBy === userId)))
    .sort((a, b) => {
      if (a.type === b.type) {
        return 0;
      }
      return a.type === "notice" ? -1 : 1;
    });
  const postTypes =
    tier === "teacher" ? teacherPostTypes : [{ label: "Activity Report", value: "activityReport" as const }];

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createPost({ type, title, body, createdBy: userId });
    setTitle("");
    setBody("");
    setWriterOpen(false);
  }

  return (
    <section className="panel screen-grid">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Board</p>
          <h2>Notices and activity reports</h2>
        </div>
      </div>
      {writerOpen ? (
        <form aria-label="Write board post" className="form-stack board-writer" onSubmit={handleCreate}>
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
      ) : null}
      {visiblePosts.length === 0 ? <EmptyState message="No posts yet." /> : null}
      <ul aria-label="Board posts" className="board-list">
        {visiblePosts.map((post) => (
          <li
            aria-label={post.type === "notice" ? "Notice post" : "Activity report post"}
            className={post.type === "notice" ? "board-row board-row--notice" : "board-row"}
            key={post.id}
          >
            <span className="board-row-type" aria-hidden="true">
              {post.type === "notice" ? "!" : "Q"}
            </span>
            <div className="board-row-main">
              <strong>{post.title}</strong>
              <p>{post.body}</p>
            </div>
            <span className="board-row-label">{post.type === "notice" ? "Notice" : "Activity Report"}</span>
          </li>
        ))}
      </ul>
      <button className="primary-button board-write-button" onClick={() => setWriterOpen(true)} type="button">
        Write post
      </button>
    </section>
  );
}

