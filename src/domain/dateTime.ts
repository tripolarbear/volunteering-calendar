const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(value: string) {
  const match = timePattern.exec(value);
  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function isValidTimeRange(startTime: string, endTime: string) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  return start !== null && end !== null && end > start;
}
