import { describe, expect, it } from "vitest";
import { isValidTimeRange } from "./dateTime";

describe("isValidTimeRange", () => {
  it("accepts strict HH:mm values when end time is after start time", () => {
    expect(isValidTimeRange("09:00", "10:30")).toBe(true);
  });

  it("rejects equal, reversed, and malformed ranges", () => {
    expect(isValidTimeRange("09:00", "09:00")).toBe(false);
    expect(isValidTimeRange("10:30", "09:00")).toBe(false);
    expect(isValidTimeRange("9:00", "10:00")).toBe(false);
    expect(isValidTimeRange("09:60", "10:00")).toBe(false);
    expect(isValidTimeRange("24:00", "25:00")).toBe(false);
  });
});
