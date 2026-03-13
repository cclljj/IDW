function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : null;
}

function toStringValue(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim() || fallback;
}

function extractArrayPoint(raw) {
  return {
    lat: toNumber(raw[0]),
    lng: toNumber(raw[1]),
    pm25: toNumber(raw[2]),
    temperature: toNumber(raw[3]),
    humidity: toNumber(raw[4]),
    group: toStringValue(raw[5]),
    sensorId: toStringValue(raw[6]),
    label: toStringValue(raw[7]),
    url: toStringValue(raw[8]),
    updatedAt: raw[9] || null
  };
}

function extractObjectPoint(raw) {
  return {
    lat: toNumber(raw.lat ?? raw.latitude),
    lng: toNumber(raw.lng ?? raw.longitude ?? raw.lon),
    pm25: toNumber(raw.pm25 ?? raw.pm_25 ?? raw.value),
    temperature: toNumber(raw.temperature ?? raw.temp),
    humidity: toNumber(raw.humidity ?? raw.rh),
    group: toStringValue(raw.group ?? raw.type),
    sensorId: toStringValue(raw.sensorId ?? raw.device_id ?? raw.id),
    label: toStringValue(raw.label ?? raw.name),
    url: toStringValue(raw.url),
    updatedAt: raw.updatedAt ?? raw.timestamp ?? raw.time ?? null
  };
}

function normalizePoint(rawPoint, sourceName, index, options = {}) {
  const warn = options.warn || (() => {});
  const extracted = Array.isArray(rawPoint)
    ? extractArrayPoint(rawPoint)
    : extractObjectPoint(rawPoint);

  if (!Number.isFinite(extracted.lat) || !Number.isFinite(extracted.lng)) {
    warn(`[adapter] ${sourceName} #${index + 1} skipped: invalid lat/lng`);
    return null;
  }

  if (extracted.lat < -90 || extracted.lat > 90 || extracted.lng < -180 || extracted.lng > 180) {
    warn(`[adapter] ${sourceName} #${index + 1} skipped: out-of-range lat/lng`);
    return null;
  }

  return {
    lat: extracted.lat,
    lng: extracted.lng,
    pm25: extracted.pm25,
    temperature: extracted.temperature,
    humidity: extracted.humidity,
    source: toStringValue(sourceName, "Unknown"),
    group: toStringValue(extracted.group, toStringValue(sourceName, "Unknown")),
    sensorId: toStringValue(extracted.sensorId, `${sourceName}-${index + 1}`),
    label: toStringValue(extracted.label, `${sourceName}-${index + 1}`),
    url: toStringValue(extracted.url),
    updatedAt: extracted.updatedAt || null
  };
}

function findPointCollection(rawPayload) {
  if (Array.isArray(rawPayload)) {
    return rawPayload;
  }

  if (!rawPayload || typeof rawPayload !== "object") {
    return [];
  }

  const candidateKeys = ["points", "data", "sensors", "items"];
  for (const key of candidateKeys) {
    if (Array.isArray(rawPayload[key])) {
      return rawPayload[key];
    }
  }

  return [];
}

export function adaptDataset(rawPayload, sourceName, options = {}) {
  const warn = options.warn || (() => {});
  const points = findPointCollection(rawPayload);
  const normalized = [];

  points.forEach((point, index) => {
    const sensorPoint = normalizePoint(point, sourceName, index, { warn });
    if (sensorPoint) {
      normalized.push(sensorPoint);
    }
  });

  return {
    points: normalized,
    totalRaw: points.length,
    skipped: Math.max(points.length - normalized.length, 0),
    updatedAt: rawPayload?.updatedAt || rawPayload?.timestamp || null,
    meta: rawPayload?.meta || null
  };
}

function nearestByDistance(point, targets) {
  let nearest = null;
  let nearestDistanceSq = Number.POSITIVE_INFINITY;

  for (const target of targets) {
    const dx = point.lat - target.lat;
    const dy = point.lng - target.lng;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq < nearestDistanceSq) {
      nearestDistanceSq = distanceSq;
      nearest = target;
    }
  }

  return nearest;
}

export function buildDerivedCompareDataset(calibrationPoints, epaPoints) {
  if (!Array.isArray(calibrationPoints) || !Array.isArray(epaPoints)) {
    return [];
  }

  if (calibrationPoints.length === 0 || epaPoints.length === 0) {
    return [];
  }

  const output = [];
  for (const calPoint of calibrationPoints) {
    if (!Number.isFinite(calPoint.pm25)) {
      continue;
    }

    const nearestEpa = nearestByDistance(calPoint, epaPoints);
    if (!nearestEpa || !Number.isFinite(nearestEpa.pm25) || nearestEpa.pm25 <= 0) {
      continue;
    }

    output.push({
      ...calPoint,
      ratio: calPoint.pm25 / nearestEpa.pm25,
      source: "Compare"
    });
  }

  return output;
}
