import { createId } from './labelModel';

const storageKey = 'label-printer-object-library';
const maxItems = 50;

export const lineStyleOptions = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'dash-dot', label: 'Dash dot' },
  { value: 'long-dash', label: 'Long dash' },
  { value: 'double', label: 'Double' },
];

export function loadLibrary() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

export function saveLibraryItem(snapshot, name) {
  const library = loadLibrary();
  const item = {
    id: createId(),
    name: name.trim() || defaultLibraryName(snapshot),
    savedAt: new Date().toISOString(),
    snapshot,
  };

  const nextLibrary = [item, ...library].slice(0, maxItems);
  localStorage.setItem(storageKey, JSON.stringify(nextLibrary));
  return nextLibrary;
}

export function deleteLibraryItem(id) {
  const nextLibrary = loadLibrary().filter((item) => item.id !== id);
  localStorage.setItem(storageKey, JSON.stringify(nextLibrary));
  return nextLibrary;
}

export function snapshotFromObject(object) {
  const { id, ...snapshot } = object;
  return snapshot;
}

export function defaultLibraryName(snapshot) {
  const typeLabels = {
    text: 'Text',
    rect: 'Square',
    ellipse: 'Circle',
    line: 'Line',
    image: snapshot.name || 'Image',
  };

  const label = typeLabels[snapshot.type] || snapshot.type;
  if (snapshot.type === 'text') {
    const preview = (snapshot.text || 'Text').slice(0, 24);
    return preview;
  }

  return `${label} ${round(snapshot.width)}×${round(snapshot.height)} mm`;
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;
}
