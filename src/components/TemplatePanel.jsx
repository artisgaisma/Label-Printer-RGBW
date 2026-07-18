import { useState } from 'react';

export default function TemplatePanel({
  template,
  templates,
  onSave,
  onLoad,
  onDelete,
  onTemplateChange,
  onDownloadJson,
  onImportJson,
  onExportPdf,
  onPrint,
}) {
  const [selectedTemplateName, setSelectedTemplateName] = useState('');

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
    <section className="panel">
      <h2>Templates & Export</h2>
      <label>
        Template name
        <input value={template.name} onChange={(event) => onTemplateChange({ name: event.target.value })} />
      </label>
      {templates.length === 0 ? (
        <p className="muted">No saved templates yet.</p>
      ) : (
        <select value={selectedTemplateName} onChange={(event) => setSelectedTemplateName(event.target.value)}>
          <option value="">Select saved template...</option>
          {templates.map((savedTemplate) => (
            <option key={`${savedTemplate.name}-${savedTemplate.savedAt}`} value={savedTemplate.name}>
              {savedTemplate.name}
            </option>
          ))}
        </select>
      )}
      <div className="button-row library-actions">
        <button disabled={!selectedTemplateName} type="button" onClick={handleAddTemplate}>
          Add
        </button>
        <button className="secondary" type="button" onClick={onSave}>
          Save
        </button>
        <button className="danger" disabled={!selectedTemplateName} type="button" onClick={handleDeleteTemplate}>
          Delete
        </button>
      </div>
      <button type="button" onClick={onDownloadJson}>
        Download JSON
      </button>
      <label className="file-button secondary">
        Import JSON
        <input accept="application/json,.json" type="file" onChange={onImportJson} />
      </label>
      <button className="primary" type="button" onClick={onExportPdf}>
        Export PDF
      </button>
      <button type="button" onClick={onPrint}>
        Print
      </button>
    </section>
  );
}
