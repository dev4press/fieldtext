import { defineConfig } from 'vitest/config';
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(projectRoot, 'src/index.ts'),
      name: 'FieldText',
      fileName: (format) =>
          format === 'umd' ? 'field-text.umd.js' : 'field-text.js',
      formats: ['es', 'umd'],
    },
  }
});
