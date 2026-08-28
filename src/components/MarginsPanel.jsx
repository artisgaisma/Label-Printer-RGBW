import { useState } from 'react';
import { getTemplateMargins, normalizeMarginMm } from '../lib/labelModel';

const oppositeEdge = {
  left: 'right',
  right: 'left',
  top: 'bottom',
  bottom: 'top',
};

export default function MarginsPanel({ template, onTemplateChange }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const margins = getTemplateMargins(template);
  const maxWidthMm = Math.max(0, template.widthMm - 1);
  const maxHeightMm = Math.max(0, template.heightMm - 1);

  function updateMargin(edge, value) {
    const next = { ...margins };
    const isHorizontal = edge === 'left' || edge === 'right';
    const maxTotal = isHorizontal ? maxWidthMm : maxHeightMm;
    next[edge] = normalizeMarginMm(value, Math.max(0, maxTotal - next[oppositeEdge[edge]]));

    onTemplateChange({
      marginLeftMm: next.left,
      marginRightMm: next.right,
      marginTopMm: next.top,
      marginBottomMm: next.bottom,
    });
  }

  return (
    <section className={`panel panel-collapsible margins-panel ${isExpanded ? 'is-expanded' : ''}`}>
      <button
        aria-expanded={isExpanded}
        className="panel-toggle"
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
      >
        <h2>Margins</h2>
        <span className="panel-toggle-hint">
          L{margins.left} R{margins.right} T{margins.top} B{margins.bottom}
        </span>
        <span className="panel-toggle-chevron" aria-hidden="true">
          {isExpanded ? '-' : '+'}
        </span>
      </button>

      {isExpanded && (
        <div className="margins-controls">
          <div className="margins-fields">
            <label className="margin-field">
              Left
              <input
                max={Math.max(0, maxWidthMm - margins.right)}
                min="0"
                step="0.5"
                type="number"
                value={margins.left}
                onChange={(event) => updateMargin('left', event.target.value)}
              />
            </label>
            <label className="margin-field">
              Right
              <input
                max={Math.max(0, maxWidthMm - margins.left)}
                min="0"
                step="0.5"
                type="number"
                value={margins.right}
                onChange={(event) => updateMargin('right', event.target.value)}
              />
            </label>
            <label className="margin-field">
              Top
              <input
                max={Math.max(0, maxHeightMm - margins.bottom)}
                min="0"
                step="0.5"
                type="number"
                value={margins.top}
                onChange={(event) => updateMargin('top', event.target.value)}
              />
            </label>
            <label className="margin-field">
              Bottom
              <input
                max={Math.max(0, maxHeightMm - margins.top)}
                min="0"
                step="0.5"
                type="number"
                value={margins.bottom}
                onChange={(event) => updateMargin('bottom', event.target.value)}
              />
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
