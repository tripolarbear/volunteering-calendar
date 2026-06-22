export type Tier = "student" | "teacher";

export type TimestampValue = unknown;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  tier: Tier;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
}

export type ScheduleStatus = "pending" | "approved" | "rejected";
export type ActivityLogStatus = "submitted" | "recognized";
export type BoardPostType = "notice" | "activityReport";

export interface CreateScheduleRequestInput {
  createdBy: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  note: string;
}

export interface ScheduleRequest extends CreateScheduleRequestInput {
  status: ScheduleStatus;
  reviewedBy: string | null;
  reviewedAt: TimestampValue | null;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
}

export interface CreatePostInput {
  type: BoardPostType;
  title: string;
  body: string;
  createdBy: string;
}

export interface BoardPost extends CreatePostInput {
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
}

export interface CreateActivityLogInput {
  createdBy: string;
  scheduleRequestId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  note: string;
}

export interface ActivityLog extends CreateActivityLogInput {
  status: ActivityLogStatus;
  recognizedBy: string | null;
  recognizedAt: TimestampValue | null;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
}

export type WithId<T> = T & { id: string };
