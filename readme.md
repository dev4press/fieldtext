# FieldText

FieldText is a modular TypeScript library for working with input fields. The first module, `FieldTextCounter`, displays live character counts for text inputs and textareas, supports percentage warnings, and can count either UTF-16 code units or grapheme clusters.

## Installation

```sh
npm install field-text
```

## Documentation

See the complete [FieldTextCounter documentation](documentation/counter.md) for usage, options, data attributes, Unicode counting modes, styling, and lifecycle methods.

## Development

```sh
npm install
npm test
npm run build
```

The package publishes `dist/fieldtext.js` as an ES module, `dist/fieldtext.umd.cjs` as a browser-compatible UMD bundle, and `dist/fieldtext.css` as the generated stylesheet.