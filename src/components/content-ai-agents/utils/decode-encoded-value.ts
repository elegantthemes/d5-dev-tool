/**
 * Serializes a value so `formatJsonContent` can pretty-print encoded JSON later.
 *
 * Tool-call `arguments` and `output` fields often arrive as JSON strings.
 */
export const toJsonContentString = (value: unknown): string => {
  if ('string' === typeof value) {
    return value;
  }

  if (undefined === value || null === value) {
    return '';
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};
