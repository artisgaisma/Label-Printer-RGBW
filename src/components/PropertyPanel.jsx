import { useState } from 'react';
import { defaultFontFamily, fontLibrary } from '../lib/fontLibrary';
import { lineStyleOptions } from '../lib/objectLibraryStorage';
import { qrErrorCorrectionLevels } from '../lib/qrCode';

export default function PropertyPanel({
  object,
  onObjectChange,
  onMoveLayer,
  onMakeImageBlack,
  onPrintAutoCounter,
}) {
  const [convertingImage, setConvertingImage] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className={`panel panel-collapsible properties ${isExpanded ? 'is-expanded' : ''}`}>
      <button
        aria-expanded={isExpanded}
        className="panel-toggle"
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
      >
        <h2>Properties</h2>
        <span className="panel-toggle-hint">{object ? object.name || object.type : 'No selection'}</span>
        <span className="panel-toggle-chevron" aria-hidden="true">
          {isExpanded ? '-' : '+'}
        </span>
      </button>

      {isExpanded && (
        <div className="property-panel-body">
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
              <div className="input-row">
                <NumberField
                  disabled={object.locked}
                  label="Angle °"
                  max={180}
                  min={-180}
                  step="1"
                  value={object.angle ?? 0}
                  onChange={(value) => onObjectChange({ angle: value })}
                />
              </div>

          {object.type === 'text' && (
            <>
              <label>
                Text
                <textarea rows="3" value={object.text} onChange={(event) => onObjectChange({ text: event.target.value })} />
              </label>
              {object.isCounter && (
                <div className="auto-counter-section">
                  <h3>Auto Counter</h3>
                  <p className="hint">Prints this label once for each number using the current page format.</p>
                  <div className="input-row">
                    <label>
                      Start number
                      <input
                        inputMode="numeric"
                        value={object.counterStart ?? object.text ?? '1'}
                        onChange={(event) => onObjectChange({ counterStart: event.target.value })}
                      />
                    </label>
                    <label>
                      End number
                      <input
                        inputMode="numeric"
                        placeholder="Optional"
                        value={object.counterEnd ?? ''}
                        onChange={(event) => onObjectChange({ counterEnd: event.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    Count
                    <input
                      inputMode="numeric"
                      placeholder="Used when end is empty"
                      value={object.counterCount ?? ''}
                      onChange={(event) => onObjectChange({ counterCount: event.target.value })}
                    />
                  </label>
                  <button
                    className="primary"
                    type="button"
                    onClick={() =>
                      onPrintAutoCounter({
                        startNumber: object.counterStart ?? object.text ?? '1',
                        endNumber: object.counterEnd ?? '',
                        count: object.counterCount ?? '',
                      })
                    }
                  >
                    Print Auto Counter
                  </button>
                </div>
              )}
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

          {object.type === 'qr' && (
            <>
              <label>
                QR code info
                <textarea rows="4" value={object.text || ''} onChange={(event) => onObjectChange({ text: event.target.value })} />
              </label>
              <label>
                Error correction
                <select
                  value={object.errorCorrectionLevel || 'M'}
                  onChange={(event) => onObjectChange({ errorCorrectionLevel: event.target.value })}
                >
                  {qrErrorCorrectionLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="hint">The QR code updates on the label as you edit this text.</p>
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
        </div>
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

function NumberField({ label, value, disabled = false, min = 0, max, step = '0.1', onChange }) {
  return (
    <label>
      {label}
      <input
        disabled={disabled}
        max={max}
        min={min}
        step={step}
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
