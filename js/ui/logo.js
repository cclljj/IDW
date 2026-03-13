import { formatDateTime } from "../core/time.js";

export function setupLogoDock(container, config) {
  if (!container) {
    return;
  }

  const links = document.createElement("div");
  links.className = "logo-links";

  (config.ui.logos || []).forEach((logo) => {
    const anchor = document.createElement("a");
    anchor.className = "logo-link";
    anchor.href = logo.href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.setAttribute("aria-label", logo.label);

    const image = document.createElement("img");
    image.src = logo.image;
    image.alt = logo.label;

    anchor.appendChild(image);
    links.appendChild(anchor);
  });

  const clock = document.createElement("div");
  clock.className = "logo-time";

  const refreshClock = () => {
    clock.textContent = formatDateTime(Date.now(), {
      timezone: config.ui.timezone
    });
  };

  refreshClock();
  window.setInterval(refreshClock, 1000);

  container.innerHTML = "";
  container.append(links, clock);
}
