import express from 'express';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const distPath = path.join(__dirname, '..', 'dist');
const presetsPath = path.join(__dirname, '..', 'data', 'label-presets.json');

app.use(express.json());

app.get('/api/presets', async (_req, res, next) => {
  try {
    res.json(await readPresets());
  } catch (error) {
    next(error);
  }
});

app.post('/api/presets', async (req, res, next) => {
  try {
    const presets = await readPresets();
    const preset = normalizePreset(req.body);
    const nextPresets = [
      preset,
      ...presets.filter((item) => item.id !== preset.id && item.name !== preset.name),
    ];

    await writePresets(nextPresets);
    res.status(201).json(nextPresets);
  } catch (error) {
    next(error);
  }
});

app.use(express.static(distPath));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Label Printer is running at http://localhost:${port}`);
});

async function readPresets() {
  try {
    const data = await fs.readFile(presetsPath, 'utf8');
    const presets = JSON.parse(data);
    return Array.isArray(presets) ? presets.map(normalizePreset) : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writePresets([]);
      return [];
    }

    throw error;
  }
}

async function writePresets(presets) {
  await fs.mkdir(path.dirname(presetsPath), { recursive: true });
  await fs.writeFile(`${presetsPath}.tmp`, JSON.stringify(presets, null, 2), 'utf8');
  await fs.rename(`${presetsPath}.tmp`, presetsPath);
}

function normalizePreset(value) {
  const name = String(value?.name || '').trim();
  const widthMm = Number(value?.widthMm);
  const heightMm = Number(value?.heightMm);

  if (!name || !Number.isFinite(widthMm) || !Number.isFinite(heightMm) || widthMm < 5 || heightMm < 5) {
    throw new Error('Preset name, width, and height are required.');
  }

  return {
    id: String(value?.id || createPresetId(name)),
    name,
    widthMm,
    heightMm,
  };
}

function createPresetId(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'preset';
  return `${slug}-${Date.now().toString(36)}`;
}
