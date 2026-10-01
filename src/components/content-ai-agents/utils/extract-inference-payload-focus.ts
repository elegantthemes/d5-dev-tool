import { toJsonContentString } from './decode-encoded-value';

export type PayloadFocusMessage = {
  kind: 'system' | 'user';
  content: string;
};

export type PayloadFocusToolCall = {
  kind: 'tool_call';
  name: string;
  id: string;
  output: string;
};

export type PayloadFocusItem = PayloadFocusMessage | PayloadFocusToolCall;

export type InferencePayloadFocus = {
  model: string | null;
  tools: string[] | null;
  items: PayloadFocusItem[];
  isParsed: boolean;
};

type PayloadRecord = Record<string, unknown>;

const asRecord = (value: unknown): PayloadRecord | null => {
  if (!value || 'object' !== typeof value || Array.isArray(value)) {
    return null;
  }

  return value as PayloadRecord;
};

const asTrimmedString = (value: unknown): string | null => {
  if ('string' !== typeof value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
};

const parsePayload = (requestBody: string): PayloadRecord | null => {
  if (!requestBody.trim()) {
    return null;
  }

  try {
    return asRecord(JSON.parse(requestBody));
  } catch {
    return null;
  }
};

const extractToolName = (tool: unknown): string | null => {
  const record = asRecord(tool);

  if (!record) {
    return null;
  }

  const directName = asTrimmedString(record.name);

  if (directName) {
    return directName;
  }

  return asTrimmedString(asRecord(record.function)?.name);
};

const extractToolNames = (tools: unknown): string[] | null => {
  if (!Array.isArray(tools)) {
    return null;
  }

  const names: string[] = [];
  const seen = new Set<string>();

  tools.forEach(tool => {
    const name = extractToolName(tool);

    if (!name || seen.has(name)) {
      return;
    }

    seen.add(name);
    names.push(name);
  });

  return names;
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

  if ('input_image' === record.type || 'image_url' === record.type || 'output_image' === record.type) {
    return '[image]';
  }

  return '';
};

const collectMessageText = (item: PayloadRecord): string => {
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

const isSystemRole = (role: string | null): boolean => (
  'system' === role || 'developer' === role
);

const isUserRole = (role: string | null): boolean => 'user' === role;

const getItemRole = (item: PayloadRecord): string | null => asTrimmedString(item.role);

const getItemType = (item: PayloadRecord): string | null => asTrimmedString(item.type);

const getToolCallId = (item: PayloadRecord): string => (
  asTrimmedString(item.call_id)
  ?? asTrimmedString(item.tool_call_id)
  ?? asTrimmedString(item.id)
  ?? ''
);

const getToolCallName = (item: PayloadRecord): string => (
  asTrimmedString(item.name)
  ?? asTrimmedString(asRecord(item.function)?.name)
  ?? ''
);

const getToolCallOutput = (item: PayloadRecord): string => (
  toJsonContentString(item.output ?? item.content ?? '')
);

const upsertToolCall = (
  items: PayloadFocusItem[],
  pendingById: Map<string, PayloadFocusToolCall>,
  name: string,
  id: string,
  output: string,
): void => {
  const existing = id ? pendingById.get(id) : undefined;

  if (existing) {
    if (!existing.name && name) {
      existing.name = name;
    }

    if (output.trim()) {
      existing.output = output;
    }

    return;
  }

  const toolCall: PayloadFocusToolCall = {
    kind: 'tool_call',
    name,
    id,
    output,
  };

  items.push(toolCall);

  if (id) {
    pendingById.set(id, toolCall);
  }
};

const appendInputItem = (
  items: PayloadFocusItem[],
  pendingById: Map<string, PayloadFocusToolCall>,
  value: unknown,
): void => {
  if ('string' === typeof value) {
    const content = value.trim();

    if (content) {
      items.push({
        kind: 'user',
        content,
      });
    }

    return;
  }

  const item = asRecord(value);

  if (!item) {
    return;
  }

  const type = getItemType(item);
  const role = getItemRole(item);

  if ('function_call' === type || 'tool_use' === type) {
    upsertToolCall(items, pendingById, getToolCallName(item), getToolCallId(item), '');

    return;
  }

  if (Array.isArray(item.tool_calls)) {
    item.tool_calls.forEach(toolCall => {
      const record = asRecord(toolCall);

      if (!record) {
        return;
      }

      upsertToolCall(items, pendingById, getToolCallName(record), getToolCallId(record), '');
    });
  }

  if ('function_call_output' === type || 'tool_result' === type || 'tool' === role) {
    upsertToolCall(
      items,
      pendingById,
      getToolCallName(item),
      getToolCallId(item),
      getToolCallOutput(item),
    );

    return;
  }

  const text = collectMessageText(item).trim();

  if (!text) {
    return;
  }

  if (isSystemRole(role) || 'system' === type) {
    items.push({
      kind: 'system',
      content: text,
    });

    return;
  }

  if (isUserRole(role) || 'user' === type) {
    items.push({
      kind: 'user',
      content: text,
    });
  }
};

const collectInputItems = (payload: PayloadRecord): PayloadFocusItem[] => {
  const items: PayloadFocusItem[] = [];
  const pendingById = new Map<string, PayloadFocusToolCall>();
  const instructions = asTrimmedString(payload.instructions);

  if (instructions) {
    items.push({
      kind: 'system',
      content: instructions,
    });
  }

  if (Array.isArray(payload.input)) {
    payload.input.forEach(value => appendInputItem(items, pendingById, value));
  } else if ('string' === typeof payload.input && payload.input.trim()) {
    items.push({
      kind: 'user',
      content: payload.input,
    });
  } else if ('string' === typeof payload.prompt && payload.prompt.trim()) {
    items.push({
      kind: 'user',
      content: payload.prompt,
    });
  }

  return items;
};

/**
 * Reduces a captured inference request body to the fields that matter in Focus view.
 */
export const extractInferencePayloadFocus = (
  requestBody: string | null | undefined,
): InferencePayloadFocus => {
  const payload = parsePayload(requestBody ?? '');

  if (!payload) {
    return {
      model: null,
      tools: null,
      items: [],
      isParsed: false,
    };
  }

  return {
    model: asTrimmedString(payload.model),
    tools: Object.prototype.hasOwnProperty.call(payload, 'tools')
      ? extractToolNames(payload.tools)
      : null,
    items: collectInputItems(payload),
    isParsed: true,
  };
};
