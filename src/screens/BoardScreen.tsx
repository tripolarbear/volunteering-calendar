import { FormEvent, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { createPost } from "../services/postService";
import { useFirestoreRecords } from "../services/useFirestoreRecords";
import type { BoardPost, BoardPostType, Tier, WithId } from "../types";

const studentPostTypes: Array<{ label: string; value: BoardPostType }> = [
  { label: "Volunteer intro", value: "volunteerIntro" },
  { label: "Lesson plan", value: "lessonPlan" },
];

const teacherPostTypes: Array<{ label: string; value: BoardPostType }> = [
  { label: "Notice", value: "notice" },
  ...studentPostTypes,
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
  const [type, setType] = useState<BoardPostType>(tier === "teacher" ? "notice" : "volunteerIntro");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const liveRecords = useFirestoreRecords<BoardPost>({ collectionName: "posts", enabled: !posts });
  const visiblePosts = posts ?? liveRecords.records;
  const postTypes = tier === "teacher" ? teacherPostTypes : studentPostTypes;

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
          <h2>Posts and class plans</h2>
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
      <div className="item-list">
        {visiblePosts.length === 0 ? <EmptyState message="No posts yet." /> : null}
        {visiblePosts.map((post) => (
          <article className="list-item" key={post.id}>
            <div>
              <strong>{post.title}</strong>
              <p className="muted">{post.type}</p>
              <p>{post.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

