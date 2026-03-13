function isYes(value) {
  return String(value || "").toLowerCase() === "yes";
}

function isNo(value) {
  return String(value || "").toLowerCase() === "no";
}

export function parseModeFromUrl(search = window.location.search) {
  const params = new URLSearchParams(search);

  return {
    notice: !isNo(params.get("notice")),
    contour: isYes(params.get("contour")),
    humidity: isYes(params.get("humidity")),
    www: isYes(params.get("www"))
  };
}
