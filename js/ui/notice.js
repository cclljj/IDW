export function setupNotice(panel, mode, config) {
  if (!panel) {
    return;
  }

  const enabledByConfig = config.ui.notice?.enabled !== false;
  const shouldShow = enabledByConfig && mode.notice;

  if (!shouldShow) {
    panel.hidden = true;
    return;
  }

  const closeButton = panel.querySelector(".notice-close");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      panel.hidden = true;
    });
  }

  panel.hidden = false;
}
