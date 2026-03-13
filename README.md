# LASS IDW (Modernized Static)

Modernized IDW visualization for PM2.5 datasets under `/GIS/IDW/`.

## Goals

- Keep static hosting workflow (no build pipeline required in production)
- Restore basemap reliability (OSM primary + fallback)
- Preserve legacy query behaviors
- Replace global-coupled scripts with maintainable ES modules

## Structure

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
│   ├── core/
│   ├── data/
│   ├── map/
│   └── ui/
├── images/
├── legacy-snapshot/
├── DEPENDENCIES.md
└── tests/
```

## Query Parameters

- `notice=no|yes`
- `contour=yes|no`
- `humidity=yes|no`
- `www=yes|no`

Examples:

- `./index.html?contour=yes`
- `./index.html?notice=no&humidity=yes`

## Data Contract

Each dataset accepts either:

- object with `points` array, or
- plain array payload

Point format can be:

- array: `[lat, lng, pm25, temperature, humidity, group, sensorId, label, url, updatedAt]`
- object with equivalent named fields (`lat/latitude`, `lng/longitude`, etc.)

Internal normalized type:

```text
SensorPoint { lat, lng, pm25, temperature, humidity, source, group, sensorId, label, url, updatedAt }
```

## Local Run

Any static server works. Example from repository root:

```bash
npx vite --host
```

Then open `/IDW/`.

## Tests

Unit smoke test:

```bash
node IDW/tests/unit.test.mjs
```

Playwright spec (from repository root):

```bash
npx playwright test IDW/tests/playwright.idw.spec.js
```

## Deployment

- Stage path: `/GIS/IDW-v2/`
- Production path: `/GIS/IDW/`
- Legacy rollback path: `/GIS/IDW-legacy/`

Upload the full `IDW/` folder as static assets.
