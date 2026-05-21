'use strict';

function toTitleCase(str) {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── JSON ─────────────────────────────────────────────────────────────────────

function generateJson(blockName, fields, variants) {
  const title = toTitleCase(blockName);

  const modelFields = fields.map(f => {
    const field = {
      component: f.type,
      name: f.name,
      label: f.label,
      valueType: f.type === 'multiselect' ? 'string[]' : 'string',
    };
    if (f.type === 'reference') field.multi = false;
    return field;
  });

  if (variants.length > 0) {
    modelFields.push({
      component: 'select',
      name: 'classes',
      label: 'Variant',
      valueType: 'string',
      options: variants.map(v => ({ name: toTitleCase(v.name), value: v.name })),
    });
  }

  const doc = {
    definition: [
      {
        title,
        id: blockName,
        plugins: {
          xwalk: {
            page: {
              resourceType: 'core/franklin/components/block/v1/block',
              template: { name: title, model: blockName },
            },
          },
        },
      },
    ],
    models: [{ id: blockName, fields: modelFields }],
    filters: [{ id: blockName, components: [blockName] }],
  };

  return JSON.stringify(doc, null, 2) + '\n';
}

// ─── JS ───────────────────────────────────────────────────────────────────────

function generateJs(blockName, fields) {
  const altField  = fields.find(f => f.name === 'alt' || f.name.endsWith('-alt'));
  const imageField = fields.find(f => f.type === 'reference');

  // Extract values from block DOM rows
  const extractLines = fields.map((f, i) => {
    const cell = `block.children[${i}]?.lastElementChild`;
    switch (f.type) {
      case 'reference':
        return `  const ${f.name}El = ${cell}?.querySelector('picture, img');`;
      case 'richtext':
        return `  const ${f.name}El = ${cell};`;
      case 'aem-content':
        return `  const ${f.name}El = ${cell}?.querySelector('a');`;
      default:
        return `  const ${f.name}Val = ${cell}?.textContent?.trim();`;
    }
  }).join('\n');

  // Build DOM elements and append to wrapper
  const buildLines = fields.map(f => {
    const isText = ['text', 'select', 'multiselect'].includes(f.type);
    const varName = isText ? `${f.name}Val` : `${f.name}El`;
    const headingNames = ['title', 'heading', 'name'];
    const tag = headingNames.includes(f.name) ? 'h2' : 'p';

    if (f.type === 'reference') {
      return `  if (${varName}) {
    const ${f.name}Wrap = document.createElement('div');
    ${f.name}Wrap.className = '${blockName}__${f.name}';
    ${f.name}Wrap.append(${varName});
    wrapper.append(${f.name}Wrap);
  }`;
    }

    if (f.type === 'richtext') {
      return `  if (${varName}) {
    const ${f.name}Div = document.createElement('div');
    ${f.name}Div.className = '${blockName}__${f.name}';
    ${f.name}Div.innerHTML = ${varName}.innerHTML;
    wrapper.append(${f.name}Div);
  }`;
    }

    if (f.type === 'aem-content') {
      return `  if (${varName}) {
    ${varName}.className = '${blockName}__${f.name}';
    wrapper.append(${varName});
  }`;
    }

    // text / select / multiselect
    return `  if (${varName}) {
    const ${f.name}El = document.createElement('${tag}');
    ${f.name}El.className = '${blockName}__${f.name}';
    ${f.name}El.textContent = ${varName};
    wrapper.append(${f.name}El);
  }`;
  }).join('\n\n');

  const altLine = (altField && imageField)
    ? `\n  const img = wrapper.querySelector('img');\n  if (img && ${altField.name}Val) img.setAttribute('alt', ${altField.name}Val);\n`
    : '';

  return `export default function decorate(block) {
  const wrapper = document.createElement('div');
  wrapper.className = '${blockName}__wrapper';

${extractLines}${altLine}
${buildLines}

  block.textContent = '';
  block.append(wrapper);
}
`;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

function generateCss(blockName, fields, variants) {
  const fieldStyles = fields.map(f => {
    if (f.type === 'reference') {
      return `.${blockName}__${f.name} {
  overflow: hidden;
}

.${blockName}__${f.name} img {
  width: 100%;
  height: auto;
  display: block;
}`;
    }
    return `.${blockName}__${f.name} {
}`;
  }).join('\n\n');

  const variantStyles = variants.length > 0
    ? '\n\n' + variants.map(v => {
      const comment = v.description ? ` — ${v.description}` : '';
      return `/* variant: ${v.name}${comment} */\n.${blockName}.${v.name} {\n}`;
    }).join('\n\n')
    : '';

  return `/* ${toTitleCase(blockName)} Block */

.${blockName} {
  box-sizing: border-box;
  padding: 1rem;
}

.${blockName}__wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

${fieldStyles}${variantStyles}

/* tablet */
@media (min-width: 768px) {
  .${blockName} {
    padding: 2rem;
  }
}

/* desktop */
@media (min-width: 1024px) {
  .${blockName} {
    padding: 3rem;
  }
}
`;
}

module.exports = { generateJson, generateJs, generateCss };
