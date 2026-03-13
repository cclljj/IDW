import { valueToColor } from "./colorScales.js";

const DEFAULT_OPTIONS = {
  opacity: 0.55,
  cellSize: 14,
  exp: 2,
  station_range: 10,
  minVal: 0,
  maxVal: 150,
  gradient: {
    0: "#00e400",
    1: "#7e0023"
  },
  showStations: true,
  stationRadius: 2,
  stationColor: "#1f2937"
};

function getNearestWeightedValue(x, y, projectedPoints, options) {
  const exp = Number.isFinite(options.exp) ? options.exp : 2;
  const nearestLimit = Math.max(1, Number.parseInt(options.station_range, 10) || 10);
  const nearest = [];

  for (const point of projectedPoints) {
    const dx = point.x - x;
    const dy = point.y - y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq < 1) {
      return point.value;
    }

    if (nearest.length < nearestLimit) {
      nearest.push({ distanceSq, value: point.value });
      nearest.sort((a, b) => a.distanceSq - b.distanceSq);
      continue;
    }

    if (distanceSq < nearest[nearest.length - 1].distanceSq) {
      nearest[nearest.length - 1] = { distanceSq, value: point.value };
      nearest.sort((a, b) => a.distanceSq - b.distanceSq);
    }
  }

  if (nearest.length === 0) {
    return Number.NaN;
  }

  let weightedSum = 0;
  let weightTotal = 0;

  for (const sample of nearest) {
    const distance = Math.max(Math.sqrt(sample.distanceSq), 0.0001);
    const weight = 1 / Math.pow(distance, exp);
    weightedSum += sample.value * weight;
    weightTotal += weight;
  }

  return weightTotal > 0 ? weightedSum / weightTotal : Number.NaN;
}

class IdwCanvasLayer extends L.Layer {
  constructor(points, options = {}) {
    super(options);
    this._points = Array.isArray(points) ? points : [];
    this._options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
    this._map = null;
    this._canvas = null;
    this._ctx = null;
    this._renderState = null;
  }

  onAdd(map) {
    this._map = map;

    if (!this._canvas) {
      this._canvas = L.DomUtil.create("canvas", "idw-canvas-layer");
      this._canvas.style.pointerEvents = "none";
      this._ctx = this._canvas.getContext("2d", { alpha: true });
    }

    map.getPanes().overlayPane.appendChild(this._canvas);

    map.on("moveend zoomend resize", this._reset, this);

    this._reset();
  }

  onRemove(map) {
    map.off("moveend zoomend resize", this._reset, this);

    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }

    this._map = null;
  }

  setPoints(points = []) {
    this._points = Array.isArray(points) ? points : [];
    this.redraw();
  }

  setOptions(options = {}) {
    this._options = {
      ...this._options,
      ...options
    };
    this.redraw();
  }

  getPoints() {
    return this._points;
  }

  getRenderState() {
    return this._renderState;
  }

  redraw() {
    if (!this._map) {
      return;
    }
    this._draw();
  }

  _reset() {
    if (!this._map || !this._canvas) {
      return;
    }

    const size = this._map.getSize();
    const topLeft = this._map.containerPointToLayerPoint([0, 0]);

    L.DomUtil.setPosition(this._canvas, topLeft);
    this._canvas.width = size.x;
    this._canvas.height = size.y;

    this._draw();
  }

  _draw() {
    if (!this._map || !this._ctx || !this._canvas) {
      return;
    }

    const width = this._canvas.width;
    const height = this._canvas.height;
    const cellSize = Math.max(4, Number.parseInt(this._options.cellSize, 10) || DEFAULT_OPTIONS.cellSize);

    this._ctx.clearRect(0, 0, width, height);
    this._ctx.globalAlpha = Math.max(0, Math.min(1, this._options.opacity));

    const projectedPoints = this._points
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng) && Number.isFinite(point.value))
      .map((point) => {
        const projected = this._map.latLngToContainerPoint([point.lat, point.lng]);
        return {
          ...point,
          x: projected.x,
          y: projected.y
        };
      });

    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const gridValues = new Float32Array(cols * rows);

    for (let row = 0; row < rows; row += 1) {
      const y = row * cellSize + cellSize / 2;
      for (let col = 0; col < cols; col += 1) {
        const x = col * cellSize + cellSize / 2;
        const value = getNearestWeightedValue(x, y, projectedPoints, this._options);
        const index = row * cols + col;

        if (!Number.isFinite(value)) {
          gridValues[index] = Number.NaN;
          continue;
        }

        gridValues[index] = value;
        this._ctx.fillStyle = valueToColor(value, this._options);
        this._ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }

    if (this._options.showStations) {
      this._ctx.globalAlpha = 0.9;
      this._ctx.fillStyle = this._options.stationColor;
      const radius = Math.max(1, Number.parseFloat(this._options.stationRadius) || 2);

      for (const point of projectedPoints) {
        this._ctx.beginPath();
        this._ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        this._ctx.fill();
      }
    }

    this._ctx.globalAlpha = 1;

    this._renderState = {
      width,
      height,
      cols,
      rows,
      cellSize,
      gridValues,
      projectedPoints,
      options: {
        ...this._options
      }
    };
  }
}

export function createIdwLayer(points, options) {
  return new IdwCanvasLayer(points, options);
}
