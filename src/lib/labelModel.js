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
    text: '',
    fontSize: 10,
    color: '#101429',
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
    fill: 'transparent',
    stroke: '#101429',
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
    stroke: '#101429',
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
    fill: 'transparent',
    stroke: '#101429',
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
    src: '',
    name: 'Image',
  },
};

export function createTemplate(preset = defaultPreset) {
  return {
    version: 1,
    name: 'Untitled label',
    presetId: preset.id,
    widthMm: preset.widthMm,
    heightMm: preset.heightMm,
    background: '#ffffff',
    showGrid: false,
    snapToGrid: false,
    gridSizeMm: defaultGridSizeMm,
    objects: [
      {
        id: createId(),
        ...objectDefaults.text,
      },
    ],
  };
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

export function clampObjectToLabel(object, template) {
  const width = Math.max(1, Number(object.width) || 1);
  const height = object.type === 'line' ? Number(object.height) || 0 : Math.max(1, Number(object.height) || 1);

  return {
    ...object,
    width,
    height,
    x: Math.min(Math.max(0, Number(object.x) || 0), Math.max(0, template.widthMm - width)),
    y: Math.min(Math.max(0, Number(object.y) || 0), Math.max(0, template.heightMm - Math.max(height, 0))),
  };
}
