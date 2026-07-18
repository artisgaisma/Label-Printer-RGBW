export const defaultGridSizeMm = 5;

export function normalizeGridSizeMm(value) {
  const size = Number(value);
  if (!Number.isFinite(size)) {
    return defaultGridSizeMm;
  }

  return Math.min(20, Math.max(1, Math.round(size)));
}

export function snapValueToGrid(value, gridSizeMm) {
  return Math.round(value / gridSizeMm) * gridSizeMm;
}

export function snapPositionToGrid(x, y, gridSizeMm) {
  const gridSize = normalizeGridSizeMm(gridSizeMm);

  return {
    x: snapValueToGrid(x, gridSize),
    y: snapValueToGrid(y, gridSize),
  };
}

export function snapObjectToGrid(object, gridSizeMm) {
  const gridSize = normalizeGridSizeMm(gridSizeMm);
  const snapped = {
    x: snapValueToGrid(object.x, gridSize),
    y: snapValueToGrid(object.y, gridSize),
    width: Math.max(gridSize, snapValueToGrid(object.width, gridSize)),
  };

  if (object.type !== 'line') {
    snapped.height = Math.max(gridSize, snapValueToGrid(object.height, gridSize));
  }

  return snapped;
}
