function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseHexColor(hex) {
  const value = String(hex || "").replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function toHexChannel(value) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
}

function mixHexColors(leftHex, rightHex, ratio) {
  const left = parseHexColor(leftHex);
  const right = parseHexColor(rightHex);
  const t = clamp(ratio, 0, 1);

  const r = left.r + (right.r - left.r) * t;
  const g = left.g + (right.g - left.g) * t;
  const b = left.b + (right.b - left.b) * t;

  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

export function normalizeGradient(gradient) {
  const entries = Object.entries(gradient || {}).map(([offset, color]) => [Number.parseFloat(offset), color]);
  return entries
    .filter(([offset]) => Number.isFinite(offset))
    .sort((a, b) => a[0] - b[0]);
}

export function valueToColor(value, options) {
  const minVal = options.minVal ?? 0;
  const maxVal = options.maxVal ?? 100;
  const gradientPairs = normalizeGradient(options.gradient);

  if (!Number.isFinite(value) || gradientPairs.length === 0) {
    return "#000000";
  }

  if (maxVal <= minVal) {
    return gradientPairs[gradientPairs.length - 1][1];
  }

  const normalized = clamp((value - minVal) / (maxVal - minVal), 0, 1);

  if (normalized <= gradientPairs[0][0]) {
    return gradientPairs[0][1];
  }

  for (let index = 1; index < gradientPairs.length; index += 1) {
    const [rightOffset, rightColor] = gradientPairs[index];
    const [leftOffset, leftColor] = gradientPairs[index - 1];

    if (normalized <= rightOffset) {
      const width = Math.max(rightOffset - leftOffset, Number.EPSILON);
      const ratio = (normalized - leftOffset) / width;
      return mixHexColors(leftColor, rightColor, ratio);
    }
  }

  return gradientPairs[gradientPairs.length - 1][1];
}

export const GRADIENTS = {
  pm25: {
    0.0: "#00e400",
    0.2: "#ffff00",
    0.4: "#ff7e00",
    0.6: "#ff0000",
    0.8: "#8f3f97",
    1.0: "#7e0023"
  },
  temperature: {
    0.0: "#0d47a1",
    0.2: "#1976d2",
    0.4: "#4fc3f7",
    0.6: "#ffeb3b",
    0.8: "#ff9800",
    1.0: "#c62828"
  },
  humidity: {
    0.0: "#f5f5dc",
    0.2: "#c8e6c9",
    0.4: "#81c784",
    0.6: "#4db6ac",
    0.8: "#26c6da",
    1.0: "#0277bd"
  },
  compare: {
    0.0: "#9c27b0",
    0.2: "#3f51b5",
    0.4: "#4fc3f7",
    0.5: "#4caf50",
    0.6: "#fff176",
    0.8: "#ff9800",
    1.0: "#6d4c41"
  }
};
