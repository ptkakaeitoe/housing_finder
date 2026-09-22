import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
if (!apiKey) {
  console.error('Set GOOGLE_TRANSLATE_API_KEY in .env.local, then run: npm run translate:dictionaries');
  process.exit(1);
}

// Google Cloud Translation API v2 language codes for our locales.
const TARGETS = { th: 'th', my: 'my', zh: 'zh-CN' };
const dictDir = fileURLToPath(new URL('../src/lib/i18n/dictionaries/', import.meta.url));

async function readJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return {}; }
}

// Collect every leaf string (or {one, other} pair) in en.json as a flat list of [path, text] entries.
function collectLeaves(node, path = []) {
  const leaves = [];
  for (const [key, value] of Object.entries(node)) {
    const next = [...path, key];
    if (typeof value === 'string') leaves.push([next, value]);
    else if (value && typeof value === 'object' && ('one' in value || 'other' in value)) {
      if (value.one) leaves.push([[...next, 'one'], value.one]);
      if (value.other) leaves.push([[...next, 'other'], value.other]);
    } else if (value && typeof value === 'object') leaves.push(...collectLeaves(value, next));
  }
  return leaves;
}

function getAt(node, path) {
  return path.reduce((n, k) => (n && typeof n === 'object' ? n[k] : undefined), node);
}

function setAt(node, path, value) {
  let cursor = node;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (typeof cursor[key] !== 'object' || cursor[key] === null) cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[path[path.length - 1]] = value;
}

// {{var}} placeholders must survive translation untouched, so swap them for
// numbered tokens Google Translate won't try to translate, then swap back.
function protectPlaceholders(text) {
  const vars = [];
  const protectedText = text.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    vars.push(name);
    return `[[${vars.length - 1}]]`;
  });
  return { protectedText, vars };
}
function restorePlaceholders(text, vars) {
  return text.replace(/\[\[(\d+)\]\]/g, (_, index) => `{{${vars[Number(index)]}}}`);
}

async function translateBatch(texts, target) {
  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts, target, format: 'text' }),
  });
  if (!response.ok) throw new Error(`Translate API error (${response.status}): ${await response.text()}`);
  const data = await response.json();
  return data.data.translations.map((t) => t.translatedText);
}

async function main() {
  const en = await readJson(`${dictDir}en.json`);
  const leaves = collectLeaves(en);
  console.log(`Found ${leaves.length} translatable strings in en.json.`);

  for (const [locale, target] of Object.entries(TARGETS)) {
    const existing = await readJson(`${dictDir}${locale}.json`);
    const missing = leaves.filter(([path]) => getAt(existing, path) === undefined);
    if (!missing.length) { console.log(`${locale}.json already has every key, skipping.`); continue; }
    console.log(`Translating ${missing.length} missing strings into ${locale}...`);

    const BATCH_SIZE = 100;
    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);
      const protectedInputs = batch.map(([, text]) => protectPlaceholders(text));
      const translated = await translateBatch(protectedInputs.map((p) => p.protectedText), target);
      translated.forEach((text, index) => {
        const restored = restorePlaceholders(text, protectedInputs[index].vars);
        setAt(existing, batch[index][0], restored);
      });
      console.log(`  ${Math.min(i + BATCH_SIZE, missing.length)}/${missing.length}`);
    }
    await writeFile(`${dictDir}${locale}.json`, `${JSON.stringify(existing, null, 2)}\n`);
    console.log(`Wrote ${dictDir}${locale}.json`);
  }
}

main().catch((error) => { console.error(error.message); process.exit(1); });
