const TZ = 'Africa/Lagos';

/** Calendar date YYYY-MM-DD in Nigeria (WAT). */
export function todayIsoNg(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
