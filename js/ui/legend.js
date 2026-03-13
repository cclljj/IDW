import { normalizeGradient } from "../map/colorScales.js";

function createRangeRows(gradientPairs, minVal, maxVal) {
  const rows = [];
  for (let index = 0; index < gradientPairs.length; index += 1) {
    const [offset, color] = gradientPairs[index];
    const value = minVal + (maxVal - minVal) * offset;
    rows.push({
      color,
      label: value.toFixed(1)
    });
  }
  return rows;
}

export function createLegendRenderer(container) {
  function clear() {
    container.innerHTML = "";
  }

  function render(definition, options = {}) {
    clear();

    if (!definition) {
      return;
    }

    const gradientPairs = normalizeGradient(options.gradient || {});
    const minVal = Number.isFinite(definition.minVal) ? definition.minVal : 0;
    const maxVal = Number.isFinite(definition.maxVal) ? definition.maxVal : 100;
    const rows = createRangeRows(gradientPairs, minVal, maxVal);

    const title = document.createElement("h3");
    title.className = "legend-title";
    title.textContent = `${definition.title} legend`;

    const note = document.createElement("div");
    note.className = "legend-note";

    if (definition.contourInterval) {
      note.textContent = `Contour interval: ${definition.contourInterval}`;
    } else {
      note.textContent = `Range: ${minVal} - ${maxVal}`;
    }

    const list = document.createElement("ul");
    list.className = "legend-list";

    rows.forEach((row) => {
      const item = document.createElement("li");
      item.className = "legend-row";

      const swatch = document.createElement("span");
      swatch.className = "legend-swatch";
      swatch.style.backgroundColor = row.color;

      const text = document.createElement("span");
      text.textContent = row.label;

      item.append(swatch, text);
      list.appendChild(item);
    });

    container.append(title, note, list);
  }

  return {
    clear,
    render
  };
}
