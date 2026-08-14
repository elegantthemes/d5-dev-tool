export type FormattedContent = {
  display: string;
  copyValue: string;
  isJson: boolean;
};

const stripCodeFence = (value: string): string => {
  const fencedMatch = value.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  return value;
};

const tryParseJson = (value: string): unknown | null => {
  try {
    return JSON.parse(stripCodeFence(value));
  } catch {
    return null;
  }
};

const formatParsedJson = (parsed: unknown): FormattedContent => ({
  display: JSON.stringify(parsed, null, 2),
  copyValue: JSON.stringify(parsed, null, 2),
  isJson: true,
});

// Appended by the network recorder once a captured body exceeds its size cap.
const TRUNCATION_MARKER = /\n?…\[truncated \d+ chars\]\s*$/;

const INDENT_UNIT = '  ';

/**
 * Indents JSON-shaped text that `JSON.parse` rejects.
 *
 * Captured request and response bodies are cut off at a size cap, so large
 * payloads arrive as a syntactically incomplete object. Scanning character by
 * character still lays them out correctly, because indentation only needs the
 * brace depth and whether the cursor sits inside a string literal.
 */
const reflowJsonLike = (value: string): string => {
  const lines: string[] = [];
  let line = '';
  let depth = 0;
  let isInString = false;
  let isEscaped = false;

  const flushLine = () => {
    if (line.trim()) {
      lines.push(line);
    }

    line = '';
  };
  const openLine = () => {
    if (!line) {
      line = INDENT_UNIT.repeat(Math.max(0, depth));
    }
  };

  for (const character of value) {
    if (isInString) {
      line += character;

      if (isEscaped) {
        isEscaped = false;
      } else if ('\\' === character) {
        isEscaped = true;
      } else if ('"' === character) {
        isInString = false;
      }

      continue;
    }

    if ('"' === character) {
      openLine();
      line += character;
      isInString = true;

      continue;
    }

    if ('{' === character || '[' === character) {
      openLine();
      line += character;
      flushLine();
      depth += 1;

      continue;
    }

    if ('}' === character || ']' === character) {
      flushLine();
      depth -= 1;
      line = INDENT_UNIT.repeat(Math.max(0, depth)) + character;

      continue;
    }

    if (',' === character) {
      line += character;
      flushLine();

      continue;
    }

    if (':' === character) {
      line += ': ';

      continue;
    }

    // Whitespace between tokens carries no meaning and would leave the reflowed
    // output with stray indentation.
    if (/\s/.test(character)) {
      continue;
    }

    openLine();
    line += character;
  }

  flushLine();

  return lines.join('\n');
};

/**
 * Formats a body that could not be parsed, preserving its truncation notice.
 */
const formatTruncatedJson = (content: string): FormattedContent | null => {
  const marker = content.match(TRUNCATION_MARKER)?.[0]?.trim() ?? '';
  const body = content.replace(TRUNCATION_MARKER, '').trim();

  // A quoted key is what separates a real payload from bracketed placeholder
  // prose such as `[Server-sent event stream — body not buffered]`, which must
  // never be reflowed as if it were JSON.
  if (!/^[{[]/.test(body) || !/"\s*:/.test(body)) {
    return null;
  }

  const reflowed = marker ? `${reflowJsonLike(body)}\n${marker}` : reflowJsonLike(body);

  return {
    display: reflowed,
    copyValue: reflowed,
    isJson: true,
  };
};

/**
 * Attempts to pretty-print JSON content for debug display and copy actions.
 */
export const formatJsonContent = (content: string): FormattedContent => {
  const trimmed = content.trim();

  if (!trimmed) {
    return {
      display: content,
      copyValue: content,
      isJson: false,
    };
  }

  const directParse = tryParseJson(trimmed);

  if (null !== directParse) {
    return formatParsedJson(directParse);
  }

  const candidates = [
    trimmed,
    trimmed.match(/Params:\s*\n([\s\S]*?)(?:\n\nResult:|\s*$)/)?.[1]?.trim(),
    trimmed.match(/Result:\s*\n([\s\S]*)$/)?.[1]?.trim(),
    trimmed.match(/Tool:\s*[^\n]+\n\nParams:\s*\n([\s\S]*?)(?:\n\nResult:|$)/)?.[1]?.trim(),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    const parsed = tryParseJson(candidate);

    if (null !== parsed) {
      return formatParsedJson(parsed);
    }
  }

  const truncated = formatTruncatedJson(trimmed);

  if (truncated) {
    return truncated;
  }

  return {
    display: content,
    copyValue: content,
    isJson: false,
  };
};
