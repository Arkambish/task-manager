import type { TransformFnParams } from 'class-transformer';

/** Limits shared by the create and update DTOs, so they cannot drift apart. */
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 1000;

/** Matches the shape `YYYY-MM-DD` only (a full timestamp does not match). */
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DATE_FORMAT_MESSAGE = 'dueDate must use the YYYY-MM-DD format';
export const DATE_REAL_MESSAGE = 'dueDate must be a real calendar date';

/**
 * `@Transform` helper: trims strings and leaves every other value untouched,
 * so the validators that run afterwards still see (and reject) wrong types.
 */
export function trim({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * `@ValidateIf` helper for "may be left out, but may not be null".
 *
 * `@IsOptional()` is not used for those fields because it skips every other
 * rule for `null` as well as `undefined`, which would let `{ "title": null }`
 * through.
 */
export function isPresent(_object: unknown, value: unknown): boolean {
  return value !== undefined;
}
