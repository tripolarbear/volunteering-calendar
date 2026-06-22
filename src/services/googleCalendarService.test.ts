import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGoogleCalendarEvent } from "./googleCalendarService";

describe("createGoogleCalendarEvent", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-1");
    vi.stubEnv("VITE_GOOGLE_CALENDAR_ID", "primary");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "google-event-1" }),
    }) as never;
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn(({ callback }) => ({
            requestAccessToken: () => callback({ access_token: "token-1" }),
          })),
        },
      },
    };
  });

  it("requests a token and creates a Google Calendar event", async () => {
    await expect(
      createGoogleCalendarEvent({
        requestId: "schedule-1",
        requesterId: "student-1",
        date: "2026-06-23",
        startTime: "09:00",
        endTime: "10:00",
        note: "Reading support",
      }),
    ).resolves.toBe("google-event-1");

    expect(window.google!.accounts.oauth2.initTokenClient).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "client-1",
        scope: "https://www.googleapis.com/auth/calendar.events",
      }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
      }),
    );
  });
});
