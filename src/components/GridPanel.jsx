import { useState } from 'react';
import { defaultGridSizeMm, normalizeGridSizeMm } from '../lib/gridUtils';

export default function GridPanel({ template, onTemplateChange }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const gridSizeMm = normalizeGridSizeMm(template.gridSizeMm ?? defaultGridSizeMm);

  return (
    <section className={`panel panel-collapsible grid-panel ${isExpanded ? 'is-expanded' : ''}`}>
      <button
        aria-expanded={isExpanded}
        className="panel-toggle"
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
      >
        <h2>Grid</h2>
        <span className="panel-toggle-hint">{gridSizeMm} mm</span>
        <span className="panel-toggle-chevron" aria-hidden="true">
          {isExpanded ? '-' : '+'}
        </span>
      </button>

      {isExpanded && (
        <div className="grid-controls">
          <div className="grid-checkboxes">
            <label className="checkbox-row">
              <input
                checked={Boolean(template.showGrid)}
                type="checkbox"
                onChange={(event) => onTemplateChange({ showGrid: event.target.checked })}
              />
              Show grid
            </label>
            <label className="checkbox-row">
              <input
                checked={Boolean(template.snapToGrid)}
                type="checkbox"
                onChange={(event) => onTemplateChange({ snapToGrid: event.target.checked })}
              />
              Snap to grid
            </label>
          </div>
          <label className="grid-size-field">
            Grid mm
            <input
              max="20"
              min="1"
              step="1"
              type="number"
              value={gridSizeMm}
              onChange={(event) => onTemplateChange({ gridSizeMm: normalizeGridSizeMm(event.target.value) })}
            />
          </label>
        </div>
      )}
    </section>
  );
}
