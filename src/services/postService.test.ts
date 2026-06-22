import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPostService, type PostServiceDeps } from "./postService";

describe("postService", () => {
  let deps: PostServiceDeps;

  beforeEach(() => {
    deps = {
      addDocument: vi.fn().mockResolvedValue("post-1"),
      now: vi.fn(() => "now"),
    };
  });

  it("creates board posts with author and timestamps", async () => {
    const service = createPostService(deps);

    await expect(
      service.createPost({
        type: "activityReport",
        title: "Reading activity",
        body: "Prepare picture books and name tags.",
        createdBy: "student-1",
      }),
    ).resolves.toBe("post-1");

    expect(deps.addDocument).toHaveBeenCalledWith("posts", {
      type: "activityReport",
      title: "Reading activity",
      body: "Prepare picture books and name tags.",
      createdBy: "student-1",
      createdAt: "now",
      updatedAt: "now",
    });
  });
});

