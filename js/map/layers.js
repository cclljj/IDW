import { createIdwLayer } from "./idwLayer.js";
import { createContourLayer } from "./contourLayer.js";
import { GRADIENTS } from "./colorScales.js";

function buildLayerPoints(definition, datasets) {
  const dataset = datasets?.[definition.dataset];
  const points = dataset?.points || [];
  const output = [];
  const fallbackFields = Array.isArray(definition.fallbackFields)
    ? definition.fallbackFields
    : [];

  for (const point of points) {
    let value = point[definition.valueField];

    if (!Number.isFinite(value) && fallbackFields.length > 0) {
      for (const field of fallbackFields) {
        if (Number.isFinite(point[field])) {
          value = point[field];
          break;
        }
      }
    }

    if (!Number.isFinite(value)) {
      continue;
    }

    output.push({
      ...point,
      value
    });
  }

  return output;
}

function findDefinitionById(definitions, id) {
  return definitions.find((definition) => definition.id === id) || null;
}

function pickInitialLayerId(config, mode) {
  if (mode.humidity) {
    const humidityLayer = config.layers.definitions.find((item) => item.valueField === "humidity");
    if (humidityLayer) {
      return humidityLayer.id;
    }
  }

  if (mode.www && config.layers.wwwDefaultLayer) {
    return config.layers.wwwDefaultLayer;
  }

  return config.layers.defaultBaseLayer;
}

export function buildLayers(map, datasets, config, mode, hooks = {}) {
  const onActiveLayerChange = hooks.onActiveLayerChange || (() => {});
  const definitions = config.layers.definitions || [];
  const layerEntries = new Map();
  const layerToId = new WeakMap();
  const baseLayers = {};

  for (const definition of definitions) {
    const points = buildLayerPoints(definition, datasets);
    const gradient = GRADIENTS[definition.gradientPreset] || GRADIENTS.pm25;
    const layer = createIdwLayer(points, {
      ...definition.idw,
      minVal: definition.minVal,
      maxVal: definition.maxVal,
      gradient
    });

    layerEntries.set(definition.id, {
      definition,
      layer,
      points
    });

    baseLayers[definition.title] = layer;
    layerToId.set(layer, definition.id);
  }

  let activeLayerId = pickInitialLayerId(config, mode);
  if (!findDefinitionById(definitions, activeLayerId) && definitions.length > 0) {
    activeLayerId = definitions[0].id;
  }

  const activeEntry = layerEntries.get(activeLayerId);
  if (activeEntry) {
    activeEntry.layer.addTo(map);
  }

  let contourLayer = null;
  const overlayLayers = {};

  if (mode.contour && activeEntry) {
    contourLayer = createContourLayer(activeEntry.layer, {
      interval: activeEntry.definition.contourInterval ?? config.layers.contourInterval ?? 10,
      lineWidth: config.layers.contourLineWidth ?? 1.2,
      opacity: config.layers.contourOpacity ?? 0.9
    });

    contourLayer.addTo(map);
    overlayLayers.Contour = contourLayer;
  }

  const control = L.control.layers(baseLayers, overlayLayers, {
    collapsed: mode.www,
    position: "topleft"
  }).addTo(map);

  function notifyActiveLayerChanged() {
    const entry = layerEntries.get(activeLayerId);
    if (!entry) {
      return;
    }

    onActiveLayerChange({
      id: activeLayerId,
      definition: entry.definition,
      points: entry.points,
      layer: entry.layer
    });
  }

  map.on("baselayerchange", (event) => {
    const nextLayerId = layerToId.get(event.layer);
    if (!nextLayerId || nextLayerId === activeLayerId) {
      return;
    }

    activeLayerId = nextLayerId;
    const nextEntry = layerEntries.get(activeLayerId);

    if (contourLayer && nextEntry) {
      contourLayer.setSourceLayer(nextEntry.layer);
      contourLayer.redraw();
    }

    notifyActiveLayerChanged();
  });

  notifyActiveLayerChanged();

  return {
    control,
    getActiveLayer() {
      return layerEntries.get(activeLayerId) || null;
    },
    getActiveLayerId() {
      return activeLayerId;
    },
    getActivePoints() {
      return this.getActiveLayer()?.points || [];
    },
    findBySensorId(sensorId) {
      if (!sensorId) {
        return null;
      }
      const active = this.getActiveLayer();
      if (!active) {
        return null;
      }
      return active.points.find((point) => point.sensorId === sensorId) || null;
    },
    findNearest(latlng) {
      const active = this.getActiveLayer();
      if (!active || active.points.length === 0) {
        return null;
      }

      let nearest = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (const point of active.points) {
        const distance = map.distance(latlng, [point.lat, point.lng]);
        if (distance < nearestDistance) {
          nearest = point;
          nearestDistance = distance;
        }
      }

      return nearest
        ? {
            point: nearest,
            distanceMeters: nearestDistance
          }
        : null;
    },
    updateDatasets(nextDatasets) {
      for (const definition of definitions) {
        const entry = layerEntries.get(definition.id);
        if (!entry) {
          continue;
        }

        const nextPoints = buildLayerPoints(definition, nextDatasets);
        entry.points = nextPoints;
        entry.layer.setPoints(nextPoints);
      }

      if (contourLayer) {
        const active = layerEntries.get(activeLayerId);
        if (active) {
          contourLayer.setSourceLayer(active.layer);
          contourLayer.redraw();
        }
      }

      notifyActiveLayerChanged();
    }
  };
}
