import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const presetsPath = path.join(__dirname, 'data', 'label-presets.json');

export default defineConfig({
  base: './',
  plugins: [projectPresetApi(), react()],
  server: {
    port: 5173,
  },
});

function projectPresetApi() {
  return {
    name: 'project-preset-api',
    configureServer(server) {
      server.middlewares.use('/api/presets', async (req, res, next) => {
        try {
          if (req.method === 'GET') {
            sendJson(res, await readPresets());
            return;
          }

          if (req.method === 'POST') {
            const presets = await readPresets();
            const preset = normalizePreset(await readJsonBody(req));
            const nextPresets = [
              preset,
              ...presets.filter((item) => item.id !== preset.id && item.name !== preset.name),
            ];

            await writePresets(nextPresets);
            sendJson(res, nextPresets, 201);
            return;
          }

          res.statusCode = 405;
          res.end();
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, value, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(value));
}
