interface GoogleCalendarEventInput {
  requestId: string;
  requesterId: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback(response: GoogleTokenResponse): void;
          }): {
            requestAccessToken(): void;
          };
        };
      };
    };
  }
}

function toLocalDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

async function requestCalendarToken() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || !window.google?.accounts.oauth2) {
    throw new Error("Google Calendar client is not configured.");
  }

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/calendar.events",
      callback(response) {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? "Google token request failed."));
          return;
        }

        resolve(response.access_token);
      },
    });
    tokenClient.requestAccessToken();
  });
}

export async function createGoogleCalendarEvent(input: GoogleCalendarEventInput) {
  const token = await requestCalendarToken();
  const calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID || "primary";
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: "Volunteer schedule",
        description: `Request: ${input.requestId}\nRequester: ${input.requesterId}\n${input.note}`,
        start: { dateTime: toLocalDateTime(input.date, input.startTime) },
        end: { dateTime: toLocalDateTime(input.date, input.endTime) },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Google Calendar event creation failed.");
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) {
    throw new Error("Google Calendar response did not include an event id.");
  }

  return data.id;
}

export {};
