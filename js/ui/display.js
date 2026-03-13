function normalizeUrl(url) {
  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${window.location.origin}${url}`;
  }

  return `${window.location.origin}/${url}`;
}

function parseSensorIdentity(point) {
  const fallbackSource = point.source || point.group || "Unknown";
  const link = normalizeUrl(point.url);

  if (!link) {
    return {
      source: fallbackSource,
      deviceId: point.sensorId || "N/A"
    };
  }

  try {
    const parsed = new URL(link);
    const source = parsed.searchParams.get("var-source") || fallbackSource;
    const device = parsed.searchParams.get("var-device_id") || point.sensorId || "N/A";

    return {
      source,
      deviceId: String(device).replace(/,+$/, "").trim() || "N/A"
    };
  } catch {
    return {
      source: fallbackSource,
      deviceId: point.sensorId || "N/A"
    };
  }
}

function formatValue(label, value, fractionDigits = 1) {
  if (!Number.isFinite(value)) {
    return `${label}: N/A`;
  }
  return `${label}: ${value.toFixed(fractionDigits)}`;
}

export function createDisplayPanel(container) {
  function showDefault() {
    container.innerHTML = `
      <div class="selected-title">LASS IDW Map</div>
      <div class="selected-subtitle">Click map to inspect nearest station data.</div>
    `;
  }

  function showSummary(summary) {
    if (!summary) {
      return;
    }

    const rangeText = Number.isFinite(summary.min) && Number.isFinite(summary.max)
      ? `${summary.min.toFixed(1)} - ${summary.max.toFixed(1)}`
      : "N/A";

    const summaryElement = document.createElement("div");
    summaryElement.className = "selected-meta";
    summaryElement.textContent = `Layer: ${summary.layerTitle} | Stations: ${summary.count} | Value range: ${rangeText}`;

    const firstChild = container.firstElementChild;
    if (firstChild) {
      container.insertBefore(summaryElement, firstChild.nextSibling);
    } else {
      container.appendChild(summaryElement);
    }
  }

  function showSensor(point, layerTitle, distanceMeters = null) {
    if (!point) {
      showDefault();
      return;
    }

    const identity = parseSensorIdentity(point);
    const link = normalizeUrl(point.url);

    container.innerHTML = "";

    const title = document.createElement("div");
    title.className = "selected-title";
    title.textContent = point.label || point.sensorId || "Unnamed station";

    const layer = document.createElement("div");
    layer.className = "selected-subtitle";
    layer.textContent = `Layer: ${layerTitle}`;

    const values = document.createElement("div");
    values.className = "selected-meta";
    values.textContent = [
      formatValue("PM2.5", point.pm25),
      formatValue("Temp", point.temperature),
      formatValue("Humidity", point.humidity),
      Number.isFinite(point.ratio) ? formatValue("Compare ratio", point.ratio, 2) : null
    ]
      .filter(Boolean)
      .join(" | ");

    const identityText = document.createElement("div");
    identityText.className = "selected-device";
    identityText.textContent = `Source: ${identity.source} | Group: ${point.group || "N/A"} | Device ID: ${identity.deviceId}`;

    container.append(title, layer, values, identityText);

    if (Number.isFinite(distanceMeters)) {
      const distance = document.createElement("div");
      distance.className = "selected-label";
      distance.textContent = `Distance: ${distanceMeters.toFixed(0)} m`;
      container.appendChild(distance);
    }

    if (link) {
      const anchor = document.createElement("a");
      anchor.className = "selected-link";
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = "Open sensor dashboard";
      container.appendChild(anchor);
    }
  }

  return {
    showDefault,
    showSummary,
    showSensor
  };
}
