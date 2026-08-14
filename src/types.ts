export type FieldTextCounterField = HTMLInputElement | HTMLTextAreaElement;
export type FieldTextCounterAppendMethod = 'insertAfter' | 'insertBefore';
export type FieldTextCounterVisibility = 'always' | 'focus' | boolean;
export type FieldTextCounterCountMode = 'codeUnits' | 'graphemes';

export interface FieldTextCounterOptions {
  maxChars?: number;
  maxPercentageWarning?: number;
  msgAppendMethod?: FieldTextCounterAppendMethod;
  format?: string;
  visibility?: FieldTextCounterVisibility;
  countMode?: FieldTextCounterCountMode;
}
