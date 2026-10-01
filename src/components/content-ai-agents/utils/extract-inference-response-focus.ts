import { toJsonContentString } from './decode-encoded-value';
import { parseSseResponseLines } from './parse-sse-response-lines';

export type ResponseFocusItem = {
  type: string;
  name: string | null;
  id: string | null;
  callId: string | null;
  status: string | null;
  bodyLabel: string;
  body: string;
};

export type InferenceResponseFocus = {
  items: ResponseFocusItem[];
  isComplete: boolean;
};

type ParsedChunk = Record<string, unknown>;

const asRecord = (value: unknown): ParsedChunk | null => {
  if (!value || 'object' !== typeof value || Array.isArray(value)) {
    return null;
  }

  return value as ParsedChunk;
};

const asTrimmedString = (value: unknown): string | null => {
  if ('string' !== typeof value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
};

const collectPartText = (part: unknown): string => {
  if ('string' === typeof part) {
    return part;
  }

  const record = asRecord(part);

  if (!record) {
    return '';
  }

  if ('string' === typeof record.text) {
    return record.text;
  }

  if ('string' === typeof record.arguments) {
    return record.arguments;
  }

  return '';
};

const collectMessageText = (item: ParsedChunk): string => {
  const content = item.content ?? item.text;

  if ('string' === typeof content) {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map(collectPartText)
    .filter(part => Boolean(part.trim()))
    .join('\n');
};

const getOutputArray = (parsed: ParsedChunk): unknown[] | null => {
  const response = asRecord(parsed.response);

  if (Array.isArray(response?.output)) {
    return response.output;
  }

  if (Array.isArray(parsed.output)) {
    return parsed.output;
  }

  return null;
};

const isCompletedChunk = (parsed: ParsedChunk): boolean => {
  if ('response.completed' === parsed.type) {
    return true;
  }

  const response = asRecord(parsed.response);

  if ('completed' === response?.status) {
    return true;
  }

  return 'completed' === parsed.status && Array.isArray(parsed.output);
};

const normalizeOutputItem = (value: unknown): ResponseFocusItem | null => {
  const item = asRecord(value);

  if (!item) {
    return null;
  }

  const type = asTrimmedString(item.type) ?? 'output';
  const name = asTrimmedString(item.name)
    ?? asTrimmedString(asRecord(item.function)?.name);
  const id = asTrimmedString(item.id);
  const callId = asTrimmedString(item.call_id) ?? asTrimmedString(item.tool_call_id);
  const status = asTrimmedString(item.status);

  if ('function_call' === type || 'tool_use' === type) {
    const argumentsValue = item.arguments ?? asRecord(item.function)?.arguments ?? '';

    return {
      type,
      name,
      id,
      callId,
      status,
      bodyLabel: 'Arguments',
      body: toJsonContentString(argumentsValue),
    };
  }

  if ('function_call_output' === type || 'tool_result' === type) {
    return {
      type,
      name,
      id,
      callId,
      status,
      bodyLabel: 'Output',
      body: toJsonContentString(item.output ?? item.content ?? ''),
    };
  }

  const text = collectMessageText(item).trim();

  if (text) {
    return {
      type,
      name,
      id,
      callId,
      status,
      bodyLabel: 'Content',
      body: toJsonContentString(text),
    };
  }

  if (undefined !== item.arguments) {
    return {
      type,
      name,
      id,
      callId,
      status,
      bodyLabel: 'Arguments',
      body: toJsonContentString(item.arguments),
    };
  }

  if (undefined !== item.output) {
    return {
      type,
      name,
      id,
      callId,
      status,
      bodyLabel: 'Output',
      body: toJsonContentString(item.output),
    };
  }

  return {
    type,
    name,
    id,
    callId,
    status,
    bodyLabel: 'Content',
    body: toJsonContentString(item),
  };
};

/**
 * Pulls completed `output` items out of a streamed or JSON inference response.
 */
export const extractInferenceResponseFocus = (
  responseBody: string | null | undefined,
): InferenceResponseFocus => {
  const lines = parseSseResponseLines(responseBody ?? '');
  const parsedChunks = lines
    .map(line => line.parsed)
    .filter((parsed): parsed is ParsedChunk => Boolean(parsed));

  const completedChunk = [...parsedChunks].reverse().find(isCompletedChunk);
  const completedOutput = completedChunk ? getOutputArray(completedChunk) : null;

  if (completedOutput) {
    return {
      items: completedOutput
        .map(normalizeOutputItem)
        .filter((item): item is ResponseFocusItem => Boolean(item)),
      isComplete: true,
    };
  }

  const doneItems = parsedChunks
    .filter(chunk => 'response.output_item.done' === chunk.type)
    .map(chunk => chunk.item)
    .map(normalizeOutputItem)
    .filter((item): item is ResponseFocusItem => Boolean(item));

  if (0 < doneItems.length) {
    return {
      items: doneItems,
      isComplete: false,
    };
  }

  const fallbackOutput = [...parsedChunks].reverse()
    .map(getOutputArray)
    .find((output): output is unknown[] => Array.isArray(output) && 0 < output.length);

  if (fallbackOutput) {
    return {
      items: fallbackOutput
        .map(normalizeOutputItem)
        .filter((item): item is ResponseFocusItem => Boolean(item)),
      isComplete: false,
    };
  }

  return {
    items: [],
    isComplete: false,
  };
};
