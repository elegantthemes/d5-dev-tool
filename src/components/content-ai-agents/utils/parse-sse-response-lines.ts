type ParsedChunk = Record<string, unknown>;

export type SseResponseLine = {
  lineNumber: number;
  rawLine: string;
  kind: 'json' | 'done' | 'other';
  eventType: string | null;
  sequenceNumber: number | null;
  formattedJson: string;
  summary: string;
};

const parseJsonOrNull = (text: string): ParsedChunk | null => {
  try {
    return JSON.parse(text) as ParsedChunk;
  } catch {
    return null;
  }
};

const buildJsonLine = (
  lineNumber: number,
  rawLine: string,
  parsed: ParsedChunk,
): SseResponseLine => {
  const eventType = 'string' === typeof parsed.type ? parsed.type : null;
  const sequenceNumber = 'number' === typeof parsed.sequence_number
    ? parsed.sequence_number
    : null;
  const summaryParts = [
    eventType,
    null !== sequenceNumber ? `seq ${sequenceNumber}` : null,
  ].filter((part): part is string => Boolean(part));

  return {
    lineNumber,
    rawLine,
    kind: 'json',
    eventType,
    sequenceNumber,
    formattedJson: JSON.stringify(parsed, null, 2),
    summary: 0 < summaryParts.length ? summaryParts.join(' · ') : `Event ${lineNumber}`,
  };
};

const buildDoneLine = (lineNumber: number, rawLine: string): SseResponseLine => ({
  lineNumber,
  rawLine,
  kind: 'done',
  eventType: null,
  sequenceNumber: null,
  formattedJson: '[DONE]',
  summary: '[DONE]',
});

const buildOtherLine = (lineNumber: number, rawLine: string): SseResponseLine => {
  const trimmed = rawLine.trim();
  const summary = 60 < trimmed.length ? `${trimmed.slice(0, 60)}…` : trimmed;

  return {
    lineNumber,
    rawLine,
    kind: 'other',
    eventType: null,
    sequenceNumber: null,
    formattedJson: trimmed,
    summary: summary || `Line ${lineNumber}`,
  };
};

/**
 * Splits a captured inference response into displayable SSE events.
 *
 * Supports whole JSON payloads and newline-delimited `data:` SSE streams.
 */
export const parseSseResponseLines = (content: string): SseResponseLine[] => {
  const trimmed = content.trim();

  if (!trimmed) {
    return [];
  }

  const wholePayload = parseJsonOrNull(trimmed);

  if (wholePayload) {
    return [buildJsonLine(1, trimmed, wholePayload)];
  }

  const lines: SseResponseLine[] = [];
  let lineNumber = 0;

  content.split('\n').forEach(rawLine => {
    const trimmedLine = rawLine.trim();

    if (!trimmedLine) {
      return;
    }

    lineNumber += 1;

    if ('[DONE]' === trimmedLine || 'data: [DONE]' === trimmedLine) {
      lines.push(buildDoneLine(lineNumber, rawLine));

      return;
    }

    const payload = trimmedLine.startsWith('data: ')
      ? trimmedLine.slice(6).trim()
      : trimmedLine;

    if ('[DONE]' === payload) {
      lines.push(buildDoneLine(lineNumber, rawLine));

      return;
    }

    if (payload.startsWith('{')) {
      const parsed = parseJsonOrNull(payload);

      if (parsed) {
        lines.push(buildJsonLine(lineNumber, rawLine, parsed));

        return;
      }
    }

    lines.push(buildOtherLine(lineNumber, rawLine));
  });

  return lines;
};
