import { useState } from 'react';

const typeLabels = {
  text: 'Text',
  rect: 'Square',
  ellipse: 'Circle',
  line: 'Line',
  image: 'Image',
  qr: 'QR Code',
};

export default function ObjectListPanel({
  objects,
  selectedId,
  onSelect,
  onMoveLayer,
  onToggleLock,
  onDeleteObject,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const listObjects = [...objects].reverse();

  return (
    <section className={`panel panel-collapsible object-list-panel ${isExpanded ? 'is-expanded' : ''}`}>
      <button
        aria-expanded={isExpanded}
        className="panel-toggle"
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
      >
        <h2>Objects</h2>
        <span className="panel-toggle-hint">{objects.length}</span>
        <span className="panel-toggle-chevron" aria-hidden="true">
          {isExpanded ? '-' : '+'}
        </span>
      </button>

      {isExpanded && (
        objects.length === 0 ? (
          <p className="muted">No objects on the label yet.</p>
        ) : (
          <ul className="object-list">
            {listObjects.map((object) => {
              const layerIndex = objects.findIndex((item) => item.id === object.id);

              return (
                <li
                  key={object.id}
                  className={`object-list-item ${selectedId === object.id ? 'selected' : ''} ${object.locked ? 'locked' : ''}`}
                >
                  <button
                    className="object-list-select"
                    type="button"
                    onClick={() => onSelect(object.id)}
                  >
                    <span className="object-list-name">{getObjectLabel(object)}</span>
                    <span className="object-list-meta">
                      {typeLabels[object.type] || object.type} · {formatMm(object.x)}, {formatMm(object.y)} mm
                    </span>
                  </button>
                  <div className="object-list-actions">
                    <button
                      aria-label="Bring forward"
                      disabled={layerIndex === objects.length - 1}
                      title="Bring forward"
                      type="button"
                      onClick={() => onMoveLayer(object.id, 1)}
                    >
                      ↑
                    </button>
                    <button
                      aria-label="Send backward"
                      disabled={layerIndex === 0}
                      title="Send backward"
                      type="button"
                      onClick={() => onMoveLayer(object.id, -1)}
                    >
                      ↓
                    </button>
                    <button
                      aria-label={object.locked ? 'Unlock object' : 'Lock object'}
                      aria-pressed={Boolean(object.locked)}
                      className={object.locked ? 'lock active' : 'lock'}
                      title={object.locked ? 'Unlock position' : 'Lock position'}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onToggleLock(object.id, !object.locked);
                      }}
                    >
                      {object.locked ? '🔒' : '🔓'}
                    </button>
                    <button
                      aria-label="Delete object"
                      className="danger"
                      title="Delete"
                      type="button"
                      onClick={() => onDeleteObject(object.id)}
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}
    </section>
  );
}

function getObjectLabel(object) {
  if (object.name?.trim()) {
    return object.name.trim();
  }

  if (object.type === 'text') {
    const text = (object.text || '').trim().replace(/\s+/g, ' ');
    if (text) {
      return text.length > 28 ? `${text.slice(0, 28)}…` : text;
    }
  }

  if (object.type === 'qr') {
    const text = (object.text || '').trim().replace(/\s+/g, ' ');
    if (text) {
      return text.length > 28 ? `${text.slice(0, 28)}…` : text;
    }
  }

  return typeLabels[object.type] || object.type;
}

function formatMm(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;
}
