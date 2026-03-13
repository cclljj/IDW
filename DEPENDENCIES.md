# IDW Dependencies

Last reviewed: 2026-03-13

## Runtime libraries (fixed versions)

- Leaflet `1.9.4`
  - CSS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
  - JS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`

## Version governance

- Use fixed versions only. Avoid floating tags such as `latest`.
- Patch/minor upgrades can be applied directly after regression checklist pass.
- Major upgrades require a full layer/function compatibility check and staged rollout.
