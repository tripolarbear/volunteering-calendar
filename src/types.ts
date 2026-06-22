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
