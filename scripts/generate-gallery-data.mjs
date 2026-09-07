#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { deriveTemplateData } from './gallery-metadata.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_PATH = join(ROOT, 'src', 'generated', 'templates.json');
const PREVIEW_OUTPUT = join(ROOT, 'public', 'generated', 'previews');
const previewPreferences = [
  'landing-page',
  'app-shell',
  'portal-live',
  'dashboard',
  'home',
  'overview',
];

function allFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? allFiles(fullPath) : [fullPath];
  });
}

function findPreview(templateDirectory) {
  const candidates = allFiles(join(templateDirectory, 'docs', 'screenshots'))
    .filter((file) => ['.png', '.webp', '.jpg', '.jpeg'].includes(extname(file).toLowerCase()))
    .sort((left, right) => {
      const leftName = basename(left).toLowerCase();
      const rightName = basename(right).toLowerCase();
      const leftRank = previewPreferences.findIndex((name) => leftName.includes(name));
      const rightRank = previewPreferences.findIndex((name) => rightName.includes(name));
      const normalizedLeft = leftRank === -1 ? previewPreferences.length : leftRank;
      const normalizedRight = rightRank === -1 ? previewPreferences.length : rightRank;
      return normalizedLeft - normalizedRight || left.localeCompare(right);
    });

  return candidates[0] ?? null;
}

export function generateGalleryData(root = ROOT) {
  const rootManifestPath = join(root, 'rayfin-template.yml');
  const rootManifest = parse(readFileSync(rootManifestPath, 'utf8'));
  const entries = rootManifest.entries;

  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('rayfin-template.yml must contain at least one template entry');
  }

  const outputPath = join(root, relative(ROOT, OUTPUT_PATH));
  const previewOutput = join(root, relative(ROOT, PREVIEW_OUTPUT));
  rmSync(previewOutput, { recursive: true, force: true });
  mkdirSync(previewOutput, { recursive: true });

  const templates = entries.map((entry) => {
    const entryPath = entry.path.split('/').join(sep);
    const templateDirectory = resolve(root, entryPath);
    const templatesRoot = resolve(root, 'templates');
    if (!templateDirectory.startsWith(`${templatesRoot}${sep}`)) {
      throw new Error(`Template path must be inside templates/: ${entry.path}`);
    }

    const directoryName = basename(templateDirectory);
    const pkg = JSON.parse(readFileSync(join(templateDirectory, 'package.json'), 'utf8'));
    const manifest = JSON.parse(readFileSync(join(templateDirectory, 'manifest.json'), 'utf8'));
    const previewSource = findPreview(templateDirectory);
    let previewImage = null;

    if (previewSource) {
      const previewName = `${directoryName}${extname(previewSource).toLowerCase()}`;
      copyFileSync(previewSource, join(previewOutput, previewName));
      previewImage = `generated/previews/${previewName}`;
    }

    return deriveTemplateData({
      directoryName,
      entry,
      pkg,
      manifest,
      hasFabricAssets:
        existsSync(join(templateDirectory, 'fabric')) &&
        statSync(join(templateDirectory, 'fabric')).isDirectory(),
      previewImage,
    });
  });

  mkdirSync(resolve(outputPath, '..'), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`);
  return templates;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const templates = generateGalleryData();
  console.log(`Generated gallery metadata for ${templates.length} templates.`);
}
