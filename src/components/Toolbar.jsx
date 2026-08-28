import { useEffect, useState } from 'react';
import { getFontCssFamily } from '../lib/fontLibrary';
import { createQrMatrix } from '../lib/qrCode';

const typeLabels = {
  text: 'Text',
  rect: 'Square',
  ellipse: 'Circle',
  line: 'Line',
  image: 'Image',
  qr: 'QR Code',
};

export default function Toolbar({
  libraryItems,
  selectedObject,
  onAddText,
  onAddCounter,
  onAddRect,
  onAddEllipse,
  onAddLine,
  onAddQr,
  onImageUpload,
  onSaveToLibrary,
  onAddFromLibrary,
  onDeleteLibraryItem,
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    if (!libraryOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setLibraryOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [libraryOpen]);

  function handleAddFromLibrary(item) {
    onAddFromLibrary(item);
    setLibraryOpen(false);
  }

  function handleDeleteLibraryItem(item) {
    onDeleteLibraryItem(item.id);
  }

  return (
    <>
      <section className="panel toolbar">
        <h2>Add Objects</h2>
        <ObjectToolButton ariaLabel="Text" onClick={onAddText}>
          <span className="object-tool-text-preview">ABCD</span>
        </ObjectToolButton>
        <ObjectToolButton ariaLabel="Auto Counter" onClick={onAddCounter}>
          <span className="object-tool-counter-preview">001-07x</span>
        </ObjectToolButton>
        <ObjectToolButton ariaLabel="Square" onClick={onAddRect}>
          <svg aria-hidden="true" className="object-tool-icon" viewBox="0 0 48 48">
            <rect x="11" y="11" width="26" height="26" />
          </svg>
        </ObjectToolButton>
        <ObjectToolButton ariaLabel="Circle" onClick={onAddEllipse}>
          <svg aria-hidden="true" className="object-tool-icon" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="14" />
          </svg>
        </ObjectToolButton>
        <ObjectToolButton ariaLabel="Line" onClick={onAddLine}>
          <svg aria-hidden="true" className="object-tool-icon" viewBox="0 0 48 48">
            <line x1="10" y1="34" x2="38" y2="14" />
          </svg>
        </ObjectToolButton>
        <ObjectToolButton ariaLabel="QR Code" previewClassName="qr-tool-preview" onClick={onAddQr}>
          <svg aria-hidden="true" className="object-tool-icon qr-tool-icon" viewBox="0 0 48 48">
            <rect x="4" y="4" width="14" height="14" />
            <rect x="30" y="4" width="14" height="14" />
            <rect x="4" y="30" width="14" height="14" />
            <rect x="24" y="24" width="6" height="6" />
            <rect x="36" y="24" width="8" height="8" />
            <rect x="24" y="38" width="14" height="6" />
          </svg>
        </ObjectToolButton>
        <label className="file-button object-tool">
          <span className="object-tool-preview">
            <svg aria-hidden="true" className="object-tool-icon" viewBox="0 0 48 48">
              <rect x="9" y="11" width="30" height="26" rx="2" />
              <circle cx="18" cy="19" r="3" />
              <path d="M12 33L21 25L27 30L32 24L38 33" />
            </svg>
          </span>
          <span className="visually-hidden">Image</span>
          <input accept="image/*" type="file" onChange={onImageUpload} />
        </label>
        <ObjectToolButton label="Library" onClick={() => setLibraryOpen(true)}>
          <svg aria-hidden="true" className="object-tool-icon" viewBox="0 0 48 48">
            <path d="M10 15h28v24H10z" />
            <path d="M14 10h20v5H14z" />
            <path d="M17 24h14" />
            <path d="M17 30h10" />
          </svg>
        </ObjectToolButton>
      </section>

      {libraryOpen ? (
        <div className="library-picker-backdrop" role="presentation" onMouseDown={() => setLibraryOpen(false)}>
          <section
            aria-modal="true"
            className="panel library-picker"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="library-picker-header">
              <div>
                <p className="eyebrow">Object Library</p>
                <h2>Choose Saved Object</h2>
              </div>
              <button className="settings-close" type="button" onClick={() => setLibraryOpen(false)}>
                x
              </button>
            </div>

            {libraryItems.length === 0 ? (
              <p className="muted">No saved objects yet. Select an object and save it to the library first.</p>
            ) : (
              <ul className="library-list">
                {libraryItems.map((item) => (
                  <li key={item.id} className="library-item">
                    <button className="library-item-select" type="button" onClick={() => handleAddFromLibrary(item)}>
                      <LibraryItemPreview object={item.snapshot} />
                      <span className="library-item-info">
                        <span className="library-item-name">{item.name}</span>
                        <span className="library-item-type">{typeLabels[item.snapshot.type] || item.snapshot.type}</span>
                      </span>
                    </button>
                    <div className="library-item-actions">
                      <button type="button" onClick={() => handleAddFromLibrary(item)}>
                        Choose
                      </button>
                      <button className="danger" type="button" onClick={() => handleDeleteLibraryItem(item)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="library-picker-footer">
              <button className="secondary" disabled={!selectedObject} type="button" onClick={onSaveToLibrary}>
                Save selected object
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function LibraryItemPreview({ object }) {
  const previewWidth = 84;
  const previewHeight = 54;
  const objectWidth = Math.max(1, Number(object.width) || 1);
  const objectHeight = Math.max(
    1,
    object.type === 'line'
      ? Math.max(8, Math.abs(Number(object.height) || 0) + (object.strokeWidth || 0.4))
      : Number(object.height) || 1
  );
  const scale = Math.min((previewWidth - 18) / objectWidth, (previewHeight - 18) / objectHeight, 3);
  const scaledWidth = objectWidth * scale;
  const scaledHeight = objectHeight * scale;

  return (
    <span className="library-item-preview" aria-hidden="true">
      <span
        className="library-item-preview-object"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          transform: object.angle ? `rotate(${object.angle}deg)` : undefined,
        }}
      >
        {renderPreviewObject(object, scale, scaledWidth, scaledHeight)}
      </span>
    </span>
  );
}

function renderPreviewObject(object, scale, width, height) {
  if (object.type === 'text') {
    return (
      <span
        className="library-preview-text"
        style={{
          color: object.color,
          fontFamily: getFontCssFamily(object.fontFamily),
          fontSize: `${Math.max(8, (object.fontSize || 10) * scale)}px`,
          fontStyle: object.fontStyle || 'normal',
          fontWeight: object.fontWeight,
          justifyContent: getTextJustifyContent(object.textAlign),
          letterSpacing: `${(object.letterSpacing || 0) * scale}px`,
          textAlign: object.textAlign,
          textDecoration: object.textDecoration || 'none',
        }}
      >
        {object.text || 'Text'}
      </span>
    );
  }

  if (object.type === 'rect' || object.type === 'ellipse') {
    const strokeWidth = Math.max(1, (object.strokeWidth || 0.4) * scale);
    const dashArray = getStrokeDashArray(object.lineStyle, strokeWidth, object.doubleGap, scale);

    return (
      <svg className="library-preview-svg" viewBox={`0 0 ${width} ${height}`}>
        {object.type === 'rect' ? (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={Math.max(0, width - strokeWidth)}
            height={Math.max(0, height - strokeWidth)}
            rx={(object.radius || 0) * scale}
            fill={object.fill || 'transparent'}
            stroke={object.stroke || '#1a1c1e'}
            strokeDasharray={dashArray}
            strokeWidth={strokeWidth}
          />
        ) : (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={Math.max(0, (width - strokeWidth) / 2)}
            ry={Math.max(0, (height - strokeWidth) / 2)}
            fill={object.fill || 'transparent'}
            stroke={object.stroke || '#1a1c1e'}
            strokeDasharray={dashArray}
            strokeWidth={strokeWidth}
          />
        )}
      </svg>
    );
  }

  if (object.type === 'line') {
    const strokeWidth = Math.max(1, (object.strokeWidth || 0.4) * scale);
    const dashArray = getStrokeDashArray(object.lineStyle, strokeWidth, object.doubleGap, scale);
    const heightDelta = (Number(object.height) || 0) * scale;
    const y1 = height / 2 - heightDelta / 2;
    const y2 = height / 2 + heightDelta / 2;

    return (
      <svg className="library-preview-svg" viewBox={`0 0 ${width} ${height}`}>
        <line
          x1={strokeWidth}
          y1={y1}
          x2={Math.max(strokeWidth, width - strokeWidth)}
          y2={y2}
          stroke={object.stroke || '#1a1c1e'}
          strokeDasharray={dashArray}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  if (object.type === 'image' && object.src) {
    return <img alt="" className="library-preview-image" src={object.src} />;
  }

  if (object.type === 'qr') {
    return <QrPreview object={object} />;
  }

  return <span className="library-preview-placeholder">{typeLabels[object.type] || 'Object'}</span>;
}

function QrPreview({ object }) {
  const matrix = createQrMatrix(object);

  if (!matrix) {
    return <span className="library-preview-placeholder">QR</span>;
  }

  const quietZone = 1;
  const viewBoxSize = matrix.size + quietZone * 2;

  return (
    <svg className="library-preview-qr" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
      <rect fill="#ffffff" height={viewBoxSize} width={viewBoxSize} />
      {matrix.data.map((filled, index) => {
        if (!filled) {
          return null;
        }

        const x = (index % matrix.size) + quietZone;
        const y = Math.floor(index / matrix.size) + quietZone;

        return <rect key={index} fill="#000000" height="1" width="1" x={x} y={y} />;
      })}
    </svg>
  );
}

function getStrokeDashArray(lineStyle, strokeWidth, doubleGap, scale) {
  if (lineStyle === 'dashed') {
    return `${strokeWidth * 4} ${strokeWidth * 2.5}`;
  }
  if (lineStyle === 'dotted') {
    return `0 ${strokeWidth * 2.5}`;
  }
  if (lineStyle === 'dash-dot') {
    return `${strokeWidth * 4} ${strokeWidth * 2} ${strokeWidth} ${strokeWidth * 2}`;
  }
  if (lineStyle === 'long-dash') {
    return `${strokeWidth * 8} ${strokeWidth * 2.5}`;
  }
  if (lineStyle === 'double') {
    return `${Math.max(strokeWidth, (doubleGap || 1) * scale)} ${strokeWidth * 1.5}`;
  }
  return undefined;
}

function getTextJustifyContent(textAlign) {
  if (textAlign === 'left') {
    return 'flex-start';
  }
  if (textAlign === 'right') {
    return 'flex-end';
  }
  return 'center';
}

function ObjectToolButton({ ariaLabel, children, label, previewClassName = '', onClick }) {
  return (
    <button aria-label={ariaLabel || label} className="object-tool" type="button" onClick={onClick}>
      <span className={`object-tool-preview ${previewClassName}`.trim()}>{children}</span>
      {label ? <span className="object-tool-label">{label}</span> : null}
    </button>
  );
}
