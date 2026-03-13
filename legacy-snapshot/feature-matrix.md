# IDW Legacy Feature Matrix

| Feature | Legacy behavior | v2 target | Status |
| --- | --- | --- | --- |
| Basemap rendering | Background map tiles visible | OSM primary + fallback tiles | Implemented |
| PM2.5 IDW | AirBox PM2.5 interpolation | Preserved with modular `idwLayer` | Implemented |
| Temperature mode | AirBox/CWB temperature layer | Preserved as selectable layers | Implemented |
| EPA layers | EPA PM2.5 and calibration layers | Preserved as selectable layers | Implemented |
| Compare layer | Calibration/EPA ratio | Derived dataset + IDW layer | Implemented |
| Contour option | Optional contour overlay | `?contour=yes` enables contour layer | Implemented |
| Humidity option | Humidity-first mode | `?humidity=yes` picks humidity-capable layer | Implemented |
| WWW option | Alternative display mode | `?www=yes` collapses layer control by default | Implemented |
| Notice option | Optional warning/notice | `?notice=no` hides notice panel | Implemented |
| Sensor details | group and identifier info | Unified display panel with source/device | Implemented |
| Data fallback | Multiple backend data feeds | Local-first + remote fallback URLs | Implemented |
| Degradation handling | partial availability possible | Per-dataset error tolerance with warnings | Implemented |
