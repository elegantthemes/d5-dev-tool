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

  return {
    display: content,
    copyValue: content,
    isJson: false,
  };
};
