import type { BoardPost, CreatePostInput, WithId } from "../types";

export const MAX_POST_BODY_LENGTH = 3000;
export const MAX_POST_BUNDLE_BYTES = 1_048_576;

export interface PostBundle {
  posts: Array<WithId<BoardPost>>;
  updatedAt: unknown;
}

export interface PostServiceDeps {
  createId(): string;
  readBundle(): Promise<PostBundle | null>;
  writeBundle(bundle: PostBundle): Promise<void>;
  now(): unknown;
}

export function createPostService(deps: PostServiceDeps) {
  async function createPost(input: CreatePostInput) {
    if (input.body.length > MAX_POST_BODY_LENGTH) {
      throw new Error("Posts must be 3,000 characters or fewer.");
    }

    const timestamp = deps.now();
    const post = {
      id: deps.createId(),
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const bundle: PostBundle = {
      posts: [...((await deps.readBundle())?.posts ?? []), post],
      updatedAt: timestamp,
    };
    const bundleBytes = new TextEncoder().encode(JSON.stringify(bundle)).length;
    if (bundleBytes > MAX_POST_BUNDLE_BYTES) {
      throw new Error("Post bundle is full. Create a new 1MiB bundle before adding more posts.");
    }

    await deps.writeBundle(bundle);
    return post.id;
  }

  return { createPost };
}

async function getFirebasePostService() {
  const [{ doc, getDoc, serverTimestamp, setDoc }, { db }] = await Promise.all([
    import("firebase/firestore"),
    import("../firebase"),
  ]);
  const bundleRef = doc(db, "postBundles", "current");

  return createPostService({
    createId() {
      return crypto.randomUUID();
    },
    async readBundle() {
      const snapshot = await getDoc(bundleRef);
      return snapshot.exists() ? (snapshot.data() as PostBundle) : null;
    },
    async writeBundle(bundle) {
      await setDoc(bundleRef, bundle);
    },
    now() {
      return serverTimestamp();
    },
  });
}

export async function createPost(input: CreatePostInput) {
  const service = await getFirebasePostService();
  return service.createPost(input);
}

