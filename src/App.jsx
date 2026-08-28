import { useEffect, useMemo, useState } from 'react';
import GridPanel from './components/GridPanel';
import MarginsPanel from './components/MarginsPanel';
import LabelCanvas from './components/LabelCanvas';
import ObjectListPanel from './components/ObjectListPanel';
import PresetPicker from './components/PresetPicker';
import PropertyPanel from './components/PropertyPanel';
import SettingsPage from './components/SettingsPage';
import TemplatePanel from './components/TemplatePanel';
import Toolbar from './components/Toolbar';
import {
  findPreset,
  getStartupPreset,
  loadLastUsedSize,
  loadPresets,
  saveLastUsedSize,
  savePreset,
  savePresets,
} from './lib/labelPresets';
import { clampObjectToLabel, createId, createObject, createTemplate } from './lib/labelModel';
import {
  defaultLibraryName,
  deleteLibraryItem,
  loadLibrary,
  saveLibraryItem,
  snapshotFromObject,
} from './lib/objectLibraryStorage';
import { convertImageToBlack } from './lib/imageUtils';
import { exportTemplateToPdf, printTemplateToPdf, printTemplatesToPdf } from './lib/pdfExport';
import {
  deleteTemplate,
  downloadTemplate,
  loadTemplates,
  readImageFile,
  readTemplateFile,
  saveTemplate,
} from './lib/templateStorage';
import { useTemplateHistory } from './lib/useTemplateHistory';

