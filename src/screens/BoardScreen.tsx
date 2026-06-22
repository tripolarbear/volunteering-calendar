import { FormEvent, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { createPost, MAX_POST_BODY_LENGTH } from "../services/postService";
import { usePostBundle } from "../services/usePostBundle";
import type { BoardPost, BoardPostType, Tier, WithId } from "../types";

const teacherPostTypes: Array<{ label: string; value: BoardPostType }> = [
  { label: "Notice", value: "notice" },
  { label: "Schedule request", value: "activityReport" },
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
  const [selectedPost, setSelectedPost] = useState<WithId<BoardPost> | null>(null);
  const liveRecords = usePostBundle({ enabled: !posts });
  const allPosts = posts ?? liveRecords.records;
  const visiblePosts = allPosts
    .filter((post) => post.type === "notice" || post.type === "activityReport")
    .sort((a, b) => {
      if (a.type === b.type) {
        return 0;
      }
      return a.type === "notice" ? -1 : 1;
    });
  const postTypes =
    tier === "teacher" ? teacherPostTypes : [{ label: "Schedule request", value: "activityReport" as const }];
  const selectedPostIsSecret =
    selectedPost?.type === "activityReport" && tier === "student" && selectedPost.createdBy !== userId;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createPost({ type, title, body, createdBy: userId });
    setTitle("");
    setBody("");
    setWriterOpen(false);
  }

  if (selectedPost) {
    return (
      <section className="panel screen-grid">
        <button className="secondary-button board-back-button" onClick={() => setSelectedPost(null)} type="button">
          Back to posts
        </button>
        <article aria-label="Board post detail" className="board-detail">
          <span className="board-row-label">{selectedPost.type === "notice" ? "Notice" : "Schedule request"}</span>
          <h2>{selectedPost.title}</h2>
          <p>{selectedPostIsSecret ? "비밀글입니다." : selectedPost.body}</p>
        </article>
      </section>
    );
  }

  return (
    <section className="panel screen-grid">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Board</p>
          <h2>Notices and schedule requests</h2>
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
            <textarea maxLength={MAX_POST_BODY_LENGTH} value={body} onChange={(event) => setBody(event.target.value)} />
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
            aria-label={post.type === "notice" ? "Notice post" : "Schedule request post"}
            className={post.type === "notice" ? "board-row board-row--notice" : "board-row"}
            key={post.id}
          >
            <button
              aria-label={`Open ${post.title}`}
              className="board-row-button"
              onClick={() => setSelectedPost(post)}
              type="button"
            >
              <span className="board-row-type" aria-hidden="true">
                {post.type === "notice" ? "!" : "S"}
              </span>
              <span className="board-row-main">
                <strong>{post.title}</strong>
              </span>
              <span className="board-row-label">{post.type === "notice" ? "Notice" : "Schedule request"}</span>
            </button>
          </li>
        ))}
      </ul>
      <button className="primary-button board-write-button" onClick={() => setWriterOpen(true)} type="button">
        Write post
      </button>
    </section>
  );
}

