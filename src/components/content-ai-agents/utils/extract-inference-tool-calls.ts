type ParsedChunk = Record<string, unknown>;

const FUNCTION_CALL_TYPES = new Set(['function_call', 'tool_use']);

const parseJsonOrNull = (text: string): ParsedChunk | null => {
  try {
    return JSON.parse(text) as ParsedChunk;
  } catch {
    return null;
  }
};

const addToolName = (names: string[], seen: Set<string>, name: unknown): void => {
  if ('string' !== typeof name) {
    return;
  }

  const trimmed = name.trim();

  if (!trimmed || seen.has(trimmed)) {
    return;
  }

  seen.add(trimmed);
  names.push(trimmed);
};

/**
 * Collects a tool name from a Responses API / chat-completions tool-call item.
 *
 * Available-tool definitions (`tools: [{ type: "function", name }]`) are ignored
 * because they are not invocations.
 */
const collectFromOutputItem = (
  item: unknown,
  names: string[],
  seen: Set<string>,
): void => {
  if (!item || 'object' !== typeof item) {
    return;
  }

  const record = item as ParsedChunk;
  const type = record.type;

  if (FUNCTION_CALL_TYPES.has(String(type))) {
    addToolName(names, seen, record.name);

    return;
  }

  const fn = record.function;

  if (fn && 'object' === typeof fn) {
    addToolName(names, seen, (fn as ParsedChunk).name);
  }
};

const collectFromChunk = (
  chunk: ParsedChunk,
  names: string[],
  seen: Set<string>,
): void => {
  const type = chunk.type;

  if (
    'response.output_item.added' === type
    || 'response.output_item.done' === type
  ) {
    collectFromOutputItem(chunk.item, names, seen);
  }

  if ('response.function_call_arguments.done' === type) {
    addToolName(names, seen, chunk.name);
  }

  const response = chunk.response && 'object' === typeof chunk.response
    ? chunk.response as ParsedChunk
    : null;
  const output = response?.output ?? chunk.output;

  if (Array.isArray(output)) {
    output.forEach(item => collectFromOutputItem(item, names, seen));
  }

  const choices = chunk.choices;

  if (!Array.isArray(choices)) {
    return;
  }

  choices.forEach(choice => {
    if (!choice || 'object' !== typeof choice) {
      return;
    }

    const record = choice as ParsedChunk;
    const message = record.message ?? record.delta;

    if (!message || 'object' !== typeof message) {
      return;
    }

    const toolCalls = (message as ParsedChunk).tool_calls;

    if (Array.isArray(toolCalls)) {
      toolCalls.forEach(item => collectFromOutputItem(item, names, seen));
    }
  });
};

const collectChunksFromText = (text: string): ParsedChunk[] => {
  const chunks: ParsedChunk[] = [];

  if (!text.trim()) {
    return chunks;
  }

  const parsed = parseJsonOrNull(text);

  if (parsed) {
    chunks.push(parsed);

    return chunks;
  }

  text.split('\n').forEach(line => {
    const trimmed = line.trim();

    if (!trimmed || '[DONE]' === trimmed) {
      return;
    }

    const payload = trimmed.startsWith('data: ') ? trimmed.slice(6).trim() : trimmed;

    if (!payload.startsWith('{')) {
      return;
    }

    const chunk = parseJsonOrNull(payload);

    if (chunk) {
      chunks.push(chunk);
    }
  });

  return chunks;
};

/**
 * Reads which tools the model invoked from a captured inference response body.
 *
 * Streaming Responses API events and completed JSON payloads are both supported.
 * Tool names are unique and keep first-seen order.
 */
export const extractInferenceResponseToolCalls = (
  responseBody: string | null | undefined,
): string[] => {
  const names: string[] = [];
  const seen = new Set<string>();

  collectChunksFromText(responseBody ?? '').forEach(chunk => {
    collectFromChunk(chunk, names, seen);
  });

  return names;
};

/**
 * Formats invoked tool names for the summary table and clipboard export.
 */
export const formatInferenceResponseToolCalls = (toolCalls: string[]): string => (
  0 === toolCalls.length ? '—' : toolCalls.join(', ')
);
