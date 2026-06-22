import type { CreateScheduleRequestInput, ScheduleStatus } from "../types";

export interface ScheduleServiceDeps {
  addDocument(collectionName: string, data: Record<string, unknown>): Promise<string>;
  updateDocument(collectionName: string, id: string, data: Record<string, unknown>): Promise<void>;
  now(): unknown;
}

export function createScheduleService(deps: ScheduleServiceDeps) {
  async function createScheduleRequest(input: CreateScheduleRequestInput) {
    const timestamp = deps.now();
    return deps.addDocument("scheduleRequests", {
      ...input,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      googleCalendarEventId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async function reviewScheduleRequest(
    requestId: string,
    reviewerUid: string,
    status: Exclude<ScheduleStatus, "pending">,
  ) {
    await deps.updateDocument("scheduleRequests", requestId, {
      status,
      reviewedBy: reviewerUid,
      reviewedAt: deps.now(),
      updatedAt: deps.now(),
    });
  }

  async function markScheduleGoogleEventCreated(requestId: string, eventId: string) {
    await deps.updateDocument("scheduleRequests", requestId, {
      googleCalendarEventId: eventId,
      updatedAt: deps.now(),
    });
  }

  return {
    createScheduleRequest,
    reviewScheduleRequest,
    markScheduleGoogleEventCreated,
  };
}

async function getFirebaseScheduleService() {
  const [{ addDoc, collection, doc, serverTimestamp, updateDoc }, { db }] = await Promise.all([
    import("firebase/firestore"),
    import("../firebase"),
  ]);

  return createScheduleService({
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

export async function createScheduleRequest(input: CreateScheduleRequestInput) {
  const service = await getFirebaseScheduleService();
  return service.createScheduleRequest(input);
}

export async function reviewScheduleRequest(
  requestId: string,
  reviewerUid: string,
  status: Exclude<ScheduleStatus, "pending">,
) {
  const service = await getFirebaseScheduleService();
  return service.reviewScheduleRequest(requestId, reviewerUid, status);
}

export async function markScheduleGoogleEventCreated(requestId: string, eventId: string) {
  const service = await getFirebaseScheduleService();
  return service.markScheduleGoogleEventCreated(requestId, eventId);
}

