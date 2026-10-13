export type PlainObject = Record<string, unknown>;

export function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Deep-merges `override` onto `base` without mutating either.
 *  - plain objects merge recursively
 *  - arrays and scalars in `override` replace the base value
 *  - `undefined` in `override` keeps the base value
 *  - `null` in `override` removes the key
 */
export function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) return override as T;

  const result: PlainObject = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    if (value === null) {
      delete result[key];
      continue;
    }
    result[key] = deepMerge(result[key], value);
  }
  return result as T;
}
