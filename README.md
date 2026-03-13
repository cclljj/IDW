# LASS IDW (Modernized Static)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Architecture](https://img.shields.io/badge/Architecture-ES%20Modules-1f6feb)](#architecture)
[![Deploy](https://img.shields.io/badge/Deploy-Static%20Hosting-0ea5e9)](#deployment)
[![E2E](https://img.shields.io/badge/E2E-Playwright-45ba63?logo=playwright&logoColor=white)](https://playwright.dev/)

Modernized IDW visualization for PM2.5 datasets under `/GIS/IDW/`.

## Highlights

- Static-first deployment (no production build pipeline required)
- Basemap recovery with OpenStreetMap primary + fallback tiles
- Legacy query compatibility:
  - `notice=no|yes`
  - `contour=yes|no`
  - `humidity=yes|no`
  - `www=yes|no`
- Unified `SensorPoint` data adapter for heterogeneous JSON payloads
- Modular architecture (`core`, `data`, `map`, `ui`) using native ES Modules
- Unit smoke tests + Playwright e2e regression coverage

## Architecture

```text
IDW/
├── index.html
├── css/
│   ├── idw-main.css
│   └── idw-controls.css
├── config/
│   └── idw-config.json
├── data/
│   ├── data.json
│   ├── cwb.json
│   ├── epa.json
│   ├── calibration.json
│   └── epaiot.json
├── js/
│   ├── core/      # query parsing, time formatting, request helpers
│   ├── data/      # data loading and SensorPoint adapter
│   ├── map/       # tile setup, IDW render, contour, layer manager
│   └── ui/        # legend, display panel, notice, logo dock
├── legacy-snapshot/
├── tests/
├── DEPENDENCIES.md
└── LICENSE
```

## Data Contract

Accepted dataset payloads:

- Object payload containing `points` array (preferred)
- Plain array payload

Accepted point formats:

- Array format: `[lat, lng, pm25, temperature, humidity, group, sensorId, label, url, updatedAt]`
- Object format with equivalent named fields (`lat/latitude`, `lng/longitude`, etc.)

Internal normalized type:

```text
SensorPoint {
  lat, lng, pm25, temperature, humidity,
  source, group, sensorId, label, url, updatedAt
}
```

## Run Locally

Any static server is supported.

Example:

```bash
npx vite --host
```

Open:

- `http://127.0.0.1:5173/IDW/`

## Test

Unit smoke test:

```bash
node IDW/tests/unit.test.mjs
```

Playwright e2e:

```bash
cd IDW
npx playwright test -c playwright.config.js
```

## Deployment

Recommended rollout:

1. Deploy `IDW/` to stage path `/GIS/IDW-v2/`
2. Validate all query modes and layer switching
3. Switch route to `/GIS/IDW/`
4. Keep `/GIS/IDW-legacy/` as one-step rollback

The project is static-only: upload files directly to web root/CDN.

## Dependency Policy

Dependency inventory is tracked in [DEPENDENCIES.md](./DEPENDENCIES.md).

- Fixed versions only (no floating tags)
- Patch/minor upgrades after regression checklist
- Major upgrades require full compatibility verification

## License

MIT License. See [LICENSE](./LICENSE).