export default function App() {
  const {
    template,
    setTemplate,
    undo,
    redo,
    beginGesture,
    endGesture,
    canUndo,
    canRedo,
  } = useTemplateHistory(() => createTemplate(getStartupPreset()));
  const [selectedId, setSelectedId] = useState(template.objects[0]?.id || null);
  const [templates, setTemplates] = useState(() => loadTemplates());
  const [presets, setPresets] = useState([]);
  const [savingPreset, setSavingPreset] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copiedObject, setCopiedObject] = useState(null);
  const [libraryItems, setLibraryItems] = useState(() => loadLibrary());
  const [hadStoredSize] = useState(() => Boolean(loadLastUsedSize()));
  const selectedObject = useMemo(
    () => template.objects.find((object) => object.id === selectedId),
    [selectedId, template.objects],
  );

  useEffect(() => {
    saveLastUsedSize(template);
  }, [template.heightMm, template.presetId, template.widthMm]);

  function updateTemplate(patch) {
    setTemplate((current) => ({
      ...current,
      ...patch,
    }));
  }

  function updateObject(id, patch) {
    setTemplate((current) => ({
      ...current,
      objects: current.objects.map((object) => {
        if (object.id !== id) {
          return object;
        }

        if (object.locked && hasPositionOrSizeChange(patch)) {
          return object;
        }

        return clampObjectToLabel({ ...object, ...patch }, current);
      }),
    }));
  }

  function toggleObjectLock(id, locked) {
    setTemplate((current) => ({
      ...current,
      objects: current.objects.map((object) =>
        object.id === id ? { ...object, locked: Boolean(locked) } : object,
      ),
    }));
  }

  function updateSelectedObject(patch) {
    if (selectedId) {
      updateObject(selectedId, patch);
    }
  }

  function addObject(type, overrides) {
    const object = createObject(type, overrides);
    setTemplate((current) => ({
      ...current,
      objects: [...current.objects, clampObjectToLabel(object, current)],
    }));
    setSelectedId(object.id);
  }

  function addCounterObject() {
    addObject('text', {
      counterCount: '',
      counterEnd: '',
      counterStart: '1',
      isCounter: true,
      name: 'Auto counter',
      text: '1',
    });
  }

  function handlePresetChange(id) {
    if (id === 'custom') {
      setTemplate((current) => ({ ...current, presetId: 'custom' }));
      return;
    }

    const preset = findPreset(presets, id);
    if (!preset) {
      return;
    }

    setTemplate((current) => ({
      ...current,
      presetId: preset.id,
      widthMm: preset.widthMm,
      heightMm: preset.heightMm,
      objects: current.objects.map((object) =>
        clampObjectToLabel(object, { ...current, widthMm: preset.widthMm, heightMm: preset.heightMm }),
      ),
    }));
  }

  async function handleSavePreset(preset) {
    setSavingPreset(true);

    try {
      const nextPresets = await savePreset(preset);
      setPresets(nextPresets);

      const savedPreset = nextPresets.find((item) => item.name === preset.name) || nextPresets[0];
      if (savedPreset) {
        setTemplate((current) => ({
          ...current,
          presetId: savedPreset.id,
          widthMm: savedPreset.widthMm,
          heightMm: savedPreset.heightMm,
        }));
      }
    } catch (error) {
      console.error(error);
      window.alert('Unable to save preset. Make sure the dev server or production server is running.');
    } finally {
      setSavingPreset(false);
    }
  }

  async function handleSavePresets(nextPresetList) {
    setSavingPreset(true);

    try {
      const savedPresets = await savePresets(nextPresetList);
      setPresets(savedPresets);

      setTemplate((current) => {
        const matchingPreset = savedPresets.find((item) => item.id === current.presetId);
        if (!matchingPreset) {
          return current;
        }

        const next = {
          ...current,
          widthMm: matchingPreset.widthMm,
          heightMm: matchingPreset.heightMm,
        };

        return {
          ...next,
          objects: current.objects.map((object) => clampObjectToLabel(object, next)),
        };
      });
    } catch (error) {
      console.error(error);
      window.alert('Unable to save presets. Make sure the dev server or production server is running.');
    } finally {
      setSavingPreset(false);
    }
  }

  function handleCustomSizeChange(key, value) {
    setTemplate((current) => {
      const next = {
        ...current,
        presetId: 'custom',
        [key]: Math.max(5, value || 5),
      };

      return {
        ...next,
        objects: current.objects.map((object) => clampObjectToLabel(object, next)),
      };
    });
  }

  function deleteObject(id) {
    setTemplate((current) => ({
      ...current,
      objects: current.objects.filter((object) => object.id !== id),
    }));

    if (selectedId === id) {
      setSelectedId(null);
    }
  }

  function deleteSelectedObject() {
    if (!selectedId) {
      return;
    }

    deleteObject(selectedId);
  }

  function copySelectedObject() {
    if (selectedObject) {
      setCopiedObject(selectedObject);
    }
  }

  function pasteCopiedObject() {
    if (!copiedObject) {
      return;
    }

    const object = {
      ...copiedObject,
      id: createId(),
      x: copiedObject.x + 4,
      y: copiedObject.y + 4,
      name: copiedObject.name ? `${copiedObject.name} copy` : copiedObject.name,
    };

    setTemplate((current) => {
      const nextObject = clampObjectToLabel(object, current);

      return {
        ...current,
        objects: [...current.objects, nextObject],
      };
    });
    setSelectedId(object.id);
  }

  useEffect(() => {
    let cancelled = false;

    loadPresets()
      .then((loadedPresets) => {
        if (cancelled) {
          return;
        }

        setPresets(loadedPresets);

        // First launch (no saved size): adopt the first preset instead of the
        // hardcoded default that may not exist in the preset list.
        if (hadStoredSize || !loadedPresets[0]) {
          return;
        }

        const startupPreset = getStartupPreset(loadedPresets);
        setTemplate((current) => {
          if (
            current.presetId === startupPreset.id &&
            current.widthMm === startupPreset.widthMm &&
            current.heightMm === startupPreset.heightMm
          ) {
            return current;
          }

          const next = {
            ...current,
            presetId: startupPreset.id,
            widthMm: startupPreset.widthMm,
            heightMm: startupPreset.heightMm,
          };

          return {
            ...next,
            objects: current.objects.map((object) => clampObjectToLabel(object, next)),
          };
        });
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [hadStoredSize, setTemplate]);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        const key = event.key.toLowerCase();

        if (key === 'z' && !event.shiftKey) {
          event.preventDefault();
          undo();
          return;
        }

        if (key === 'y' || (key === 'z' && event.shiftKey)) {
          event.preventDefault();
          redo();
          return;
        }
      }

      if (isFormField(event.target)) {
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault();
        deleteSelectedObject();
        return;
      }

      if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'c' && selectedObject) {
        event.preventDefault();
        copySelectedObject();
        return;
      }

      if (key === 'v' && copiedObject) {
        event.preventDefault();
        pasteCopiedObject();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copiedObject, selectedId, selectedObject, undo, redo]);

  function moveLayer(direction) {
    if (!selectedId) {
      return;
    }

    moveObjectLayer(selectedId, direction);
  }

  function moveObjectLayer(id, direction) {
    setTemplate((current) => {
      const objects = [...current.objects];
      const index = objects.findIndex((object) => object.id === id);
      const nextIndex = Math.min(Math.max(index + direction, 0), objects.length - 1);

      if (index === -1 || index === nextIndex) {
        return current;
      }

      const [object] = objects.splice(index, 1);
      objects.splice(nextIndex, 0, object);
      return { ...current, objects };
    });
  }

  function handleSaveToLibrary() {
    if (!selectedObject) {
      return;
    }

    const snapshot = snapshotFromObject(selectedObject);
    const name = window.prompt('Library item name', defaultLibraryName(snapshot));
    if (!name) {
      return;
    }

    setLibraryItems(saveLibraryItem(snapshot, name));
  }

  function handleAddFromLibrary(item) {
    const object = createObject(item.snapshot.type, {
      ...item.snapshot,
      x: item.snapshot.x + 4,
      y: item.snapshot.y + 4,
    });

    setTemplate((current) => ({
      ...current,
      objects: [...current.objects, clampObjectToLabel(object, current)],
    }));
    setSelectedId(object.id);
  }

  function handleDeleteLibraryItem(id) {
    setLibraryItems(deleteLibraryItem(id));
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const src = await readImageFile(file);
    addObject('image', {
      src,
      name: file.name,
    });
    event.target.value = '';
  }

  function handleSaveTemplate() {
    const name = window.prompt('Label name', template.name || 'Untitled label')?.trim();
    if (!name) {
      return;
    }

    const namedTemplate = {
      ...template,
      name,
    };

    setTemplate(namedTemplate);
    setTemplates(saveTemplate(namedTemplate));
  }

  function handleLoadTemplate(name) {
    const savedTemplate = templates.find((item) => item.name === name);
    if (savedTemplate) {
      setTemplate(savedTemplate);
      setSelectedId(savedTemplate.objects[0]?.id || null);
    }
  }

  function handleDeleteTemplate(name) {
    setTemplates(deleteTemplate(name));
  }

  async function handleImportTemplate(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const importedTemplate = await readTemplateFile(file);
    setTemplate(importedTemplate);
    setSelectedId(importedTemplate.objects?.[0]?.id || null);
    event.target.value = '';
  }

  async function handleMakeImageBlack() {
    if (!selectedObject || selectedObject.type !== 'image' || !selectedObject.src) {
      return;
    }

    try {
      const src = await convertImageToBlack(selectedObject.src);
      updateSelectedObject({ src });
    } catch (error) {
      console.error(error);
      window.alert('Unable to convert image to black.');
    }
  }

  async function handlePrintAutoCounter(options) {
    const sequence = buildCounterSequence(options);
    if (!sequence.length) {
      window.alert('Enter a valid start/end range or a count greater than 0.');
      return;
    }

    const counterTextObjects = template.objects.filter((object) => object.type === 'text' && object.isCounter);
    if (!counterTextObjects.length) {
      window.alert('Add an Auto Counter object first, or mark a text object as Auto counter.');
      return;
    }

    const templatesToPrint = sequence.map((value) => ({
      ...template,
      objects: template.objects.map((object) =>
        object.type === 'text' && object.isCounter ? { ...object, text: value } : object,
      ),
    }));

    await printTemplatesToPdf(templatesToPrint);
  }

  return (
    <main className="app">
      <header className="app-header">
        <div className="header-main">
          <div>
            <h1>Label Printer</h1>
          </div>
          <PresetPicker
            presets={presets}
            savingPreset={savingPreset}
            template={template}
            onPresetChange={handlePresetChange}
            onSavePreset={handleSavePreset}
            onSavePresets={handleSavePresets}
          />
          <TemplatePanel
            templates={templates}
            onDelete={handleDeleteTemplate}
            onDownloadJson={() => downloadTemplate(template)}
            onImportJson={handleImportTemplate}
            onLoad={handleLoadTemplate}
            onSave={handleSaveTemplate}
          />
        </div>
        <div className="header-actions">
          <button
            aria-label="Undo"
            className="icon-button"
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            type="button"
            onClick={undo}
          >
            <UndoIcon />
          </button>
          <button
            aria-label="Redo"
            className="icon-button"
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            type="button"
            onClick={redo}
          >
            <RedoIcon />
          </button>
          <button className="primary" type="button" onClick={() => exportTemplateToPdf(template)}>
            PDF
          </button>
          <button type="button" onClick={() => printTemplateToPdf(template)}>
            Print
          </button>
          <button
            aria-label="Open settings"
            className="icon-button"
            title="Settings"
            type="button"
            onClick={() => setSettingsOpen(true)}
          >
            <GearIcon />
          </button>
        </div>
      </header>

      {settingsOpen && (
        <SettingsPage
          template={template}
          onClose={() => setSettingsOpen(false)}
          onTemplateChange={updateTemplate}
        />
      )}

      <div className="workspace">
        <aside className="sidebar">
          <Toolbar
            libraryItems={libraryItems}
            selectedObject={selectedObject}
            onAddCounter={addCounterObject}
            onAddEllipse={() => addObject('ellipse')}
            onAddFromLibrary={handleAddFromLibrary}
            onAddLine={() => addObject('line')}
            onAddQr={() => addObject('qr')}
            onAddRect={() => addObject('rect')}
            onAddText={() => addObject('text', { text: 'New text' })}
            onDeleteLibraryItem={handleDeleteLibraryItem}
            onImageUpload={handleImageUpload}
            onSaveToLibrary={handleSaveToLibrary}
          />
          <ObjectListPanel
            objects={template.objects}
            selectedId={selectedId}
            onDeleteObject={deleteObject}
            onMoveLayer={moveObjectLayer}
            onSelect={setSelectedId}
            onToggleLock={toggleObjectLock}
          />
        </aside>

        <section className="stage">
          <LabelCanvas
            selectedId={selectedId}
            template={template}
            onHistoryGestureEnd={endGesture}
            onHistoryGestureStart={beginGesture}
            onObjectChange={updateObject}
            onSelect={setSelectedId}
          />
        </section>

        <aside className="sidebar inspector-sidebar">
          <GridPanel template={template} onTemplateChange={updateTemplate} />
          <MarginsPanel template={template} onTemplateChange={updateTemplate} />
          <PropertyPanel
            object={selectedObject}
            onMakeImageBlack={handleMakeImageBlack}
            onMoveLayer={moveLayer}
            onObjectChange={updateSelectedObject}
            onPrintAutoCounter={handlePrintAutoCounter}
          />
        </aside>
      </div>
    </main>
  );
}

