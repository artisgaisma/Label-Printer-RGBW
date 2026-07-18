import { useState } from 'react';

const typeLabels = {
  text: 'Text',
  rect: 'Square',
  ellipse: 'Circle',
  line: 'Line',
  image: 'Image',
};

export default function Toolbar({
  libraryItems,
  selectedObject,
  onAddText,
  onAddRect,
  onAddEllipse,
  onAddLine,
  onImageUpload,
  onSaveToLibrary,
  onAddFromLibrary,
  onDeleteLibraryItem,
}) {
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  const selectedLibraryItem = libraryItems.find((item) => item.id === selectedLibraryId);

  function handleAddFromLibrary() {
    if (!selectedLibraryItem) {
      return;
    }

    onAddFromLibrary(selectedLibraryItem);
    setSelectedLibraryId('');
  }

  function handleDeleteLibraryItem() {
    if (!selectedLibraryItem) {
      return;
    }

    onDeleteLibraryItem(selectedLibraryItem.id);
    setSelectedLibraryId('');
  }

  return (
    <section className="panel toolbar">
      <h2>Add Objects</h2>
      <button type="button" onClick={onAddText}>
        Text
      </button>
      <button type="button" onClick={onAddRect}>
        Square
      </button>
      <button type="button" onClick={onAddEllipse}>
        Circle
      </button>
      <button type="button" onClick={onAddLine}>
        Line
      </button>
      <label className="file-button">
        Image
        <input accept="image/*" type="file" onChange={onImageUpload} />
      </label>

      <div className="library-section">
        <h3>Library</h3>

        {libraryItems.length === 0 ? (
          <p className="muted">No saved objects yet.</p>
        ) : (
          <select value={selectedLibraryId} onChange={(event) => setSelectedLibraryId(event.target.value)}>
            <option value="">Select saved object...</option>
            {libraryItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({typeLabels[item.snapshot.type] || item.snapshot.type})
              </option>
            ))}
          </select>
        )}
        <div className="button-row library-actions">
          <button disabled={!selectedLibraryItem} type="button" onClick={handleAddFromLibrary}>
            Add
          </button>
          <button className="secondary" disabled={!selectedObject} type="button" onClick={onSaveToLibrary}>
            Save
          </button>
          <button
            className="danger"
            disabled={!selectedLibraryItem}
            type="button"
            onClick={handleDeleteLibraryItem}
          >
            Delete
          </button>
        </div>
      </div>
    </section>
  );
}
