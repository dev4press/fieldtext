import './index.scss';
import type {
  FieldTextCounterField,
  FieldTextCounterOptions,
  FieldTextCounterVisibility,
} from '../types';

const dataAttributes = {
  maxChars: 'data-field-text-counter-max-chars',
  maxPercentageWarning: 'data-field-text-counter-max-percentage-warning',
  msgAppendMethod: 'data-field-text-counter-msg-append-method',
  format: 'data-field-text-counter-format',
  visibility: 'data-field-text-counter-visibility',
  countMode: 'data-field-text-counter-count-mode',
} as const;

export const fieldTextCounterDefaults: Required<FieldTextCounterOptions> = {
  maxChars: 100,
  maxPercentageWarning: 80,
  msgAppendMethod: 'insertAfter',
  format: '{current} / {max} characters',
  visibility: 'focus',
  countMode: 'codeUnits',
};

export class FieldTextCounter {
  public element: HTMLDivElement | null = null;

  private readonly field: FieldTextCounterField;
  private readonly options: Required<FieldTextCounterOptions>;
  private readonly handleInput = (): void => this.update();
  private readonly handleFocus = (): void => {
    this.update();
    this.show();
  };
  private readonly handlePaste = (): void => {
    window.setTimeout(() => {
      this.update();
      this.show();
    }, 0);
  };
  private readonly handleBlur = (): void => {
    if (!this.isAlwaysVisible()) {
      this.hide();
    }
  };

  public static autoLoad(
    options: FieldTextCounterOptions = {},
  ): FieldTextCounter[] {
    const fields = document.querySelectorAll<FieldTextCounterField>(
      'textarea[data-field-text-counter], input[data-field-text-counter]',
    );

    return Array.from(fields, (field) => {
      const counter = new FieldTextCounter(field, options);
      counter.update();
      return counter;
    });
  }

  public constructor(
    field: FieldTextCounterField,
    options: FieldTextCounterOptions = {},
  ) {
    this.field = field;
    const configuredOptions = {
      ...options,
      ...this.getDataOptions(),
    };
    const maxChars =
      configuredOptions.maxChars ??
      (field.hasAttribute('maxlength')
        ? field.maxLength
        : fieldTextCounterDefaults.maxChars);
    this.options = {
      ...fieldTextCounterDefaults,
      ...configuredOptions,
      maxChars,
    };

    if (this.options.maxChars <= 0) {
      return;
    }

    this.element = document.createElement('div');
    this.element.className = 'field-text-counter';
    this.element.setAttribute('aria-live', 'polite');

    this.insertElement();
    this.field.addEventListener('input', this.handleInput);
    this.field.addEventListener('focus', this.handleFocus);
    this.field.addEventListener('paste', this.handlePaste);
    this.field.addEventListener('blur', this.handleBlur);
  }

  public getCount(): number {
    return this.getCountForValue(this.field.value);
  }

  public update(): void {
    if (!this.element) {
      return;
    }

    const originalScrollTop = this.field.scrollTop;
    if (this.getCount() > this.options.maxChars) {
      this.field.value = this.truncateValue(this.field.value);
      this.field.scrollTop = originalScrollTop;
    }

    const count = this.getCount();
    const percentage = (count / this.options.maxChars) * 100;
    this.element.classList.toggle(
      'field-text-counter--warning',
      percentage >= this.options.maxPercentageWarning,
    );
    this.element.textContent = this.formatMessage(count);
    this.show();
  }

  public destroy(): void {
    this.field.removeEventListener('input', this.handleInput);
    this.field.removeEventListener('focus', this.handleFocus);
    this.field.removeEventListener('paste', this.handlePaste);
    this.field.removeEventListener('blur', this.handleBlur);
    this.element?.remove();
    this.element = null;
  }

  private formatMessage(count: number): string {
    const numbers = {
      current: String(count),
      max: String(this.options.maxChars),
      remaining: String(this.options.maxChars - count),
      percentage: String(Math.round((count / this.options.maxChars) * 100)),
    };
    return this.options.format.replace(
      /\{(current|max|remaining|percentage)}/g,
      (_, token: keyof typeof numbers) => numbers[token],
    );
  }

  private getCountForValue(value: string): number {
    return this.options.countMode === 'graphemes'
      ? this.getGraphemes(value).length
      : value.length;
  }

  private truncateValue(value: string): string {
    if (this.options.countMode === 'graphemes') {
      return this.getGraphemes(value).slice(0, this.options.maxChars).join('');
    }

    let result = '';
    let length = 0;

    for (const character of value) {
      if (length + character.length > this.options.maxChars) {
        break;
      }

      result += character;
      length += character.length;
    }

    return result;
  }

  private getGraphemes(value: string): string[] {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      const segmenter = new Intl.Segmenter(undefined, {
        granularity: 'grapheme',
      });

      return Array.from(segmenter.segment(value), ({ segment }) => segment);
    }

    return Array.from(value);
  }

  private getDataOptions(): FieldTextCounterOptions {
    const options: FieldTextCounterOptions = {};
    const maxChars = this.getNumberDataOption(dataAttributes.maxChars);
    const maxPercentageWarning = this.getNumberDataOption(
      dataAttributes.maxPercentageWarning,
    );
    const msgAppendMethod = this.field.getAttribute(
      dataAttributes.msgAppendMethod,
    );
    const format = this.field.getAttribute(dataAttributes.format);
    const visibility = this.field.getAttribute(dataAttributes.visibility);
    const countMode = this.field.getAttribute(dataAttributes.countMode);

    if (maxChars !== undefined) {
      options.maxChars = maxChars;
    }
    if (maxPercentageWarning !== undefined) {
      options.maxPercentageWarning = maxPercentageWarning;
    }
    if (
      msgAppendMethod === 'insertAfter' ||
      msgAppendMethod === 'insertBefore'
    ) {
      options.msgAppendMethod = msgAppendMethod;
    }
    if (format !== null) {
      options.format = format;
    }
    if (visibility === 'always' || visibility === 'focus') {
      options.visibility = visibility;
    } else if (visibility === 'true' || visibility === 'false') {
      options.visibility = visibility === 'true';
    }
    if (countMode === 'codeUnits' || countMode === 'graphemes') {
      options.countMode = countMode;
    }

    return options;
  }

  private getNumberDataOption(attribute: string): number | undefined {
    const value = this.field.getAttribute(attribute);
    if (value === null || value.trim() === '') {
      return undefined;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  private isAlwaysVisible(): boolean {
    const visibility: FieldTextCounterVisibility = this.options.visibility;
    return visibility === 'always' || visibility === true;
  }

  private insertElement(): void {
    if (!this.element || !this.field.parentNode) {
      return;
    }

    if (this.options.msgAppendMethod === 'insertBefore') {
      this.field.parentNode.insertBefore(this.element, this.field);
    } else {
      this.field.parentNode.insertBefore(this.element, this.field.nextSibling);
    }
  }

  private show(): void {
    this.element?.classList.add('field-text-counter--visible');
  }

  private hide(): void {
    this.element?.classList.remove('field-text-counter--visible');
  }
}
