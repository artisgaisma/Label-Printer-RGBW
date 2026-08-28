import { defaultGridSizeMm } from './gridUtils';
import { defaultPreset } from './labelPresets';
import { defaultFontFamily } from './fontLibrary';

export const objectDefaults = {
  text: {
    type: 'text',
    x: 16,
    y: 11,
    width: 58,
    height: 12,
    angle: 0,
    text: '',
    fontSize: 10,
    color: '#1a1c1e',
    fontFamily: defaultFontFamily,
    fontWeight: '400',
    fontStyle: 'normal',
    textDecoration: 'none',
    letterSpacing: 0,
    textAlign: 'center',
  },
  rect: {
    type: 'rect',
    x: 8,
    y: 8,
    width: 24,
    height: 14,
    angle: 0,
    fill: 'transparent',
    stroke: '#1a1c1e',
    strokeWidth: 0.5,
    radius: 0,
    lineStyle: 'solid',
    doubleGap: 1,
  },
  line: {
    type: 'line',
    x: 10,
    y: 18,
    width: 40,
    height: 0,
    angle: 0,
    stroke: '#1a1c1e',
    strokeWidth: 0.6,
    lineStyle: 'solid',
    doubleGap: 1,
  },
  ellipse: {
    type: 'ellipse',
    x: 8,
    y: 8,
    width: 24,
    height: 24,
    angle: 0,
    fill: 'transparent',
    stroke: '#1a1c1e',
    strokeWidth: 0.5,
    lineStyle: 'solid',
    doubleGap: 1,
  },
  image: {
    type: 'image',
    x: 10,
    y: 8,
    width: 24,
    height: 18,
    angle: 0,
    src: '',
    name: 'Image',
  },
  qr: {
    type: 'qr',
    x: 10,
    y: 8,
    width: 24,
    height: 24,
    angle: 0,
    text: 'https://example.com',
    name: 'QR code',
    errorCorrectionLevel: 'M',
  },
};

export function createTemplate(preset = defaultPreset) {
  return {
    version: 1,
    name: 'Untitled label',
    presetId: preset.id,
    widthMm: preset.widthMm,
    heightMm: preset.heightMm,
    documentThemeId: 'white',
    background: '#ffffff',
    showGrid: false,
    snapToGrid: false,
    gridSizeMm: defaultGridSizeMm,
    marginLeftMm: 0,
    marginRightMm: 0,
    marginTopMm: 0,
    marginBottomMm: 0,
    objects: [
      {
        id: createId(),
        ...objectDefaults.text,
      },
    ],
  };
}

/** Non-printed guide inset; clamps to [0, maxMm] with 0.1 mm steps. */
export function normalizeMarginMm(value, maxMm = 100) {
  const size = Number(value);
  if (!Number.isFinite(size) || size < 0) {
    return 0;
  }

  const capped = Math.min(Math.max(0, maxMm), size);
  return Math.round(capped * 10) / 10;
}

/** Resolves per-side margins; falls back to legacy horizontal/vertical fields. */
export function getTemplateMargins(template) {
  const maxWidthMm = Math.max(0, (Number(template.widthMm) || 0) - 1);
  const maxHeightMm = Math.max(0, (Number(template.heightMm) || 0) - 1);
  const legacyHorizontal = template.marginHorizontalMm;
  const legacyVertical = template.marginVerticalMm;

  const left = normalizeMarginMm(
    template.marginLeftMm ?? legacyHorizontal ?? 0,
    maxWidthMm,
  );
  const right = normalizeMarginMm(
    template.marginRightMm ?? legacyHorizontal ?? 0,
    Math.max(0, maxWidthMm - left),
  );
  const top = normalizeMarginMm(
    template.marginTopMm ?? legacyVertical ?? 0,
    maxHeightMm,
  );
  const bottom = normalizeMarginMm(
    template.marginBottomMm ?? legacyVertical ?? 0,
    Math.max(0, maxHeightMm - top),
  );

  return { left, right, top, bottom };
}

export function createObject(type, overrides = {}) {
  return {
    id: createId(),
    ...objectDefaults[type],
    ...overrides,
  };
}

export function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeAngle(value) {
  const angle = Number(value);
  if (!Number.isFinite(angle)) {
    return 0;
  }

  const wrapped = ((angle % 360) + 360) % 360;
  return wrapped > 180 ? wrapped - 360 : wrapped;
}

export function getObjectAngle(object) {
  return normalizeAngle(object?.angle);
}

export function clampObjectToLabel(object, template) {
  const width = Math.max(1, Number(object.width) || 1);
  const height = object.type === 'line' ? Number(object.height) || 0 : Math.max(1, Number(object.height) || 1);

  return {
    ...object,
    width,
    height,
    angle: normalizeAngle(object.angle),
    x: Math.min(Math.max(0, Number(object.x) || 0), Math.max(0, template.widthMm - width)),
    y: Math.min(Math.max(0, Number(object.y) || 0), Math.max(0, template.heightMm - Math.max(height, 0))),
  };
}
