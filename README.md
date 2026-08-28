# Label Printer

Small web and desktop label designer for millimetre-accurate labels. Export or print as PDF, including sequential auto-counter runs.

## Features

- Visual canvas with label size in mm (custom size or named presets)
- Objects: text, auto-counter text, rectangle, ellipse, line, image, QR code
- Drag, resize, rotate (handle or Angle °), lock, layer order, copy/paste, inline text editing
- Grid (show / snap / 1–20 mm step), per-side margin guides, objects clamped to label bounds
- Undo / redo (`Ctrl+Z` / `Ctrl+Y`)
- Save, load, and delete templates locally; import / export as JSON
- Reusable object library (save selected object, place later)
- Document themes and custom label background
- PDF download, print, and batch auto-counter print (one page per number)
- Optional Windows desktop app (NSIS installer and portable exe)

### Object options

| Object | Options |
|--------|---------|
| Text | Content, font family, bold / italic / underline, size mm, letter spacing, color, alignment |
| Auto counter | Start number, optional end number or count, same text styling, **Print Auto Counter** |
| Square / circle / line | Fill, stroke, stroke width, corner radius (square), line style (solid, dashed, dotted, dash-dot, long-dash, double + gap) |
| Image | Upload, resize, **Make Black** for monochrome print |
| QR code | Text / URL, error correction (L / M / Q / H) |
| All | X / Y / W / H mm, rotation angle, lock, send back / bring front |

### Workspace options

- **Label size** — header size button; pick a preset or **Manage label size presets**
- **Template** — save (name prompt), load, delete, import JSON, download JSON
- **Grid** — show grid, snap to grid, grid step in mm
- **Margins** — left / right / top / bottom safe-area guides in mm
- **Settings** — document theme (White, Sepia, Light blue, Light yellow, Black, Blueprint) or custom background; themes also recolor text/strokes for contrast
- **PDF** / **Print** — current label; auto-counter prints a multi-page PDF

Last used label size is restored on next launch. First launch uses the first saved preset if one exists.

## Requirements

- Node.js 18+ (recommended)

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

On Windows you can also run `dev.bat`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite development server |
| `npm run build` | Production build to `dist/` |
| `npm start` | Serve `dist/` with Express (presets API on port 3000) |
| `npm run preview` | Vite preview of the production build |
| `npm run desktop` | Build and open the Electron app |
| `npm run package:win` | Windows NSIS installer → `release/` |
| `npm run package:win:portable` | Windows portable exe → `release/` |
| `npm run release` | Version bump + installer + portable (or use `Build-Release.bat`) |

## Desktop builds

Packaged artifacts land in `release/`:

- `Label-Printer-Setup-<version>.exe` — NSIS installer
- `Label-Printer-Portable-<version>.exe` — portable app

Templates, object library, and last label size are stored in `localStorage`. Label size presets are loaded/saved via `/api/presets` when a server is running (`npm run dev` or `npm start`). The packaged Electron app serves static files only, so preset API save/load is not available there.

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |
| `Ctrl+C` | Copy selected object |
| `Ctrl+V` | Paste copied object (offset 4 mm) |
| `Delete` / `Backspace` | Delete selected object (when focus is not in a form field) |

On macOS, use `Cmd` instead of `Ctrl`.

## Design

Dark industrial UI: charcoal chrome around a light label “paper”. UI type is Square 721 (Eurostile-like); buttons are compact, uppercase, with a rust-orange accent.

### App chrome (not printed)

| Token | Hex | Use |
|-------|-----|-----|
| Ink | `#1a1c1e` | Page background, inputs |
| Panel | `#23262a` | Side panels |
| Soft | `#2c3036` | Buttons |
| Border | `#3a3f46` | Dividers |
| Text | `#e8eaed` | Primary UI text |
| Muted | `#8a8f98` | Labels, hints |
| Accent | `#c45c26` | Primary actions, focus, selection |
| Accent hover | `#a84c1f` | Primary hover |
| Stage | `#3a3d42` | Canvas well behind the label |
| Success / warning | `#3dd68c` / `#f07178` | Status |

Font: `"Square 721", "Square 721 BT", Eurostile, "Segoe UI", sans-serif` (CDN Fonts). Radius ~0.3–0.35rem. Focus ring: accent border + `rgba(196, 92, 38, 0.25)`.

### Printed document themes

| Theme | Background | Line / text |
|-------|------------|-------------|
| White | `#ffffff` | `#1a1c1e` |
| Sepia | `#f3e6c8` | `#3a2a1a` |
| Light blue | `#e7f2fa` | `#1a2a3a` |
| Light yellow | `#fbf6d5` | `#2a2a12` |
| Black | `#0a0a0a` | `#f5f5f5` |
| Blueprint | `#0b3d91` | `#ffffff` |

