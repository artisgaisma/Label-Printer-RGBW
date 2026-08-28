export const defaultPreset = {
  id: 'custom',
  name: 'Custom size',
  widthMm: 89,
  heightMm: 36,
};

const lastUsedSizeKey = 'label-printer-last-label-size';

export function loadLastUsedSize() {
  try {
    const stored = JSON.parse(localStorage.getItem(lastUsedSizeKey));
    if (!stored) {
      return null;
    }

    const widthMm = Number(stored.widthMm);
    const heightMm = Number(stored.heightMm);
    if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm) || widthMm < 5 || heightMm < 5) {
      return null;
    }

    return {
      id: stored.presetId || 'custom',
      name: stored.name || 'Last used size',
      widthMm,
      heightMm,
    };
  } catch {
    return null;
  }
}

export function saveLastUsedSize(template) {
  const widthMm = Number(template?.widthMm);
  const heightMm = Number(template?.heightMm);
  if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm) || widthMm < 5 || heightMm < 5) {
    return;
  }

  localStorage.setItem(
    lastUsedSizeKey,
    JSON.stringify({
      presetId: template.presetId || 'custom',
      name: template.name || 'Last used size',
      widthMm,
      heightMm,
    }),
  );
}

export function getStartupPreset(presets = []) {
  return loadLastUsedSize() || presets[0] || defaultPreset;
}

export async function loadPresets() {
  const response = await fetch('/api/presets');

  if (!response.ok) {
    throw new Error('Unable to load label presets.');
  }

  return response.json();
}

export async function savePreset(preset) {
  const response = await fetch('/api/presets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preset),
  });

  if (!response.ok) {
    throw new Error('Unable to save label preset.');
  }

  return response.json();
}

export async function savePresets(presets) {
  const response = await fetch('/api/presets', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(presets),
  });

  if (!response.ok) {
    throw new Error('Unable to save label presets.');
  }

  return response.json();
}

export function findPreset(presets, id) {
  return presets.find((preset) => preset.id === id) || null;
}