function hasPositionOrSizeChange(patch) {
  return ['x', 'y', 'width', 'height', 'angle'].some((key) => key in patch);
}

function isFormField(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function buildCounterSequence({ startNumber, endNumber, count }) {
  const start = parseInteger(startNumber);
  const end = parseInteger(endNumber);
  const requestedCount = parseInteger(count);

  if (!Number.isFinite(start)) {
    return [];
  }

  const padWidth = Math.max(getIntegerWidth(startNumber), getIntegerWidth(endNumber));
  const values = [];

  if (Number.isFinite(end)) {
    const step = end >= start ? 1 : -1;
    for (let value = start; step > 0 ? value <= end : value >= end; value += step) {
      values.push(formatCounterValue(value, padWidth));
    }
    return values;
  }

  if (!Number.isFinite(requestedCount) || requestedCount < 1) {
    return [];
  }

  for (let index = 0; index < requestedCount; index += 1) {
    values.push(formatCounterValue(start + index, padWidth));
  }

  return values;
}

function parseInteger(value) {
  if (value === '' || value === null || value === undefined) {
    return NaN;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function getIntegerWidth(value) {
  const match = String(value ?? '').match(/\d+/);
  return match ? match[0].length : 0;
}

function formatCounterValue(value, padWidth) {
  const sign = value < 0 ? '-' : '';
  const digits = String(Math.abs(value)).padStart(padWidth, '0');
  return `${sign}${digits}`;
}

function UndoIcon() {
  return (
    <svg aria-hidden="true" className="button-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 1 1 0 11H12" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg aria-hidden="true" className="button-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 1 0 0 11H12" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg aria-hidden="true" className="button-icon" viewBox="0 0 24 24">
      <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
      <path d="M19.4 15a8 8 0 0 0 .1-1.1 8 8 0 0 0-.1-1.1l2-1.5-2-3.5-2.4 1a7.8 7.8 0 0 0-1.9-1.1L14.8 5h-4l-.4 2.7a7.8 7.8 0 0 0-1.9 1.1l-2.4-1-2 3.5 2 1.5A8 8 0 0 0 6 13.9 8 8 0 0 0 6.1 15l-2 1.5 2 3.5 2.4-1a7.8 7.8 0 0 0 1.9 1.1l.4 2.7h4l.4-2.7a7.8 7.8 0 0 0 1.9-1.1l2.4 1 2-3.5-2.1-1.5Z" />
    </svg>
  );
}
