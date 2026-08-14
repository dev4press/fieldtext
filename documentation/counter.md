# FieldTextCounter

`FieldTextCounter` displays the current length of a text `input` or `textarea` and keeps the configured maximum visible to the user.

## Installation

```sh
npm install field-text
```

Import the module and its generated stylesheet:

```ts
import { FieldTextCounter } from 'field-text';
import 'field-text/fieldtext.css';
```

### jQuery projects without imports

When the library is loaded as a browser bundle in a jQuery project, include the generated stylesheet and UMD bundle with regular `script` and `link` tags. The UMD bundle exposes the library through `window.FieldText`, so no `import` from `field-text` is required.

```html
<link rel="stylesheet" href="/path/to/field-text.css">
<script src="/path/to/field-text.umd.js"></script>
```

Mark the fields that should have a counter with `data-field-text-counter`, then initialize them when jQuery reports that the DOM is ready:

```html
<textarea
  id="message"
  data-field-text-counter
  data-field-text-counter-max-chars="140"
></textarea>

<script>
  jQuery(function () {
    window.FieldText.FieldTextCounter.autoLoad({
      maxPercentageWarning: 85,
      format: '{current} / {max} characters',
    });
  });
</script>
```

`autoLoad()` uses the same data attributes and options as the module-based example. For a single field selected with jQuery, pass the underlying DOM element to the constructor:

```js
jQuery(function ($) {
  const field = $('#message')[0];

  if (field instanceof HTMLTextAreaElement) {
    const counter = new window.FieldText.FieldTextCounter(field, {
      maxChars: 140,
    });

    counter.update();
  }
});
```

## Basic usage

Create a counter for a field by passing the field to the constructor and calling `update()` for the initial value. The counter then updates automatically on input, focus, paste, and blur events.

```ts
const field = document.querySelector('#message');

if (field instanceof HTMLTextAreaElement) {
  const counter = new FieldTextCounter(field, {
    maxChars: 140,
    maxPercentageWarning: 85,
    format: '{current} / {max} characters',
  });

  counter.update();
}
```

The constructor inserts the counter after the field by default. Use `msgAppendMethod: 'insertBefore'` to insert it before the field.

## Options

Every option can be passed to the constructor or supplied as a `data-*` attribute on the field. A valid data attribute always takes priority over the corresponding constructor option.

| Option | Data attribute | Default | Description | Constructor example | `data-*` example |
| --- | --- | --- | --- | --- | --- |
| `maxChars` | `data-field-text-counter-max-chars` | `100` | Maximum number of units allowed. If omitted, the field's `maxlength` is used when present; otherwise the default is used. | `maxChars: 140` | `data-field-text-counter-max-chars="140"` |
| `maxPercentageWarning` | `data-field-text-counter-max-percentage-warning` | `80` | Percentage of the maximum at which the warning class is applied. | `maxPercentageWarning: 85` | `data-field-text-counter-max-percentage-warning="85"` |
| `msgAppendMethod` | `data-field-text-counter-msg-append-method` | `insertAfter` | Counter placement: `insertAfter` or `insertBefore`. | `msgAppendMethod: 'insertBefore'` | `data-field-text-counter-msg-append-method="insertBefore"` |
| `format` | `data-field-text-counter-format` | `'{current} / {max} characters'` | Message template using `{current}`, `{max}`, `{remaining}`, and `{percentage}` tags. | `format: '{current}/{max}'` | `data-field-text-counter-format="{current}/{max}"` |
| `visibility` | `data-field-text-counter-visibility` | `focus` | `focus` shows the counter while the field is focused; `always` keeps it visible. Boolean values are also accepted. | `visibility: 'always'` | `data-field-text-counter-visibility="always"` |
| `countMode` | `data-field-text-counter-count-mode` | `codeUnits` | Counting strategy: `codeUnits` follows native browser `maxlength` behavior; `graphemes` counts user-perceived characters. | `countMode: 'graphemes'` | `data-field-text-counter-count-mode="graphemes"` |

### `format` tags

- `{current}` — current count.
- `{max}` — configured maximum.
- `{remaining}` — maximum minus current count.
- `{percentage}` — current percentage rounded to a whole number.

Unknown braces and other text are left unchanged.

### Unicode counting

The default `codeUnits` mode counts JavaScript UTF-16 code units, matching native browser `maxlength` behavior. For example, `😀` counts as two units.

Use `countMode: 'graphemes'` when the limit should represent user-perceived characters instead:

```ts
new FieldTextCounter(field, {
  maxChars: 20,
  countMode: 'graphemes',
  format: '{remaining} characters remaining',
});
```

Grapheme mode uses `Intl.Segmenter` when available and truncates only at grapheme boundaries. In older browsers without `Intl.Segmenter`, the fallback keeps Unicode code points intact but may not combine every complex grapheme sequence. Native `maxlength` is still measured in UTF-16 units, so use an explicit `maxChars` and avoid relying on native `maxlength` when a grapheme-based limit must be exact.

## Data attributes and automatic loading

Mark any `textarea` or text `input` with `data-field-text-counter`, then call `FieldTextCounter.autoLoad()`:

```html
<textarea
  id="message"
  data-field-text-counter
  data-field-text-counter-max-chars="140"
  data-field-text-counter-max-percentage-warning="85"
  data-field-text-counter-count-mode="graphemes"
  data-field-text-counter-format="{current} / {max} characters"
></textarea>

<input
  type="text"
  data-field-text-counter
  data-field-text-counter-visibility="always"
  data-field-text-counter-msg-append-method="insertBefore"
/>
```

```ts
FieldTextCounter.autoLoad({
  maxPercentageWarning: 75,
  format: '{current}/{max}',
});
```

The options passed to `autoLoad()` are used for every marked field, while valid field-level data attributes override them. A field with `maxlength` automatically uses that value when `maxChars` is not configured.

For boolean visibility values, use `data-field-text-counter-visibility="true"` or `"false"`. The named values `focus` and `always` are recommended for clarity.

## Styling

The generated stylesheet defines the prefixed classes below:

| Class or variable | Purpose |
| --- | --- |
| `.field-text-counter` | Base counter styling, including font size and text alignment. |
| `.field-text-counter--visible` | Makes a focus-visible counter visible. |
| `.field-text-counter--warning` | Applies the warning state. |
| `--field-text-counter-warning-color` | CSS variable used for the warning color. |

Override the CSS variable in your application without changing the component options:

```scss
:root {
  --field-text-counter-warning-color: #c62828;
}
```

## Lifecycle

`FieldTextCounter` exposes these public members:

- `element` — the generated counter element, or `null` when `maxChars` is not positive.
- `getCount()` — returns the current count using the configured `countMode`.
- `update()` — synchronizes the message, warning state, and field value.
- `destroy()` — removes listeners and the generated counter element.
- `FieldTextCounter.autoLoad(options)` — creates counters for all marked text fields and returns them as an array.