Default label: white, Square 721, 89 × 36 mm (or first preset). All geometry is millimetres so PDF output matches physical stock.

## Documentation

Illustrated user manual:

- [docs/user-manual.html](docs/user-manual.html)
- [docs/user-manual.pdf](docs/user-manual.pdf)

## Project layout

```
src/           React UI, canvas, panels, and helpers
server/        Express static host + presets API
electron/      Desktop shell
data/          Label size presets (`label-presets.json`)
docs/          User manual and screenshots
build/         Icons for electron-builder
scripts/       Release helper
```

## Tech stack

React 19, Vite 8, jsPDF, qrcode, Express, Electron + electron-builder.

---

## AI recreate prompt

Copy-paste this into a new empty repo if you need to rebuild the app:

```
Build “Label Printer”: a millimetre-accurate label designer that runs in the browser (Vite + React) and as a Windows Electron app. Positions, sizes, fonts, strokes, and PDF pages use millimetres so printed output matches physical label stock.

Stack: React 19, Vite 8 (base: './'), jsPDF, qrcode, Express 5, Electron + electron-builder. Node 18+. No TypeScript. Product name: Label Printer. App id: local.label-printer.

Layout (four areas):
1. Sticky dark header: title LABEL PRINTER, label-size dropdown, Template menu, Undo/Redo icon buttons, PDF (primary), Print, Settings gear.
2. Left sidebar: Add Objects toolbar + Objects layer list.
3. Center stage: scaled label canvas on a dark well.
4. Right inspector: Grid, Margins, Properties (all collapsible panels).

Objects: text, auto-counter text, rect, ellipse, line, image, QR. Add via icon toolbar. Canvas: select, drag, resize handle, rotate handle (Shift snaps 15°), inline text edit. Clamp objects to label bounds. Lock prevents move/resize/rotate. Layer order in Objects list (↑ ↓, lock, delete). Copy/paste Ctrl+C/V (paste offset +4 mm). Delete/Backspace when not in a form field. Undo/redo Ctrl+Z / Ctrl+Y, 50-step history, coalesce ~500 ms, gesture begin/end for drag.

Text properties: textarea, font library (Square 721 family + Arial/Helvetica/Verdana/Tahoma/Trebuchet/Courier/Times/Georgia/Impact + generic families), B/I/U, font size mm, letter spacing mm, color, left/center/right align. Auto-counter objects (isCounter): start, optional end, or count; preserve leading zeros; “Print Auto Counter” builds one PDF page per number.

Shapes: fill, stroke, stroke width mm, radius (rect), line styles solid/dashed/dotted/dash-dot/long-dash/double (double has gap mm). Image: file upload, Make Black (monochrome). QR: text/URL + error correction L/M/Q/H, live canvas preview.

Grid: show, snap, step 1–20 mm. Margins: independent left/right/top/bottom mm guides (not printed). Settings: document themes White/Sepia/Light blue/Light yellow/Black/Blueprint (set background + recolor text/strokes) or custom background color.

Templates in localStorage: save (window.prompt for name), load, delete, import JSON, download JSON. Object library in localStorage (max 50): save selected object, picker dialog to place or delete. Last used size in localStorage; first launch uses first preset.

Presets API GET/POST /api/presets on Vite middleware and Express, persisted to data/label-presets.json. Minimum size 5 mm. Electron loads dist/index.html only (no presets API).

PDF: jsPDF page size = label mm; print via blob URL; batch print for counter sequences. Map UI fonts to helvetica/times/courier for PDF.

UI design: dark industrial chrome, not a light dashboard. Tokens: --ink #1a1c1e, --panel #23262a, --soft #2c3036, --border #3a3f46, --text #e8eaed, --muted #8a8f98, --accent #c45c26, --accent-hover #a84c1f, --stage #3a3d42. Font Square 721 from CDN Fonts, uppercase compact buttons, rust-orange primary, dotted charcoal page background. Label itself is the chosen document theme (default white).

Scripts: dev, build, start (Express :3000), preview, desktop, package:win (NSIS Label-Printer-Setup-<ver>.exe), package:win:portable, release (scripts/build-release.mjs version bump + both artifacts to release/). Icons in build/ and electron/. Windows window 1280×820, autoHideMenuBar.

Keep geometry in mm throughout canvas, properties, and PDF. Match this README’s feature list and design tokens.
```
