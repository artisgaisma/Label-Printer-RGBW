const documentThemes = [
  { id: 'white', label: 'White', background: '#ffffff', line: '#1a1c1e' },
  { id: 'sepia', label: 'Sepia', background: '#f3e6c8', line: '#3a2a1a' },
  { id: 'light-blue', label: 'Light blue', background: '#e7f2fa', line: '#1a2a3a' },
  { id: 'light-yellow', label: 'Light yellow', background: '#fbf6d5', line: '#2a2a12' },
  { id: 'black', label: 'Black', background: '#0a0a0a', line: '#f5f5f5' },
  { id: 'blueprint', label: 'Blueprint', background: '#0b3d91', line: '#ffffff' },
];

export default function SettingsPage({ template, onClose, onTemplateChange }) {
  const documentThemeId = template.documentThemeId || 'white';

  function handleDocumentThemeChange(themeId) {
    const theme = documentThemes.find((item) => item.id === themeId);
    if (!theme) {
      return;
    }

    onTemplateChange({
      background: theme.background,
      documentThemeId: theme.id,
      objects: template.objects.map((item) => applyLineColor(item, theme.line)),
    });
  }

  return (
    <div className="settings-page" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <section className="panel settings-panel">
        <div className="settings-header">
          <h2 id="settings-title">Settings</h2>
          <button aria-label="Close settings" className="settings-close" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <label>
          Document theme
          <select value={documentThemeId} onChange={(event) => handleDocumentThemeChange(event.target.value)}>
            {documentThemes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Background
          <input
            type="color"
            value={template.background}
            onChange={(event) => onTemplateChange({ background: event.target.value })}
          />
        </label>
      </section>
    </div>
  );
}

function applyLineColor(object, lineColor) {
  if (object.type === 'text') {
    return { ...object, color: lineColor };
  }

  if (object.type === 'rect' || object.type === 'ellipse' || object.type === 'line') {
    return { ...object, stroke: lineColor };
  }

  return object;
}
