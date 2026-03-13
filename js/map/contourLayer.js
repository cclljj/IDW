import { valueToColor } from "./colorScales.js";

const DEFAULT_OPTIONS = {
  interval: 10,
  lineWidth: 1.2,
  opacity: 0.9
};

const CASE_SEGMENTS = {
  0: [],
  1: [[3, 0]],
  2: [[0, 1]],
  3: [[3, 1]],
  4: [[1, 2]],
  5: [[3, 2], [0, 1]],
  6: [[0, 2]],
  7: [[3, 2]],
  8: [[2, 3]],
  9: [[0, 2]],
  10: [[0, 3], [1, 2]],
  11: [[1, 2]],
  12: [[1, 3]],
  13: [[0, 1]],
  14: [[0, 3]],
  15: []
};

function edgePoint(edge, values, threshold) {
  const [v0, v1, v2, v3] = values;

  if (edge === 0) {
    const t = (threshold - v0) / (v1 - v0 || Number.EPSILON);
    return [Math.max(0, Math.min(1, t)), 0];
  }

  if (edge === 1) {
    const t = (threshold - v1) / (v2 - v1 || Number.EPSILON);
    return [1, Math.max(0, Math.min(1, t))];
  }

  if (edge === 2) {
    const t = (threshold - v3) / (v2 - v3 || Number.EPSILON);
    return [Math.max(0, Math.min(1, t)), 1];
  }

  const t = (threshold - v0) / (v3 - v0 || Number.EPSILON);
  return [0, Math.max(0, Math.min(1, t))];
}

class ContourCanvasLayer extends L.Layer {
  constructor(sourceLayer, options = {}) {
    super(options);
    this._sourceLayer = sourceLayer;
    this._options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
    this._map = null;
    this._canvas = null;
    this._ctx = null;
  }

  onAdd(map) {
    this._map = map;

    if (!this._canvas) {
      this._canvas = L.DomUtil.create("canvas", "idw-contour-layer");
      this._canvas.style.pointerEvents = "none";
      this._ctx = this._canvas.getContext("2d", { alpha: true });
    }

    map.getPanes().overlayPane.appendChild(this._canvas);
    map.on("moveend zoomend resize", this._reset, this);

    this._reset();
  }

  onRemove(map) {
    map.off("moveend zoomend resize", this._reset, this);

    if (this._canvas?.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }

    this._map = null;
  }

  setSourceLayer(sourceLayer) {
    this._sourceLayer = sourceLayer;
    this.redraw();
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

  _buildThresholds(minVal, maxVal, interval) {
    const thresholds = [];
    const step = Math.max(0.1, interval);

    for (let value = minVal + step; value < maxVal; value += step) {
      thresholds.push(value);
    }

    return thresholds;
  }

  _drawSegment(col, row, from, to, cellSize) {
    if (!this._ctx) {
      return;
    }

    this._ctx.beginPath();
    this._ctx.moveTo((col + from[0]) * cellSize + cellSize / 2, (row + from[1]) * cellSize + cellSize / 2);
    this._ctx.lineTo((col + to[0]) * cellSize + cellSize / 2, (row + to[1]) * cellSize + cellSize / 2);
    this._ctx.stroke();
  }

  _draw() {
    if (!this._ctx || !this._canvas || !this._sourceLayer) {
      return;
    }

    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    const state = this._sourceLayer.getRenderState?.();
    if (!state || !state.gridValues?.length) {
      return;
    }

    const layerOptions = state.options || {};
    const minVal = Number.isFinite(layerOptions.minVal) ? layerOptions.minVal : 0;
    const maxVal = Number.isFinite(layerOptions.maxVal) ? layerOptions.maxVal : 100;
    const interval = Number.parseFloat(this._options.interval) || DEFAULT_OPTIONS.interval;
    const thresholds = this._buildThresholds(minVal, maxVal, interval);

    if (thresholds.length === 0) {
      return;
    }

    this._ctx.globalAlpha = Math.max(0, Math.min(1, this._options.opacity));
    this._ctx.lineWidth = Math.max(0.5, Number.parseFloat(this._options.lineWidth) || DEFAULT_OPTIONS.lineWidth);

    for (const threshold of thresholds) {
      this._ctx.strokeStyle = valueToColor(threshold, {
        minVal,
        maxVal,
        gradient: layerOptions.gradient || {}
      });

      for (let row = 0; row < state.rows - 1; row += 1) {
        for (let col = 0; col < state.cols - 1; col += 1) {
          const topLeft = state.gridValues[row * state.cols + col];
          const topRight = state.gridValues[row * state.cols + col + 1];
          const bottomRight = state.gridValues[(row + 1) * state.cols + col + 1];
          const bottomLeft = state.gridValues[(row + 1) * state.cols + col];

          if (
            !Number.isFinite(topLeft) ||
            !Number.isFinite(topRight) ||
            !Number.isFinite(bottomRight) ||
            !Number.isFinite(bottomLeft)
          ) {
            continue;
          }

          const values = [topLeft, topRight, bottomRight, bottomLeft];
          const bitmask =
            (topLeft >= threshold ? 1 : 0) |
            (topRight >= threshold ? 2 : 0) |
            (bottomRight >= threshold ? 4 : 0) |
            (bottomLeft >= threshold ? 8 : 0);

          const segments = CASE_SEGMENTS[bitmask] || [];
          for (const [edgeStart, edgeEnd] of segments) {
            const from = edgePoint(edgeStart, values, threshold);
            const to = edgePoint(edgeEnd, values, threshold);
            this._drawSegment(col, row, from, to, state.cellSize);
          }
        }
      }
    }

    this._ctx.globalAlpha = 1;
  }
}

export function createContourLayer(sourceLayer, options = {}) {
  return new ContourCanvasLayer(sourceLayer, options);
}
