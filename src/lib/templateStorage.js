const storageKey = 'label-printer-templates';

export function loadTemplates() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

export function saveTemplate(template) {
  const templates = loadTemplates();
  const savedTemplate = {
    ...template,
    savedAt: new Date().toISOString(),
  };
  const nextTemplates = [
    savedTemplate,
    ...templates.filter((item) => item.name !== template.name),
  ].slice(0, 30);

  localStorage.setItem(storageKey, JSON.stringify(nextTemplates));
  return nextTemplates;
}

export function deleteTemplate(name) {
  const nextTemplates = loadTemplates().filter((item) => item.name !== name);
  localStorage.setItem(storageKey, JSON.stringify(nextTemplates));
  return nextTemplates;
}

export function downloadTemplate(template) {
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${sanitizeFileName(template.name || 'label-template')}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function readTemplateFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sanitizeFileName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'label-template';
}
