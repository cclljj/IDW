import { parseModeFromUrl } from "./core/query.js";
import { formatLastUpdated } from "./core/time.js";
import { loadConfig, loadDatasets } from "./data/loadDatasets.js";
import { createMap } from "./map/createMap.js";
import { GRADIENTS } from "./map/colorScales.js";
import { buildLayers } from "./map/layers.js";
import { createLegendRenderer } from "./ui/legend.js";
import { createDisplayPanel } from "./ui/display.js";
import { setupLogoDock } from "./ui/logo.js";
import { setupNotice } from "./ui/notice.js";

const dom = {
  app: document.getElementById("app"),
  map: document.getElementById("map"),
  status: document.getElementById("status"),
  legend: document.getElementById("legend"),
  displayPanel: document.getElementById("display-panel"),
  logoDock: document.getElementById("logo-dock"),
  noticePanel: document.getElementById("notice-panel"),
  noticeTitle: document.getElementById("notice-title"),
  noticeBody: document.getElementById("notice-body")
};

const debugState = {
  bootId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  refreshCount: 0,
  activeLayerId: null,
  mode: null
};
window.__idwDebug = debugState;

function setStatus(message, level = "normal") {
  dom.status.textContent = message;
  dom.status.classList.toggle("is-warning", level === "warning");
  dom.status.classList.toggle("is-error", level === "error");
}

function summarizeValues(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return {
      min: Number.NaN,
      max: Number.NaN,
      count: 0
    };
  }

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  points.forEach((point) => {
    if (!Number.isFinite(point.value)) {
      return;
    }
    min = Math.min(min, point.value);
    max = Math.max(max, point.value);
  });

  return {
    min,
    max,
    count: points.length
  };
}

async function bootstrap() {
  const mode = parseModeFromUrl();
  debugState.mode = mode;

  if (mode.www) {
    dom.app.classList.add("mode-www");
  }

  setStatus("Loading configuration...");
  const config = await loadConfig("./config/idw-config.json");

  if (dom.noticeTitle) {
    dom.noticeTitle.textContent = config.ui.notice?.title || "Notice";
  }
  if (dom.noticeBody) {
    dom.noticeBody.textContent = config.ui.notice?.message || "";
  }

  setupNotice(dom.noticePanel, mode, config);
  const logoDock = setupLogoDock(dom.logoDock, config);

  const mapBundle = createMap("map", config, {
    onStatus: (message, level) => setStatus(message, level)
  });
  const map = mapBundle.map;

  const legend = createLegendRenderer(dom.legend);
  const displayPanel = createDisplayPanel(dom.displayPanel);
  displayPanel.showDefault();

  let activeDefinition = null;
  let selectedSensorId = null;
  let layerManager = null;

  setStatus("Loading sensor datasets...");
  const initialPayload = await loadDatasets(config, {
    warn: (message) => console.warn(message)
  });

  layerManager = buildLayers(map, initialPayload.datasets, config, mode, {
    onActiveLayerChange: ({ id, definition, points }) => {
      activeDefinition = definition;
      debugState.activeLayerId = id;

      const gradient = GRADIENTS[definition.gradientPreset] || GRADIENTS.pm25;
      legend.render(definition, { gradient });

      displayPanel.showDefault();
      displayPanel.showSummary({
        layerTitle: definition.title,
        ...summarizeValues(points)
      });

      if (selectedSensorId && layerManager) {
        const found = layerManager.findBySensorId(selectedSensorId);
        if (found) {
          displayPanel.showSensor(found, definition.title);
        }
      }
    }
  });

  map.on("click", (event) => {
    const nearest = layerManager.findNearest(event.latlng);
    if (!nearest || !activeDefinition) {
      return;
    }

    selectedSensorId = nearest.point.sensorId;
    displayPanel.showSensor(nearest.point, activeDefinition.title, nearest.distanceMeters);
  });

  function updateVersionDisplays(lastModified) {
    const versionText = formatLastUpdated(lastModified, config.ui.timezone);
    logoDock.setVersionText(versionText);
  }

  updateVersionDisplays(initialPayload.lastModified);

  if (Object.keys(initialPayload.errors).length > 0) {
    setStatus("Partial data loaded; some sources are unavailable.", "warning");
  } else {
    setStatus("Live");
  }

  const baseInterval = config.polling?.baseIntervalMs || 300000;
  const maxInterval = config.polling?.maxIntervalMs || 900000;
  let nextInterval = baseInterval;

  async function refreshLoop() {
    try {
      const payload = await loadDatasets(config, {
        warn: (message) => console.warn(message)
      });

      layerManager.updateDatasets(payload.datasets);
      updateVersionDisplays(payload.lastModified);

      if (Object.keys(payload.errors).length > 0) {
        setStatus("Updated with degraded sources.", "warning");
      } else {
        setStatus("Live");
      }

      if (selectedSensorId && activeDefinition) {
        const selected = layerManager.findBySensorId(selectedSensorId);
        if (selected) {
          displayPanel.showSensor(selected, activeDefinition.title);
        }
      }

      debugState.refreshCount += 1;
      nextInterval = baseInterval;
    } catch (error) {
      console.error(error);
      setStatus("Data update failed; retrying with backoff.", "error");
      nextInterval = Math.min(nextInterval * 2, maxInterval);
    }

    window.setTimeout(refreshLoop, nextInterval);
  }

  window.setTimeout(refreshLoop, nextInterval);
}

bootstrap().catch((error) => {
  console.error(error);
  setStatus("Initialization failed.", "error");
});
