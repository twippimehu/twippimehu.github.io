#!/usr/bin/env node
// Fills in public/data/photos.json from the files in public/photos/.
//
//   npm run photos
//
// It never touches your photographs — it only reads their headers to learn
// the pixel dimensions, and writes those into the manifest. Anything you have
// written yourself (title, category, date, location, featured) is kept.
//
// Uses nothing outside Node's standard library: no install step, no image
// processing, no re-encoding, so image quality is untouched by design.

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PHOTOS_DIR = join(ROOT, 'public', 'photos');
const MANIFEST = join(ROOT, 'public', 'data', 'photos.json');
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length - 1) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buf.readUInt16BE(i + 2);
    const isFrameHeader =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isFrameHeader) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  return null;
}

function pngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function webpSize(buf) {
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') {
    return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  }
  if (kind === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (kind === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

async function dimensions(path, ext) {
  const buf = await readFile(path);
  if (ext === '.png') return pngSize(buf);
  if (ext === '.webp') return webpSize(buf);
  return jpegSize(buf);
}

async function main() {
  await mkdir(PHOTOS_DIR, { recursive: true });
  await mkdir(dirname(MANIFEST), { recursive: true });

  let existing = [];
  try {
    const raw = await readFile(MANIFEST, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) existing = parsed;
  } catch {
    // No manifest yet, or it is unreadable — start from an empty list.
  }

  const byFile = new Map(existing.filter((e) => e && e.file).map((e) => [e.file, e]));
  const files = (await readdir(PHOTOS_DIR))
    .filter((name) => EXTENSIONS.has(extname(name).toLowerCase()))
    .sort();

  const next = [];
  const problems = [];

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    let size = null;
    try {
      size = await dimensions(join(PHOTOS_DIR, file), ext);
    } catch (error) {
      problems.push(`${file}: could not read (${error.message})`);
    }
    const previous = byFile.get(file) || {};
    next.push({
      file,
      ...(previous.id ? { id: previous.id } : {}),
      ...(previous.title ? { title: previous.title } : {}),
      ...(previous.category ? { category: previous.category } : {}),
      ...(previous.date ? { date: previous.date } : {}),
      ...(previous.location ? { location: previous.location } : {}),
      ...(previous.description ? { description: previous.description } : {}),
      ...(previous.featured === true ? { featured: true } : {}),
      ...(size ? { width: size.width, height: size.height } : {}),
    });
    byFile.delete(file);
  }

  for (const orphan of byFile.keys()) {
    problems.push(`${orphan}: listed in photos.json but not found in public/photos/`);
  }

  await writeFile(MANIFEST, JSON.stringify(next, null, 2) + '\n', 'utf8');

  console.log(`${next.length} photograph${next.length === 1 ? '' : 's'} in public/data/photos.json`);
  for (const photo of next) {
    const size = photo.width ? `${photo.width}×${photo.height}` : 'unknown size';
    console.log(`  ${photo.file}  ${size}  ${photo.title || '(no title)'}`);
  }
  if (problems.length) {
    console.log('\nNeeds attention:');
    for (const line of problems) console.log(`  ${line}`);
  }
  console.log('\nNext: add a title and category to any photo that needs them, then reload the site.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
