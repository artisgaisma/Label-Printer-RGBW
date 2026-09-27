import { useRef, useState } from 'react';

export default function TemplatePanel({
  templates,
  onSave,
  onLoad,
  onDelete,
  onDownloadJson,
  onImportJson,
}) {
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [expanded, setExpanded] = useState(false);
  const importInputRef = useRef(null);

  function handleImportJson() {
    setSelectedTemplateName('');
    importInputRef.current?.click();
  }

  async function handleSaveTemplate() {
    const name = await onSave();
    if (name) {
      setSelectedTemplateName(name);
    }
  }

  function handleAddTemplate() {
    if (!selectedTemplateName) {
      return;
    }

    onLoad(selectedTemplateName);
    setSelectedTemplateName('');
  }

  function handleDeleteTemplate() {
    if (!selectedTemplateName) {
      return;
    }

    onDelete(selectedTemplateName);
    setSelectedTemplateName('');
  }

  return (
    <div className={`template-menu ${expanded ? 'is-open' : ''}`}>
      <button
        aria-expanded={expanded}
        aria-haspopup="true"
        className="template-button"
        type="button"
        onClick={() => setExpanded((open) => !open)}
      >
        Template
      </button>
      {expanded ? (
        <section className="panel template-dropdown">
          <h2>Templates & Export</h2>
          <div className="template-select-row">
            <button className="template-import-option" type="button" onClick={handleImportJson}>
              Import JSON...
            </button>
            {templates.length === 0 ? (
              <p className="template-library-empty">No saved templates in this browser yet. Click Save to keep this design.</p>
            ) : (
              <ul className="template-library-list">
                {templates.map((savedTemplate) => (
                  <li key={`${savedTemplate.name}-${savedTemplate.savedAt}`}>
                    <button
                      className={`template-library-item ${
                        selectedTemplateName === savedTemplate.name ? 'active' : ''
                      }`}
                      type="button"
                      onClick={() => setSelectedTemplateName(savedTemplate.name)}
                    >
                      {savedTemplate.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input ref={importInputRef} accept="application/json,.json" hidden type="file" onChange={onImportJson} />
          </div>
          <div className="button-row library-actions">
            <button disabled={!selectedTemplateName} type="button" onClick={handleAddTemplate}>
              Add
            </button>
            <button className="secondary" type="button" onClick={handleSaveTemplate}>
              Save
            </button>
            <button className="danger" disabled={!selectedTemplateName} type="button" onClick={handleDeleteTemplate}>
              Delete
            </button>
          </div>
          <div className="button-row template-file-actions">
            <button aria-label="Download JSON" title="Download JSON" type="button" onClick={onDownloadJson}>
              <DownloadIcon />
              JSON
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" className="action-icon" viewBox="0 0 24 24">
      <path d="M12 3v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}
