#!/usr/bin/env node
// Fills in public/data/photos.json from the files in public/photos/.
//
//   npm run photos
//
// It never touches your photographs — it only reads their headers to learn
// the pixel dimensions and the camera details, and writes those into the
// manifest. Anything you have written yourself (title, category, date,
// location, featured) is kept.
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

const TAG = {
  make: 0x010f,
  model: 0x0110,
  orientation: 0x0112,
  exifIfd: 0x8769,
  dateTaken: 0x9003,
  focalLength: 0x920a,
};

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

// Reads one TIFF/EXIF block. `start` is where the "II"/"MM" byte order mark
// begins; every offset inside the block is relative to that point.
function readTiff(buf, start) {
  const little = buf.toString('ascii', start, start + 2) === 'II';
  const u16 = (at) => (little ? buf.readUInt16LE(at) : buf.readUInt16BE(at));
  const u32 = (at) => (little ? buf.readUInt32LE(at) : buf.readUInt32BE(at));
  if (start + 8 > buf.length || u16(start + 2) !== 42) return null;

  const tags = {};
  const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  // `followExif` is only true for the first block: the sub-IFD pointer must not
  // be chased twice, or it recurses into itself forever.
  const readIfd = (offset, followExif) => {
    const ifd = start + offset;
    if (!offset || ifd + 2 > buf.length) return;
    const count = u16(ifd);
    for (let n = 0; n < count; n += 1) {
      const entry = ifd + 2 + n * 12;
      if (entry + 12 > buf.length) return;
      const tag = u16(entry);
      const type = u16(entry + 2);
      const num = u32(entry + 4);
      const size = (TYPE_SIZE[type] || 1) * num;
      const at = size > 4 ? start + u32(entry + 8) : entry + 8;
      if (at + size > buf.length) continue;

      if (type === 2) {
        tags[tag] = buf.toString('ascii', at, at + size).replace(/\0+$/, '').trim();
      } else if (type === 3 && num === 1) {
        tags[tag] = u16(at);
      } else if (type === 4 && num === 1) {
        tags[tag] = u32(at);
      } else if (type === 5 && num >= 1) {
        const numerator = u32(at);
        const denominator = u32(at + 4);
        tags[tag] = denominator ? numerator / denominator : 0;
      }
    }
    if (followExif && tags[TAG.exifIfd]) readIfd(tags[TAG.exifIfd], false);
  };

  readIfd(u32(start + 4), true);
  return tags;
}

function jpegExif(buf) {
  let i = 2;
  while (i < buf.length - 3) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buf.readUInt16BE(i + 2);
    if (marker === 0xe1 && buf.toString('ascii', i + 4, i + 10) === 'Exif\0\0') {
      return readTiff(buf, i + 10);
    }
    i += 2 + length;
  }
  return null;
}

// "SONY" + "ILCE-7M3" is how the camera writes it, which shouts. This turns it
// into "Sony ILCE-7M3" and drops the redundant "CORPORATION" suffix.
function cameraLabel(tags) {
  if (!tags) return '';
  const tidy = (value) =>
    String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s+(corporation|corp\.?|co\.?,?\s*ltd\.?|inc\.?)$/i, '');

  const make = tidy(tags[TAG.make]);
  const model = tidy(tags[TAG.model]);
  const titleCase = (value) => value.replace(/\S+/g, (word) =>
    word.length > 3 ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase());

  if (!make) return model;
  const pretty = titleCase(make);
  if (!model) return pretty;
  if (model.toLowerCase().startsWith(make.toLowerCase())) return model;
  return `${pretty} ${model}`;
}

function exifExtras(tags) {
  const out = {};
  if (!tags) return out;

  const camera = cameraLabel(tags);
  if (camera) out.camera = camera;

  const focal = tags[TAG.focalLength];
  if (focal && Number.isFinite(focal)) out.focal = Math.round(focal);

  // "2025:08:14 19:32:07" → 2025
  const taken = String(tags[TAG.dateTaken] || '');
  const year = taken.slice(0, 4);
  if (/^\d{4}$/.test(year) && Number(year) > 1900) out.year = Number(year);

  return out;
}

// Orientation 5–8 means the browser rotates the picture a quarter turn, so the
// displayed shape is the opposite of the stored one. Reading the tag lets the
// manifest describe what people actually see, without re-encoding the file.
function orientationOf(tags) {
  const value = tags ? tags[TAG.orientation] : 1;
  return Number(value) >= 5 && Number(value) <= 8 ? value : 1;
}

async function inspect(path, ext) {
  const buf = await readFile(path);
  let size = null;
  if (ext === '.png') size = pngSize(buf);
  else if (ext === '.webp') size = webpSize(buf);
  else size = jpegSize(buf);
  if (!size) return null;

  const tags = ext === '.jpg' || ext === '.jpeg' ? jpegExif(buf) : null;
  const rotated = orientationOf(tags) !== 1;
  return {
    width: rotated ? size.height : size.width,
    height: rotated ? size.width : size.height,
    ...exifExtras(tags),
  };
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
    let info = null;
    try {
      info = await inspect(join(PHOTOS_DIR, file), ext);
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
      ...(info?.width ? { width: info.width, height: info.height } : {}),
      ...(info?.camera ? { camera: info.camera } : {}),
      ...(info?.focal ? { focal: info.focal } : {}),
      ...(info?.year ? { year: info.year } : {}),
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
    console.log(`  ${photo.file}  ${size}  ${photo.camera || '(no camera)'}  ${photo.title || '(no title)'}`);
  }
  if (problems.length) {
    console.log('\nNeeds attention:');
    for (const line of problems) console.log(`  ${line}`);
  }
  console.log('\nNext: add a title, category or location to any photo that needs them, then reload the site.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
