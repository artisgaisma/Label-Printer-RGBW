import { useState } from 'react';
import { defaultFontFamily, fontLibrary } from '../lib/fontLibrary';
import { defaultGridSizeMm, normalizeGridSizeMm } from '../lib/gridUtils';
import { lineStyleOptions } from '../lib/objectLibraryStorage';

export default function PropertyPanel({
  template,
  object,
  onTemplateChange,
  onObjectChange,
  onMoveLayer,
  onMakeImageBlack,
}) {
  const [convertingImage, setConvertingImage] = useState(false);
  const gridSizeMm = normalizeGridSizeMm(template.gridSizeMm ?? defaultGridSizeMm);

  return (
    <section className="panel properties">
      <h2>Properties</h2>
      <label>
        Background
        <input type="color" value={template.background} onChange={(event) => onTemplateChange({ background: event.target.value })} />
      </label>
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
            onChange={(event) =>
              onTemplateChange({ gridSizeMm: normalizeGridSizeMm(event.target.value) })
            }
          />
        </label>
      </div>

      {!object && <p className="muted">Select an object to edit its position, size, and style.</p>}

      {object && (
        <>
          <div className="input-row">
            <NumberField disabled={object.locked} label="X mm" value={object.x} onChange={(value) => onObjectChange({ x: value })} />
            <NumberField disabled={object.locked} label="Y mm" value={object.y} onChange={(value) => onObjectChange({ y: value })} />
          </div>
          <div className="input-row">
            <NumberField disabled={object.locked} label="W mm" value={object.width} onChange={(value) => onObjectChange({ width: value })} />
            {object.type !== 'line' && (
              <NumberField disabled={object.locked} label="H mm" value={object.height} onChange={(value) => onObjectChange({ height: value })} />
            )}
          </div>

          {object.type === 'text' && (
            <>
              <label>
                Text
                <textarea rows="3" value={object.text} onChange={(event) => onObjectChange({ text: event.target.value })} />
              </label>
              <label>
                Font
                <select value={object.fontFamily || defaultFontFamily} onChange={(event) => onObjectChange({ fontFamily: event.target.value })}>
                  {fontLibrary.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="format-row">
                <FormatButton
                  active={object.fontWeight === '700'}
                  label="B"
                  onClick={() =>
                    onObjectChange({ fontWeight: object.fontWeight === '700' ? '400' : '700' })
                  }
                />
                <FormatButton
                  active={object.fontStyle === 'italic'}
                  className="italic"
                  label="I"
                  onClick={() =>
                    onObjectChange({ fontStyle: object.fontStyle === 'italic' ? 'normal' : 'italic' })
                  }
                />
                <FormatButton
                  active={object.textDecoration === 'underline'}
                  className="underline"
                  label="U"
                  onClick={() =>
                    onObjectChange({
                      textDecoration: object.textDecoration === 'underline' ? 'none' : 'underline',
                    })
                  }
                />
              </div>
              <div className="input-row">
                <NumberField label="Font mm" value={object.fontSize} onChange={(value) => onObjectChange({ fontSize: value })} />
                <NumberField
                  label="Letter spacing mm"
                  value={object.letterSpacing || 0}
                  onChange={(value) => onObjectChange({ letterSpacing: value })}
                />
              </div>
              <div className="input-row">
                <label>
                  Color
                  <input type="color" value={object.color} onChange={(event) => onObjectChange({ color: event.target.value })} />
                </label>
                <label>
                  Align
                  <div className="align-row">
                    <AlignButton
                      active={object.textAlign === 'left'}
                      align="left"
                      onClick={() => onObjectChange({ textAlign: 'left' })}
                    />
                    <AlignButton
                      active={object.textAlign === 'center'}
                      align="center"
                      onClick={() => onObjectChange({ textAlign: 'center' })}
                    />
                    <AlignButton
                      active={object.textAlign === 'right'}
                      align="right"
                      onClick={() => onObjectChange({ textAlign: 'right' })}
                    />
                  </div>
                </label>
              </div>
            </>
          )}

          {object.type === 'rect' && (
            <>
              <div className="input-row">
                <label>
                  Fill
                  <input type="color" value={normalizeColor(object.fill)} onChange={(event) => onObjectChange({ fill: event.target.value })} />
                </label>
                <label>
                  Stroke
                  <input type="color" value={object.stroke} onChange={(event) => onObjectChange({ stroke: event.target.value })} />
                </label>
              </div>
              <div className="input-row">
                <NumberField label="Stroke mm" value={object.strokeWidth} onChange={(value) => onObjectChange({ strokeWidth: value })} />
                <NumberField label="Radius mm" value={object.radius} onChange={(value) => onObjectChange({ radius: value })} />
              </div>
              <LineStyleFields object={object} onObjectChange={onObjectChange} />
            </>
          )}

          {object.type === 'ellipse' && (
            <>
              <div className="input-row">
                <label>
                  Fill
                  <input type="color" value={normalizeColor(object.fill)} onChange={(event) => onObjectChange({ fill: event.target.value })} />
                </label>
                <label>
                  Stroke
                  <input type="color" value={object.stroke} onChange={(event) => onObjectChange({ stroke: event.target.value })} />
                </label>
              </div>
              <NumberField label="Stroke mm" value={object.strokeWidth} onChange={(value) => onObjectChange({ strokeWidth: value })} />
              <LineStyleFields object={object} onObjectChange={onObjectChange} />
              <p className="hint">Resize width and height independently to make an oval.</p>
            </>
          )}

          {object.type === 'line' && (
            <>
              <LineStyleFields object={object} onObjectChange={onObjectChange} />
              <div className="input-row">
                <label>
                  Stroke
                  <input type="color" value={object.stroke} onChange={(event) => onObjectChange({ stroke: event.target.value })} />
                </label>
                <NumberField label="Stroke mm" value={object.strokeWidth} onChange={(value) => onObjectChange({ strokeWidth: value })} />
              </div>
            </>
          )}

          {object.type === 'image' && (
            <>
              <p className="hint">{object.name || 'Image'}</p>
              <button
                disabled={!object.src || convertingImage}
                type="button"
                onClick={async () => {
                  setConvertingImage(true);
                  try {
                    await onMakeImageBlack();
                  } finally {
                    setConvertingImage(false);
                  }
                }}
              >
                {convertingImage ? 'Converting...' : 'Make Black'}
              </button>
            </>
          )}

          <div className="button-row">
            <button type="button" onClick={() => onMoveLayer(-1)}>
              Send Back
            </button>
            <button type="button" onClick={() => onMoveLayer(1)}>
              Bring Front
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function LineStyleFields({ object, onObjectChange }) {
  return (
    <>
      <label>
        Line style
        <select value={object.lineStyle || 'solid'} onChange={(event) => onObjectChange({ lineStyle: event.target.value })}>
          {lineStyleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {object.lineStyle === 'double' && (
        <NumberField
          label="Double gap mm"
          value={object.doubleGap || 1}
          onChange={(value) => onObjectChange({ doubleGap: value })}
        />
      )}
    </>
  );
}

function FormatButton({ label, active, className = '', onClick }) {
  return (
    <button
      aria-pressed={active}
      className={`format-button ${className} ${active ? 'active' : ''}`.trim()}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function AlignButton({ align, active, onClick }) {
  const labels = { left: 'Align left', center: 'Align center', right: 'Align right' };

  return (
    <button
      aria-label={labels[align]}
      aria-pressed={active}
      className={`align-button ${active ? 'active' : ''}`.trim()}
      type="button"
      onClick={onClick}
    >
      <AlignIcon align={align} />
    </button>
  );
}

function AlignIcon({ align }) {
  const topX = align === 'left' ? 1 : align === 'center' ? 3 : 5;
  const bottomX = align === 'left' ? 1 : align === 'center' ? 4 : 7;

  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 16 16">
      <rect height="1.5" width="10" x={topX} y="2" />
      <rect height="1.5" width="14" x="1" y="6" />
      <rect height="1.5" width="8" x={bottomX} y="10" />
    </svg>
  );
}

function NumberField({ label, value, disabled = false, onChange }) {
  return (
    <label>
      {label}
      <input
        disabled={disabled}
        min="0"
        step="0.1"
        type="number"
        value={roundValue(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function normalizeColor(value) {
  return value === 'transparent' ? '#ffffff' : value;
}

function roundValue(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;
}
