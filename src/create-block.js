'use strict';

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { generateJson, generateJs, generateCss } = require('./templates.js');

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

function toKebab(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const VALID_TYPES = ['text', 'richtext', 'reference', 'aem-content', 'select', 'multiselect'];

async function run() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n  AEM Edge Delivery Services — Block Generator\n');

  // ── Block name ──────────────────────────────────────────────────────────────
  let blockName = '';
  while (!blockName) {
    const raw = await ask(rl, '  Block name (kebab-case, e.g. hero-banner): ');
    blockName = toKebab(raw);
    if (!blockName) console.log('  Block name is required.\n');
  }

  // ── Fields ──────────────────────────────────────────────────────────────────
  console.log(`
  Fields — format: name:type:Label
  Types : ${VALID_TYPES.join(' | ')}
  Press Enter on an empty line when done.
`);

  const fields = [];
  while (true) {
    const line = await ask(rl, `  Field ${fields.length + 1} (or Enter to finish): `);
    if (!line) {
      if (fields.length === 0) {
        console.log('  At least one field is required.\n');
        continue;
      }
      break;
    }

    const parts = line.split(':');
    const name  = toKebab(parts[0] || '');
    const type  = (parts[1] || '').trim().toLowerCase();
    const label = (parts[2] || name).trim();

    if (!name) { console.log('  Field name is required.\n'); continue; }
    if (!VALID_TYPES.includes(type)) {
      console.log(`  Unknown type "${type}". Valid types: ${VALID_TYPES.join(', ')}\n`);
      continue;
    }

    fields.push({ name, type, label: label || name });
  }

  // ── Variants ────────────────────────────────────────────────────────────────
  console.log(`
  Variants — format: name:description  (optional)
  Press Enter on an empty line when done.
`);

  const variants = [];
  while (true) {
    const line = await ask(rl, `  Variant ${variants.length + 1} (or Enter to skip): `);
    if (!line) break;
    const colon = line.indexOf(':');
    variants.push({
      name: toKebab(colon > -1 ? line.slice(0, colon) : line),
      description: colon > -1 ? line.slice(colon + 1).trim() : '',
    });
  }

  rl.close();

  // ── Write files ─────────────────────────────────────────────────────────────
  const blockDir = path.join(process.cwd(), 'blocks', blockName);
  fs.mkdirSync(blockDir, { recursive: true });

  const files = [
    { name: `_${blockName}.json`, content: generateJson(blockName, fields, variants) },
    { name: `${blockName}.js`,    content: generateJs(blockName, fields, variants) },
    { name: `${blockName}.css`,   content: generateCss(blockName, fields, variants) },
  ];

  console.log('');
  for (const file of files) {
    const dest = path.join(blockDir, file.name);
    fs.writeFileSync(dest, file.content, 'utf8');
    console.log(`  created  blocks/${blockName}/${file.name}`);
  }

  console.log(`\n  Block "${blockName}" is ready.\n`);
}

module.exports = { run };
