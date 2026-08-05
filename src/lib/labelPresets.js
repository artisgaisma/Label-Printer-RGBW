export const defaultPreset = {
  id: 'custom',
  name: 'Custom size',
  widthMm: 89,
  heightMm: 36,
};

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
