# HousingFinder system diagrams

The site serves the compact viewer at `/diagram` through `src/app/diagram/route.js`.
It displays seven diagrams with zoom, SVG/PNG export, and print-to-PDF controls.

- `site.html`: compact page used by the site.
- `index.html`: standalone offline viewer with presentation notes and source references.
- `01`–`07` SVG files: individual editable diagrams.
- `generate.py`: diagram content, layout, and HTML generator; Python standard library only.

Regenerate both viewers and all SVGs from the repository root:

```sh
python3 docs/diagrams/generate.py
```

The pack covers the system structure, Level 1 DFD, domain classes, example objects,
use cases, a viewing sequence, and a viewing activity diagram. The domain model
maps to the current schema; the example object values are fictional.
