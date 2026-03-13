# Legacy Snapshot

This folder stores baseline references for the legacy `/GIS/IDW/` implementation.

## Current contents

- `feature-matrix.md`: behavior checklist for regression testing.

## How to refresh snapshot

1. Download legacy assets from `/GIS/IDW/` (HTML, JS, CSS, data) into a dated subfolder.
2. Capture baseline screenshots for:
   - default mode
   - `?notice=no`
   - `?humidity=yes`
   - `?contour=yes`
   - `?www=yes`
3. Update `feature-matrix.md` if legacy behavior changes.
