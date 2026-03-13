import { fetchJsonWithFallback } from "../core/request.js";
import { adaptDataset, buildDerivedCompareDataset } from "./adapter.js";

export async function loadConfig(configPath = "./config/idw-config.json") {
  const response = await fetch(configPath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load config: HTTP ${response.status}`);
  }
  return response.json();
}

export async function loadDatasets(config, options = {}) {
  const warn = options.warn || (() => {});
  const datasets = {};
  const errors = {};
  let lastModified = null;

  const definitions = Object.entries(config.datasets || {});

  for (const [key, definition] of definitions) {
    try {
      const result = await fetchJsonWithFallback(definition.urls || [], {
        warn
      });

      const adapted = adaptDataset(result.data, definition.source || key, { warn });
      datasets[key] = adapted;
      lastModified = result.lastModified || lastModified;
    } catch (error) {
      errors[key] = error.message;
      datasets[key] = {
        points: [],
        totalRaw: 0,
        skipped: 0,
        updatedAt: null,
        meta: null
      };
      warn(`[datasets] ${key} unavailable: ${error.message}`);
    }
  }

  const calibrationPoints = [
    ...(datasets.calibration?.points || []),
    ...(datasets.epaiot?.points || [])
  ];

  datasets.compare = {
    points: buildDerivedCompareDataset(calibrationPoints, datasets.epa?.points || []),
    totalRaw: calibrationPoints.length,
    skipped: 0,
    updatedAt: datasets.calibration?.updatedAt || datasets.epaiot?.updatedAt || null,
    meta: { derived: true }
  };

  return {
    datasets,
    errors,
    lastModified,
    loadedAt: Date.now()
  };
}
