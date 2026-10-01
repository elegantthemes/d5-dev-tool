type ParsedChunk = Record<string, unknown>;

const FUNCTION_CALL_TYPES = new Set(['function_call', 'tool_use']);
const FUNCTION_OUTPUT_TYPES = new Set(['function_call_output', 'tool_result']);

export type InferenceToolCallRef = {
  name: string;
  id: string;
};

const parseJsonOrNull = (text: string): ParsedChunk | null => {
  try {
    return JSON.parse(text) as ParsedChunk;
  } catch {
    return null;
  }
};

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

const getToolCallName = (record: ParsedChunk): string | null => (
  asTrimmedString(record.name) ?? asTrimmedString(asRecord(record.function)?.name)
);

const getFunctionCallDisplayId = (record: ParsedChunk): string => (
  asTrimmedString(record.id)
  ?? asTrimmedString(record.item_id)
  ?? ''
);

const getFunctionCallPairId = (record: ParsedChunk): string => (
  asTrimmedString(record.call_id)
  ?? asTrimmedString(record.tool_call_id)
  ?? asTrimmedString(record.id)
  ?? ''
);

/**
 * Formats a captured tool invocation as `name (id)` for the summary table.
 */
export const formatInferenceToolCallRef = (toolCall: InferenceToolCallRef): string => {
  if (toolCall.id) {
    return `${toolCall.name} (${toolCall.id})`;
  }

  return toolCall.name;
};

/**
 * Formats invoked tool refs for the summary table and clipboard export.
 */
export const formatInferenceToolCallRefs = (toolCalls: InferenceToolCallRef[]): string => (
  0 === toolCalls.length ? '—' : toolCalls.map(formatInferenceToolCallRef).join(', ')
);

/**
 * @deprecated Use `formatInferenceToolCallRefs`.
 */
export const formatInferenceResponseToolCalls = formatInferenceToolCallRefs;

const addToolCallRef = (
  toolCalls: InferenceToolCallRef[],
  seen: Set<string>,
  name: string | null,
  id: string,
): void => {
  if (!name) {
    return;
  }

  const key = id || name;

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  toolCalls.push({
    name,
    id,
  });
};

const collectFromOutputItem = (
  item: unknown,
  toolCalls: InferenceToolCallRef[],
  seen: Set<string>,
): void => {
  const record = asRecord(item);

  if (!record) {
    return;
  }

  const type = asTrimmedString(record.type);

  if (type && FUNCTION_CALL_TYPES.has(type)) {
    addToolCallRef(toolCalls, seen, getToolCallName(record), getFunctionCallDisplayId(record));

    return;
  }

  const fn = asRecord(record.function);

  if (fn) {
    addToolCallRef(
      toolCalls,
      seen,
      getToolCallName(record),
      getFunctionCallDisplayId(record),
    );
  }
};

const collectFromChunk = (
  chunk: ParsedChunk,
  toolCalls: InferenceToolCallRef[],
  seen: Set<string>,
): void => {
  const type = chunk.type;

  if (
    'response.output_item.added' === type
    || 'response.output_item.done' === type
  ) {
    collectFromOutputItem(chunk.item, toolCalls, seen);
  }

  if ('response.function_call_arguments.done' === type) {
    addToolCallRef(
      toolCalls,
      seen,
      getToolCallName(chunk),
      getFunctionCallDisplayId(chunk),
    );
  }

  const response = asRecord(chunk.response);
  const output = response?.output ?? chunk.output;

  if (Array.isArray(output)) {
    output.forEach(item => collectFromOutputItem(item, toolCalls, seen));
  }

  const choices = chunk.choices;

  if (!Array.isArray(choices)) {
    return;
  }

  choices.forEach(choice => {
    const record = asRecord(choice);

    if (!record) {
      return;
    }

    const message = asRecord(record.message) ?? asRecord(record.delta);
    const nestedToolCalls = message?.tool_calls;

    if (Array.isArray(nestedToolCalls)) {
      nestedToolCalls.forEach(item => collectFromOutputItem(item, toolCalls, seen));
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
 * Entries keep first-seen order and are unique by function-call id.
 */
export const extractInferenceResponseToolCalls = (
  responseBody: string | null | undefined,
): InferenceToolCallRef[] => {
  const toolCalls: InferenceToolCallRef[] = [];
  const seen = new Set<string>();

  collectChunksFromText(responseBody ?? '').forEach(chunk => {
    collectFromChunk(chunk, toolCalls, seen);
  });

  return toolCalls;
};

const collectPayloadInputToolCall = (
  record: ParsedChunk,
  ordered: Array<InferenceToolCallRef & { pairId: string }>,
  outputPairIds: Set<string>,
): void => {
  const type = asTrimmedString(record.type);
  const role = asTrimmedString(record.role);

  if (
    (type && FUNCTION_CALL_TYPES.has(type))
    || ('function' === type && getToolCallName(record))
  ) {
    ordered.push({
      name: getToolCallName(record) ?? 'Unknown tool',
      id: getFunctionCallDisplayId(record),
      pairId: getFunctionCallPairId(record),
    });

    return;
  }

  if (Array.isArray(record.tool_calls)) {
    record.tool_calls.forEach(item => {
      const nested = asRecord(item);

      if (!nested) {
        return;
      }

      collectPayloadInputToolCall(nested, ordered, outputPairIds);
    });
  }

  if ((type && FUNCTION_OUTPUT_TYPES.has(type)) || 'tool' === role) {
    const pairId = getFunctionCallPairId(record);

    if (pairId) {
      outputPairIds.add(pairId);
    }
  }
};

/**
 * Reads prior tool calls from a captured inference payload `input` array.
 *
 * Only function calls that also have a matching output are included.
 */
export const extractInferencePayloadToolCalls = (
  requestBody: string | null | undefined,
): InferenceToolCallRef[] => {
  const parsed = parseJsonOrNull(requestBody ?? '');

  if (!parsed || !Array.isArray(parsed.input)) {
    return [];
  }

  const ordered: Array<InferenceToolCallRef & { pairId: string }> = [];
  const outputPairIds = new Set<string>();

  parsed.input.forEach(value => {
    const record = asRecord(value);

    if (!record) {
      return;
    }

    collectPayloadInputToolCall(record, ordered, outputPairIds);
  });

  if (0 === outputPairIds.size) {
    return [];
  }

  return ordered
    .filter(toolCall => outputPairIds.has(toolCall.pairId))
    .map(({ name, id }) => ({
      name,
      id,
    }));
};
