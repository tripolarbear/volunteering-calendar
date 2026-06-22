import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPostService, MAX_POST_BODY_LENGTH, type PostServiceDeps } from "./postService";

describe("postService", () => {
  let deps: PostServiceDeps;

  beforeEach(() => {
    deps = {
      createId: vi.fn(() => "post-1"),
      readBundle: vi.fn().mockResolvedValue(null),
      writeBundle: vi.fn().mockResolvedValue(undefined),
      now: vi.fn(() => "now"),
    };
  });

  it("packs board posts into the shared post bundle", async () => {
    const service = createPostService(deps);

    await expect(
      service.createPost({
        type: "activityReport",
        title: "Reading activity",
        body: "Prepare picture books and name tags.",
        createdBy: "student-1",
      }),
    ).resolves.toBe("post-1");

    expect(deps.writeBundle).toHaveBeenCalledWith({
      posts: [
        {
          id: "post-1",
          type: "activityReport",
          title: "Reading activity",
          body: "Prepare picture books and name tags.",
          createdBy: "student-1",
          createdAt: "now",
          updatedAt: "now",
        },
      ],
      updatedAt: "now",
    });
  });

  it("appends posts to an existing shared post bundle", async () => {
    vi.mocked(deps.readBundle).mockResolvedValue({
      posts: [
        {
          id: "post-0",
          type: "notice",
          title: "Bring ID",
          body: "Bring your student ID.",
          createdBy: "teacher-1",
          createdAt: "before",
          updatedAt: "before",
        },
      ],
      updatedAt: "before",
    });
    const service = createPostService(deps);

    await service.createPost({
      type: "activityReport",
      title: "Reading activity",
      body: "Prepare picture books and name tags.",
      createdBy: "student-1",
    });

    expect(deps.writeBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        posts: [
          expect.objectContaining({ id: "post-0" }),
          expect.objectContaining({ id: "post-1" }),
        ],
      }),
    );
  });

  it("rejects board posts over 3,000 characters", async () => {
    const service = createPostService(deps);

    await expect(
      service.createPost({
        type: "activityReport",
        title: "Too long",
        body: "a".repeat(MAX_POST_BODY_LENGTH + 1),
        createdBy: "student-1",
      }),
    ).rejects.toThrow("Posts must be 3,000 characters or fewer.");

    expect(deps.writeBundle).not.toHaveBeenCalled();
  });
});

