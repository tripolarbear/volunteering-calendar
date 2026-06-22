import type { CreateActivityLogInput } from "../types";

export interface ActivityLogServiceDeps {
  addDocument(collectionName: string, data: Record<string, unknown>): Promise<string>;
  updateDocument(collectionName: string, id: string, data: Record<string, unknown>): Promise<void>;
  now(): unknown;
}

export function createActivityLogService(deps: ActivityLogServiceDeps) {
  async function createActivityLog(input: CreateActivityLogInput) {
    const timestamp = deps.now();
    return deps.addDocument("activityLogs", {
      ...input,
      status: "submitted",
      recognizedBy: null,
      recognizedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async function recognizeActivityLog(logId: string, teacherUid: string) {
    await deps.updateDocument("activityLogs", logId, {
      status: "recognized",
      recognizedBy: teacherUid,
      recognizedAt: deps.now(),
      updatedAt: deps.now(),
    });
  }

  return { createActivityLog, recognizeActivityLog };
}

async function getFirebaseActivityLogService() {
  const [{ addDoc, collection, doc, serverTimestamp, updateDoc }, { db }] = await Promise.all([
    import("firebase/firestore"),
    import("../firebase"),
  ]);

  return createActivityLogService({
    async addDocument(collectionName, data) {
      const ref = await addDoc(collection(db, collectionName), data);
      return ref.id;
    },
    async updateDocument(collectionName, id, data) {
      await updateDoc(doc(db, collectionName, id), data);
    },
    now() {
      return serverTimestamp();
    },
  });
}

export async function createActivityLog(input: CreateActivityLogInput) {
  const service = await getFirebaseActivityLogService();
  return service.createActivityLog(input);
}

export async function recognizeActivityLog(logId: string, teacherUid: string) {
  const service = await getFirebaseActivityLogService();
  return service.recognizeActivityLog(logId, teacherUid);
}
