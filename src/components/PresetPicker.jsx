import { useEffect, useMemo, useState } from 'react';

export default function PresetPicker({
  template,
  presets,
  onPresetChange,
  onSavePreset,
  onSavePresets,
  savingPreset,
}) {
  const [expanded, setExpanded] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [draftPresets, setDraftPresets] = useState(() => createDraftPresets(presets));
  const visiblePresets = useMemo(() => presets.slice(0, 3), [presets]);

  useEffect(() => {
    if (managerOpen) {
      setDraftPresets(createDraftPresets(presets));
    }
  }, [managerOpen, presets]);

  function handleDraftChange(index, key, value) {
    setDraftPresets((current) =>
      current.map((preset, presetIndex) => (presetIndex === index ? { ...preset, [key]: value } : preset)),
    );
  }

  function handleAddPreset() {
    setDraftPresets((current) => [
      ...current,
      {
        heightMm: 36,
        id: '',
        name: `Preset ${current.length + 1}`,
        widthMm: 89,
      },
    ]);
  }

  async function handleSaveManager() {
    const normalizedPresets = draftPresets
      .map((preset) => ({
        ...preset,
        heightMm: Number(preset.heightMm),
        name: preset.name.trim(),
        widthMm: Number(preset.widthMm),
      }))
      .filter((preset) => preset.name && preset.widthMm >= 5 && preset.heightMm >= 5);

    await onSavePresets(normalizedPresets);
    setManagerOpen(false);
  }

  async function handleCreateFirstPresets() {
    await onSavePreset({ name: 'Preset 1', widthMm: template.widthMm, heightMm: template.heightMm });
    setManagerOpen(true);
  }

  return (
    <div className={`label-size-menu ${expanded ? 'is-open' : ''}`}>
      <button
        aria-expanded={expanded}
        aria-haspopup="true"
        className="label-size-button"
        type="button"
        onClick={() => setExpanded((open) => !open)}
      >
        <strong>
          {template.widthMm} x {template.heightMm} mm
        </strong>
        <span aria-hidden="true" className="label-size-chevron">
          {expanded ? '▾' : '▸'}
        </span>
      </button>
      {expanded ? (
        <div className="label-size-dropdown">
          {visiblePresets.length > 0 ? (
            visiblePresets.map((preset) => (
              <button
                key={preset.id}
                className={`label-size-option ${preset.id === template.presetId ? 'active' : ''}`}
                title={`${preset.widthMm} x ${preset.heightMm} mm`}
                type="button"
                onClick={() => {
                  onPresetChange(preset.id);
                  setExpanded(false);
                }}
              >
                <span>{preset.name}</span>
              </button>
            ))
          ) : (
            <p className="label-size-empty">No presets yet.</p>
          )}
          <button
            aria-label="Manage label size presets"
            className="label-size-more"
            type="button"
            onClick={() => {
              setManagerOpen(true);
              setExpanded(false);
            }}
          >
            <span aria-hidden="true">...</span>
          </button>
        </div>
      ) : null}
      {managerOpen ? (
        <div className="preset-manager-backdrop">
          <section aria-label="Manage label presets" className="panel preset-manager">
            <div className="preset-manager-header">
              <h2>Label Size Presets</h2>
              <button className="settings-close" type="button" onClick={() => setManagerOpen(false)}>
                X
              </button>
            </div>
            {draftPresets.length > 0 ? (
              <div className="preset-manager-list">
                {draftPresets.map((preset, index) => (
                  <div className="preset-manager-row" key={preset.id || `new-${index}`}>
                    <label>
                      Name
                      <input
                        value={preset.name}
                        onChange={(event) => handleDraftChange(index, 'name', event.target.value)}
                      />
                    </label>
                    <label>
                      Width mm
                      <input
                        min="5"
                        step="0.1"
                        type="number"
                        value={preset.widthMm}
                        onChange={(event) => handleDraftChange(index, 'widthMm', event.target.value)}
                      />
                    </label>
                    <label>
                      Height mm
                      <input
                        min="5"
                        step="0.1"
                        type="number"
                        value={preset.heightMm}
                        onChange={(event) => handleDraftChange(index, 'heightMm', event.target.value)}
                      />
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Create your first preset from the current label size.</p>
            )}
            <div className="button-row">
              {draftPresets.length > 0 ? (
                <button type="button" onClick={handleAddPreset}>
                  Add preset
                </button>
              ) : (
                <button type="button" onClick={handleCreateFirstPresets}>
                  Create preset
                </button>
              )}
              <button
                className="primary"
                disabled={savingPreset || draftPresets.length === 0}
                type="button"
                onClick={handleSaveManager}
              >
                {savingPreset ? 'Saving...' : 'Save'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function createDraftPresets(presets) {
  return presets.map((preset) => ({
    ...preset,
    heightMm: String(preset.heightMm),
    widthMm: String(preset.widthMm),
  }));
}
