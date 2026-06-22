import { describe, expect, it } from "vitest";
import { addMinutesToTime, getDurationMinutes, isValidTimeRange, roundDownToTenMinutes } from "./dateTime";

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

describe("duration helpers", () => {
  it("rounds current time down to the nearest 10-minute mark", () => {
    expect(roundDownToTenMinutes(new Date("2026-06-22T14:07:00"))).toBe("14:00");
    expect(roundDownToTenMinutes(new Date("2026-06-22T14:19:00"))).toBe("14:10");
  });

  it("derives end time and duration from 10-minute increments", () => {
    expect(addMinutesToTime("09:00", 30)).toBe("09:30");
    expect(addMinutesToTime("09:50", 20)).toBe("10:10");
    expect(getDurationMinutes("09:00", "10:30")).toBe(90);
  });
});
