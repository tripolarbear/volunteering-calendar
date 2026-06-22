const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(value: string) {
  const match = timePattern.exec(value);
  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function roundDownToTenMinutes(date: Date) {
  const minute = Math.floor(date.getMinutes() / 10) * 10;
  return formatTime(date.getHours(), minute);
}

export function addMinutesToTime(time: string, minutes: number) {
  const start = toMinutes(time);
  if (start === null) {
    return "";
  }

  const total = start + minutes;
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  return formatTime(hour, minute);
}

export function getDurationMinutes(startTime: string, endTime: string) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (start === null || end === null || end <= start) {
    return null;
  }

  return end - start;
}

export function isValidTimeRange(startTime: string, endTime: string) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  return start !== null && end !== null && end > start;
}
