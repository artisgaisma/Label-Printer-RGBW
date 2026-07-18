import { useEffect, useMemo, useState } from 'react';
import LabelCanvas from './components/LabelCanvas';
import ObjectListPanel from './components/ObjectListPanel';
import PresetPicker from './components/PresetPicker';
import PropertyPanel from './components/PropertyPanel';
import TemplatePanel from './components/TemplatePanel';
import Toolbar from './components/Toolbar';
import { findPreset, loadPresets, savePreset } from './lib/labelPresets';
import { clampObjectToLabel, createId, createObject, createTemplate } from './lib/labelModel';
import {
  defaultLibraryName,
  deleteLibraryItem,
  loadLibrary,
  saveLibraryItem,
  snapshotFromObject,
} from './lib/objectLibraryStorage';
import { convertImageToBlack } from './lib/imageUtils';
import { exportTemplateToPdf, printTemplateToPdf } from './lib/pdfExport';
import {
  deleteTemplate,
  downloadTemplate,
  loadTemplates,
  readImageFile,
  readTemplateFile,
  saveTemplate,
} from './lib/templateStorage';

export default function App() {
  const [template, setTemplate] = useState(() => createTemplate());
  const [selectedId, setSelectedId] = useState(template.objects[0]?.id || null);
  const [templates, setTemplates] = useState(() => loadTemplates());
  const [presets, setPresets] = useState([]);
  const [savingPreset, setSavingPreset] = useState(false);
  const [copiedObject, setCopiedObject] = useState(null);
  const [libraryItems, setLibraryItems] = useState(() => loadLibrary());
  const selectedObject = useMemo(
    () => template.objects.find((object) => object.id === selectedId),
    [selectedId, template.objects],
  );

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

  function toggleObjectLock(id) {
    setTemplate((current) => ({
      ...current,
      objects: current.objects.map((object) =>
        object.id === id ? { ...object, locked: !object.locked } : object,
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
        if (!cancelled) {
          setPresets(loadedPresets);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
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
  }, [copiedObject, selectedId, selectedObject]);

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
    setTemplates(saveTemplate(template));
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

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Web Server Label Printer</p>
          <h1>Label Printer</h1>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <PresetPicker
            presets={presets}
            savingPreset={savingPreset}
            template={template}
            onCustomSizeChange={handleCustomSizeChange}
            onPresetChange={handlePresetChange}
            onSavePreset={handleSavePreset}
          />
          <Toolbar
            libraryItems={libraryItems}
            selectedObject={selectedObject}
            onAddEllipse={() => addObject('ellipse')}
            onAddFromLibrary={handleAddFromLibrary}
            onAddLine={() => addObject('line')}
            onAddRect={() => addObject('rect')}
            onAddText={() => addObject('text', { text: 'New text' })}
            onDeleteLibraryItem={handleDeleteLibraryItem}
            onImageUpload={handleImageUpload}
            onSaveToLibrary={handleSaveToLibrary}
          />
          <TemplatePanel
            template={template}
            templates={templates}
            onDelete={handleDeleteTemplate}
            onDownloadJson={() => downloadTemplate(template)}
            onExportPdf={() => exportTemplateToPdf(template)}
            onPrint={() => printTemplateToPdf(template)}
            onImportJson={handleImportTemplate}
            onLoad={handleLoadTemplate}
            onSave={handleSaveTemplate}
            onTemplateChange={updateTemplate}
          />
        </aside>

        <section className="stage">
          <LabelCanvas
            selectedId={selectedId}
            template={template}
            onObjectChange={updateObject}
            onSelect={setSelectedId}
          />
        </section>

        <aside className="sidebar">
          <ObjectListPanel
            objects={template.objects}
            selectedId={selectedId}
            onDeleteObject={deleteObject}
            onMoveLayer={moveObjectLayer}
            onSelect={setSelectedId}
            onToggleLock={toggleObjectLock}
          />
          <PropertyPanel
            object={selectedObject}
            template={template}
            onMakeImageBlack={handleMakeImageBlack}
            onMoveLayer={moveLayer}
            onObjectChange={updateSelectedObject}
            onTemplateChange={updateTemplate}
          />
        </aside>
      </div>
    </main>
  );
}

function hasPositionOrSizeChange(patch) {
  return ['x', 'y', 'width', 'height'].some((key) => key in patch);
}

function isFormField(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}
