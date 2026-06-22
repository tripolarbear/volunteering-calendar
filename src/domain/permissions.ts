import type { Tier } from "../types";

export function canApproveSchedule(tier: Tier) {
  return tier === "teacher";
}

export function canRecognizeActivityLog(tier: Tier) {
  return tier === "teacher";
}

export function canReadActivityLog(tier: Tier, ownerUid: string, viewerUid: string) {
  return tier === "teacher" || ownerUid === viewerUid;
}

