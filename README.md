# eds-blocks-skills

CLI scaffolder for [AEM Edge Delivery Services](https://www.aem.live/) blocks.  
Run it in any EDS project to generate the three required block files interactively.

## Install / run (no install needed)

```bash
npx eds-blocks-skills create
```

Or install globally:

```bash
npm install -g eds-blocks-skills
eds-blocks create
```

## What it generates

Running `create` inside an EDS project root will produce:

```
blocks/
└── <block-name>/
    ├── _<block-name>.json   ← block definition + model + filters
    ├── <block-name>.js      ← decorate(block) export
    └── <block-name>.css     ← BEM-scoped, mobile-first styles
```

## Interactive prompts

| Prompt | Example input |
|--------|---------------|
| Block name | `hero-banner` |
| Fields (repeating) | `image:reference:Image` |
| | `title:text:Title` |
| | `description:richtext:Description` |
| | `cta:aem-content:CTA Link` |
| Variants (repeating) | `dark:Dark background` |

### Field types

`text` · `richtext` · `reference` · `aem-content` · `select` · `multiselect`

## Rules followed

- Standard `decorate(block)` export pattern
- Field values read from block DOM cells, not JS config
- BEM-like class names scoped to `.block-name`
- No external libraries
- Mobile-first responsive CSS
- `alt` fields are applied to the `img` element as the `alt` attribute
