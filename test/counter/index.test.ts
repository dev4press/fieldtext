// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { FieldTextCounter } from '../../src/counter';

describe('FieldTextCounter', () => {
  it('counts, formats, and warns as the field changes', () => {
    const field = document.createElement('textarea');
    document.body.append(field);
    const counter = new FieldTextCounter(field, {
      maxChars: 10,
      maxPercentageWarning: 80,
      format: '{current}/{max} ({remaining} remaining, {percentage}%)',
    });

    field.focus();
    field.value = '12345678';
    field.dispatchEvent(new Event('input', { bubbles: true }));

    expect(counter.element!.textContent).toBe('8/10 (2 remaining, 80%)');
    expect(
      counter.element!.classList.contains('field-text-counter--warning'),
    ).toBe(true);
    expect(counter.element!.style.color).toBe('');

    counter.destroy();
    expect(document.querySelector('.field-text-counter')).toBeNull();
  });

  it('truncates values over the configured maximum', () => {
    const field = document.createElement('input');
    const counter = new FieldTextCounter(field, { maxChars: 5 });

    field.value = '1234567';
    field.dispatchEvent(new Event('input'));

    expect(field.value).toBe('12345');
    expect(counter.getCount()).toBe(5);
  });

  it('uses maxlength when maxChars is not configured', () => {
    const field = document.createElement('input');
    field.maxLength = 6;
    document.body.append(field);
    const counter = new FieldTextCounter(field);

    field.value = '1234567';
    counter.update();

    expect(field.value).toBe('123456');
    expect(counter.element!.textContent).toBe('6 / 6 characters');
  });

  it('does not create a counter when maxChars is not positive', () => {
    const field = document.createElement('textarea');
    const counter = new FieldTextCounter(field, { maxChars: 0 });

    expect(counter.element).toBeNull();
    expect(field.parentElement).toBeNull();
  });

  it('supports insertBefore and appending the message', () => {
    const field = document.createElement('input');
    document.body.append(field);
    const counter = new FieldTextCounter(field, {
      maxChars: 4,
      maxPercentageWarning: 50,
      msgAppendMethod: 'insertBefore',
      format: '{remaining} of {max} left',
    });

    field.value = 'ab';
    field.dispatchEvent(new Event('input'));

    expect(field.previousElementSibling).toBe(counter.element);
    expect(counter.element!.textContent).toBe('2 of 4 left');
    expect(
      counter.element!.classList.contains('field-text-counter--warning'),
    ).toBe(true);

    field.dispatchEvent(new Event('blur'));
    expect(
      counter.element!.classList.contains('field-text-counter--visible'),
    ).toBe(false);
  });

  it('removes the warning class below the percentage threshold', () => {
    const field = document.createElement('textarea');
    document.body.append(field);
    const counter = new FieldTextCounter(field, {
      maxChars: 10,
      maxPercentageWarning: 80,
    });

    field.value = '12345678';
    counter.update();
    expect(
      counter.element!.classList.contains('field-text-counter--warning'),
    ).toBe(true);

    field.value = '1234567';
    counter.update();
    expect(
      counter.element!.classList.contains('field-text-counter--warning'),
    ).toBe(false);
  });

  it('replaces every number token in the format', () => {
    const field = document.createElement('textarea');
    document.body.append(field);
    const counter = new FieldTextCounter(field, {
      maxChars: 3,
      format: '{current}/{current} {max}/{max} {remaining}/{remaining}',
    });

    field.value = 'a';
    counter.update();

    expect(counter.element!.textContent).toBe('1/1 3/3 2/2');
  });

  it('rounds the percentage token to a full percent', () => {
    const field = document.createElement('textarea');
    document.body.append(field);
    const counter = new FieldTextCounter(field, {
      maxChars: 3,
      format: '{percentage}% complete',
    });

    field.value = 'a';
    counter.update();

    expect(counter.element!.textContent).toBe('33% complete');
  });

  it('supports always-visible counters', () => {
    const field = document.createElement('input');
    document.body.append(field);
    const counter = new FieldTextCounter(field, { visibility: 'always' });

    counter.update();
    field.dispatchEvent(new Event('blur'));

    expect(
      counter.element!.classList.contains('field-text-counter--visible'),
    ).toBe(true);
  });

  it('lets data attributes override initialization options', () => {
    const field = document.createElement('input');
    field.setAttribute('data-field-text-counter-max-chars', '4');
    field.setAttribute('data-field-text-counter-format', '{current} of {max}');
    field.setAttribute('data-field-text-counter-max-percentage-warning', '50');
    document.body.append(field);
    const counter = new FieldTextCounter(field, {
      maxChars: 10,
      format: 'ignored',
      maxPercentageWarning: 90,
    });

    field.value = 'ab';
    counter.update();

    expect(counter.element!.textContent).toBe('2 of 4');
    expect(
      counter.element!.classList.contains('field-text-counter--warning'),
    ).toBe(true);
  });

  it('auto loads marked text fields and applies their data options', () => {
    const textarea = document.createElement('textarea');
    const input = document.createElement('input');
    textarea.setAttribute('data-field-text-counter', '');
    textarea.setAttribute('data-field-text-counter-max-chars', '8');
    input.setAttribute('data-field-text-counter', '');
    input.setAttribute('maxlength', '5');
    document.body.append(textarea, input);

    const counters = FieldTextCounter.autoLoad({ format: '{current}/{max}' });

    expect(counters).toHaveLength(2);
    expect(counters[0]?.element?.textContent).toBe('0/8');
    expect(counters[1]?.element?.textContent).toBe('0/5');
  });

  it('counts and truncates by grapheme clusters when configured', () => {
    const field = document.createElement('textarea');
    document.body.append(field);
    const counter = new FieldTextCounter(field, {
      maxChars: 2,
      countMode: 'graphemes',
      format: '{current}/{max}',
    });

    field.value = 'A😀👍🏽é';
    counter.update();

    expect(field.value).toBe('A😀');
    expect(counter.getCount()).toBe(2);
    expect(counter.element!.textContent).toBe('2/2');
  });

  it('uses UTF-16 code units by default while avoiding split surrogate pairs', () => {
    const field = document.createElement('input');
    document.body.append(field);
    const counter = new FieldTextCounter(field, {
      maxChars: 2,
      format: '{current}/{max}',
    });

    field.value = 'a😀';
    counter.update();

    expect(field.value).toBe('a');
    expect(counter.getCount()).toBe(1);
    expect(counter.element!.textContent).toBe('1/2');
  });

  it('allows the data attribute to select grapheme counting', () => {
    const field = document.createElement('input');
    field.setAttribute('data-field-text-counter-count-mode', 'graphemes');
    document.body.append(field);
    const counter = new FieldTextCounter(field, {
      maxChars: 2,
      countMode: 'codeUnits',
      format: '{current}/{max}',
    });

    field.value = '😀👍';
    counter.update();

    expect(counter.getCount()).toBe(2);
    expect(counter.element!.textContent).toBe('2/2');
  });
});
