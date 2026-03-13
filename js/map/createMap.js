export function createMap(containerId, config, options = {}) {
  const onStatus = options.onStatus || (() => {});
  const map = L.map(containerId, {
    zoomControl: true,
    attributionControl: true,
    minZoom: config.map.minZoom,
    maxZoom: config.map.maxZoom
  }).setView(config.map.center, config.map.zoom);

  const primaryTile = L.tileLayer(config.tiles.primary.url, {
    attribution: config.tiles.primary.attribution,
    maxZoom: config.map.maxZoom,
    minZoom: config.map.minZoom,
    ...(config.tiles.primary.subdomains ? { subdomains: config.tiles.primary.subdomains } : {})
  });

  const fallbackTile = L.tileLayer(config.tiles.fallback.url, {
    attribution: config.tiles.fallback.attribution,
    maxZoom: config.map.maxZoom,
    minZoom: config.map.minZoom,
    ...(config.tiles.fallback.subdomains ? { subdomains: config.tiles.fallback.subdomains } : {})
  });

  let switchedToFallback = false;
  let tileErrorCount = 0;

  primaryTile.on("tileerror", () => {
    tileErrorCount += 1;

    if (switchedToFallback || tileErrorCount < 8) {
      return;
    }

    switchedToFallback = true;
    map.removeLayer(primaryTile);
    fallbackTile.addTo(map);
    onStatus("Primary tile source unavailable, switched to fallback.", "warning");
  });

  primaryTile.addTo(map);
  L.control.scale({ position: "topright" }).addTo(map);

  return {
    map,
    usingFallbackTiles: () => switchedToFallback,
    forceFallbackTiles: () => {
      if (switchedToFallback) {
        return;
      }
      switchedToFallback = true;
      map.removeLayer(primaryTile);
      fallbackTile.addTo(map);
      onStatus("Primary tile source unavailable, switched to fallback.", "warning");
    }
  };
}
