import { describe, expect, it } from 'vitest';
import { isUuid, parseNumber } from './utils';

describe('isUuid', () => {
  it('accepts lowercase UUID v4', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('rejects invalid strings', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});

describe('parseNumber', () => {
  it('normalizes Vietnamese-style thousands and decimal comma', () => {
    expect(parseNumber('1.234.567,89')).toBe('1234567.89');
  });
});
