const DEFAULT_TIMEZONE = "Asia/Taipei";

export function formatDateTime(rawValue, options = {}) {
  const timezone = options.timezone || DEFAULT_TIMEZONE;
  const value = rawValue ? new Date(rawValue) : new Date();

  if (Number.isNaN(value.valueOf())) {
    return "unknown";
  }

  return value.toLocaleString("zh-TW", {
    hour12: false,
    timeZone: timezone,
    timeZoneName: "short"
  });
}

export function formatLastUpdated(rawValue, timezone) {
  return `Last updated: ${formatDateTime(rawValue, { timezone })}`;
}
