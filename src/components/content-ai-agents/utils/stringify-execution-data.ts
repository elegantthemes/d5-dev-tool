/**
 * Serializes debug data for clipboard copy, tolerating circular references,
 * immutable wrappers, and non-serializable values.
 *
 * Only true cycles are replaced: the tracked stack holds the current value's
 * ancestors, so an object referenced twice in sibling branches still
 * serializes in full.
 */
export const stringifyExecutionData = (value: unknown): string => {
  const ancestors: unknown[] = [];

  // `this` is the object holding the value being serialized, which is what
  // makes ancestor unwinding possible, so this cannot be an arrow function.
  function replacer(this: unknown, _key: string, item: unknown): unknown {
    if ('function' === typeof item) {
      return '[Function]';
    }

    if ('object' !== typeof item || null === item) {
      return item;
    }

    while (0 < ancestors.length && ancestors[ancestors.length - 1] !== this) {
      ancestors.pop();
    }

    if (-1 !== ancestors.indexOf(item)) {
      return '[Circular]';
    }

    ancestors.push(item);

    return item;
  }

  try {
    return JSON.stringify(value, replacer, 2) ?? '';
  } catch (error) {
    return `[Unserializable debug data: ${(error as { message?: string })?.message ?? 'unknown error'}]`;
  }
};
