import { useState } from 'react';

export default function PresetPicker({
  template,
  presets,
  onPresetChange,
  onCustomSizeChange,
  onSavePreset,
  savingPreset,
}) {
  const [expanded, setExpanded] = useState(false);
  const [presetName, setPresetName] = useState('');
  const isCustom =
    template.presetId === 'custom' || !presets.some((preset) => preset.id === template.presetId);

  async function handleSavePreset() {
    const name = presetName.trim();
    if (!name) {
      return;
    }

    await onSavePreset({
      name,
      widthMm: template.widthMm,
      heightMm: template.heightMm,
    });
    setPresetName('');
  }

  return (
    <section className={`panel panel-collapsible ${expanded ? 'is-expanded' : ''}`}>
      <button
        aria-expanded={expanded}
        className="panel-toggle"
        type="button"
        onClick={() => setExpanded((open) => !open)}
      >
        <h2>Label Size</h2>
        {!expanded ? (
          <span className="panel-toggle-hint">
            {template.widthMm} × {template.heightMm} mm
          </span>
        ) : null}
        <span aria-hidden="true" className="panel-toggle-chevron">
          {expanded ? '▾' : '▸'}
        </span>
      </button>
      {expanded ? (
        <>
          <label>
            Preset
            <select value={isCustom ? 'custom' : template.presetId} onChange={(event) => onPresetChange(event.target.value)}>
              {presets.length === 0 ? (
                <option value="custom">Custom size</option>
              ) : (
                <>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({preset.widthMm} x {preset.heightMm} mm)
                    </option>
                  ))}
                  <option value="custom">Custom size</option>
                </>
              )}
            </select>
          </label>
          <div className="input-row">
            <label>
              Width mm
              <input
                min="5"
                step="0.1"
                type="number"
                value={template.widthMm}
                onChange={(event) => onCustomSizeChange('widthMm', Number(event.target.value))}
              />
            </label>
            <label>
              Height mm
              <input
                min="5"
                step="0.1"
                type="number"
                value={template.heightMm}
                onChange={(event) => onCustomSizeChange('heightMm', Number(event.target.value))}
              />
            </label>
          </div>
          <label>
            Save as preset
            <input
              placeholder="Preset name"
              type="text"
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
            />
          </label>
          <button disabled={!presetName.trim() || savingPreset} type="button" onClick={handleSavePreset}>
            {savingPreset ? 'Saving...' : 'Save preset'}
          </button>
        </>
      ) : null}
    </section>
  );
}
