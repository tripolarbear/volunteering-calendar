import type { CreatePostInput } from "../types";

export interface PostServiceDeps {
  addDocument(collectionName: string, data: Record<string, unknown>): Promise<string>;
  now(): unknown;
}

export function createPostService(deps: PostServiceDeps) {
  async function createPost(input: CreatePostInput) {
    const timestamp = deps.now();
    return deps.addDocument("posts", {
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return { createPost };
}

async function getFirebasePostService() {
  const [{ addDoc, collection, serverTimestamp }, { db }] = await Promise.all([
    import("firebase/firestore"),
    import("../firebase"),
  ]);

  return createPostService({
    async addDocument(collectionName, data) {
      const ref = await addDoc(collection(db, collectionName), data);
      return ref.id;
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

