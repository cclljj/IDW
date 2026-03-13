export function setupLogoDock(container, config) {
  if (!container) {
    return {
      setVersionText() {}
    };
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

  const version = document.createElement("div");
  version.className = "logo-time";
  version.textContent = "Last updated: loading...";

  container.innerHTML = "";
  container.append(links, version);

  return {
    setVersionText(text) {
      version.textContent = text || "Last updated: unknown";
    }
  };
}
