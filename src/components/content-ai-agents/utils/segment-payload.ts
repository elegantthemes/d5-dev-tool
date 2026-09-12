// Local dependencies.
import { countTokens } from './count-tokens';
import {
  collectMessageText,
  parsePayload,
  type PayloadMessage,
} from './extract-inference-metadata';

export type PayloadSegment = {
  index: number;
  role: string;
  label: string;
  text: string;
  hash: string;
  tokensEst: number;
};

type PayloadItem = PayloadMessage & {
  prompt?: string;
};

const TOOL_DEFS_JSON_PATTERN = /"type"\s*:\s*"function"/;
const TOOL_DEFS_HEADING_PATTERN = /^(?:available tools|tool definitions)\b/i;
const CHAT_CONTEXT_PATTERN = /\[CHAT CONTEXT\]/i;

/**
 * FNV-1a 32-bit hash. Stable across sessions without a crypto dependency.
 */
export const hashString = (value: string): string => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
};

const flattenPayloadItem = (item: PayloadItem): string => {
  const contentText = collectMessageText(item).trim();

  if (contentText) {
    return contentText;
  }

  if ('string' === typeof item.output && item.output.trim()) {
    return item.output;
  }

  if ('string' === typeof item.arguments && item.arguments.trim()) {
    return [item.name, item.arguments].filter(Boolean).join('\n');
  }

  if ('string' === typeof item.prompt && item.prompt.trim()) {
    return item.prompt;
  }

  return '';
};

const resolveRole = (item: PayloadItem): string => {
  if (item.role?.trim()) {
    return item.role.trim().toLowerCase();
  }

  const type = item.type?.trim().toLowerCase() ?? '';

  if ('function_call' === type || 'tool_call' === type) {
    return 'assistant';
  }

  if ('function_call_output' === type || 'tool_result' === type) {
    return 'tool';
  }

  return type || 'unknown';
};

const looksLikeToolDefs = (text: string): boolean => {
  const trimmed = text.trim();

  if (/^[\[{]/.test(trimmed) && TOOL_DEFS_JSON_PATTERN.test(trimmed)) {
    return true;
  }

  return TOOL_DEFS_HEADING_PATTERN.test(trimmed);
};

const lastIndexWhere = (items: PayloadItem[], predicate: (item: PayloadItem) => boolean): number => {
  for (let index = items.length - 1; 0 <= index; index -= 1) {
    if (predicate(items[index])) {
      return index;
    }
  }

  return -1;
};

const hasLaterUserMessage = (items: PayloadItem[], index: number): boolean => {
  for (let cursor = index + 1; cursor < items.length; cursor += 1) {
    if ('user' === resolveRole(items[cursor])) {
      return true;
    }
  }

  return false;
};

/**
 * Derives a short structural label for one payload message.
 */
export const deriveSegmentLabel = (
  item: PayloadItem,
  index: number,
  items: PayloadItem[],
): string => {
  const role = resolveRole(item);
  const type = item.type?.trim().toLowerCase() ?? '';
  const text = flattenPayloadItem(item);

  if ('function_call_output' === type || 'tool_result' === type || 'tool' === role || 'function' === role) {
    return 'Tool result';
  }

  if ('function_call' === type || 'tool_call' === type) {
    return 'Tool call';
  }

  if ('assistant' === role) {
    if (/^\s*(?:function_call|tool_call)\b/i.test(text) || /"type"\s*:\s*"function_call"/.test(text)) {
      return 'Tool call';
    }

    return hasLaterUserMessage(items, index) ? 'Chat history' : 'Assistant turn';
  }

  if ('user' === role) {
    const lastUserIndex = lastIndexWhere(items, candidate => 'user' === resolveRole(candidate));

    return index === lastUserIndex ? 'User turn' : 'Chat history';
  }

  if ('system' === role || 'developer' === role) {
    if (looksLikeToolDefs(text)) {
      return 'Tool defs';
    }

    if (CHAT_CONTEXT_PATTERN.test(text)) {
      return 'Chat context';
    }

    return 'System / Rules';
  }

  return role || 'Unknown';
};

const buildSegment = (
  index: number,
  role: string,
  label: string,
  text: string,
): PayloadSegment => ({
  index,
  role,
  label,
  text,
  hash: hashString(`${role}\0${text}`),
  tokensEst: countTokens(text),
});

const segmentRawPrompt = (text: string): PayloadSegment[] => [
  buildSegment(0, 'user', 'Raw prompt', text),
];

/**
 * Splits a captured inference request body into labeled, hashable segments.
 *
 * `input[]` messages are the primary segmentation. generate-layout and other
 * non-`input` payloads collapse to a single raw-prompt block.
 */
export const segmentPayload = (requestBody: string | null | undefined): PayloadSegment[] => {
  const raw = requestBody?.trim() ?? '';

  if (!raw) {
    return [];
  }

  const payload = parsePayload(raw);

  if (!payload) {
    return segmentRawPrompt(raw);
  }

  if (Array.isArray(payload.input) && 0 < payload.input.length) {
    return payload.input.map((item, index) => {
      const role = resolveRole(item);
      const text = flattenPayloadItem(item);
      const label = deriveSegmentLabel(item, index, payload.input ?? []);

      return buildSegment(index, role, label, text);
    });
  }

  if ('string' === typeof payload.prompt) {
    return segmentRawPrompt(payload.prompt);
  }

  return segmentRawPrompt(raw);
};
