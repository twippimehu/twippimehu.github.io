import { tool as textTransform } from './tools/text-transform.js';
import { tool as textCleaner } from './tools/text-cleaner.js';
import { tool as wordCounter } from './tools/word-counter.js';
import { tool as textStats } from './tools/text-stats.js';
import { tool as randomizer } from './tools/randomizer.js';
import { tool as timer } from './tools/timer.js';
import { tool as stopwatch } from './tools/stopwatch.js';
import { tool as dateCalc } from './tools/date-calc.js';
import { tool as notes } from './tools/notes.js';
import { tool as clipboardManager } from './tools/clipboard-manager.js';

import { tool as jsonFormatter } from './tools/json-formatter.js';
import { tool as jsonValidator } from './tools/json-validator.js';
import { tool as regexTester } from './tools/regex-tester.js';
import { tool as base64 } from './tools/base64.js';
import { tool as hashGenerator } from './tools/hash-generator.js';
import { tool as uuidGenerator } from './tools/uuid-generator.js';
import { tool as numberBase } from './tools/number-base.js';
import { tool as devCalculator } from './tools/dev-calculator.js';
import { tool as csvViewer } from './tools/csv-viewer.js';
import { tool as jwtDecoder } from './tools/jwt-decoder.js';

import { tool as urlToolkit } from './tools/url-toolkit.js';
import { tool as urlCleaner } from './tools/url-cleaner.js';
import { tool as extractor } from './tools/extractor.js';
import { tool as httpStatus } from './tools/http-status.js';
import { tool as userAgent } from './tools/user-agent.js';

import { tool as passwordGenerator } from './tools/password-generator.js';
import { tool as randomData } from './tools/random-data.js';

import { tool as colorToolkit } from './tools/color-toolkit.js';
import { tool as contrastChecker } from './tools/contrast-checker.js';
import { tool as gradientGenerator } from './tools/gradient-generator.js';
import { tool as aspectRatio } from './tools/aspect-ratio.js';

import { tool as imageInspector } from './tools/image-inspector.js';
import { tool as fileHash } from './tools/file-hash.js';
import { tool as fileInspector } from './tools/file-inspector.js';

import { tool as autofill } from './tools/autofill.js';
import { tool as autotype } from './tools/autotype.js';
import { tool as elementFinder } from './tools/element-finder.js';
import { tool as pageInspector } from './tools/page-inspector.js';
import { tool as domPlayground } from './tools/dom-playground.js';

// Adding a new tool is exactly this: write /tools/your-tool.js exporting
// `tool`, then add one import line and one entry below. Nothing else in
// the app needs to change — the launcher, search, categories, favorites,
// recents and taskbar all read from this list.
const ALL = [
  textTransform, textCleaner, wordCounter, textStats, randomizer, timer, stopwatch, dateCalc, notes, clipboardManager,
  jsonFormatter, jsonValidator, regexTester, base64, hashGenerator, uuidGenerator, numberBase, devCalculator, csvViewer, jwtDecoder,
  urlToolkit, urlCleaner, extractor, httpStatus, userAgent,
  passwordGenerator, randomData,
  colorToolkit, contrastChecker, gradientGenerator, aspectRatio,
  imageInspector, fileHash, fileInspector,
  autofill, autotype, elementFinder, pageInspector, domPlayground,
];

export const TOOLS = Object.fromEntries(ALL.map(t => [t.id, t]));

export function getTool(id) {
  return TOOLS[id];
}

export function allTools() {
  return ALL;
}

export function categories() {
  return [...new Set(ALL.map(t => t.category))];
}

export function toolsByCategory(category) {
  return ALL.filter(t => t.category === category);
}

export function searchTools(query) {
  const q = query.trim().toLowerCase();
  if (!q) return ALL;
  return ALL.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q) ||
    (t.keywords || []).some(k => k.includes(q))
  );
}
