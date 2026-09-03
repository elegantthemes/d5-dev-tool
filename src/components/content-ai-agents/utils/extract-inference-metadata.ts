// Local dependencies.
import { type NetworkRecord } from './network-recorder';

type PayloadMessage = {
  role?: string;
  type?: string;
  content?: string | Array<{ type?: string; text?: string }>;
};

type ParsedPayload = {
  model?: string;
  input?: PayloadMessage[];
  prompt?: string;
  placement?: string;
  scope?: string;
  streamProgress?: boolean;
};

export type InferenceCaller =
  | 'planner'
  | 'planner-scope'
  | 'agent'
  | 'sub-agent'
  | 'ask'
  | 'tool-router'
  | 'layout'
  | 'unknown';

const CALLER_PATTERNS: Array<{ id: InferenceCaller; pattern: RegExp }> = [
  { id: 'sub-agent', pattern: /You are a focused Divi 5 sub agent/i },
  { id: 'planner', pattern: /You are a Divi 5 website planner/i },
  { id: 'planner-scope', pattern: /planner-scope (?:classifier|filter)/i },
  { id: 'ask', pattern: /You are the Divi AI Agent in Ask mode/i },
  { id: 'tool-router', pattern: /tool-routing classifier/i },
  { id: 'agent', pattern: /You are the Divi 5 expert/i },
];

const parsePayload = (requestBody: string | null): ParsedPayload | null => {
  if (!requestBody?.trim()) {
    return null;
  }

  try {
    return JSON.parse(requestBody) as ParsedPayload;
  } catch {
    return null;
  }
};

const collectMessageText = (message: PayloadMessage): string => {
  const { content } = message;

  if ('string' === typeof content) {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map(item => ('string' === typeof item.text ? item.text : ''))
    .join('\n');
};

const isGenerateLayoutPayload = (payload: ParsedPayload | null): boolean => {
  if (!payload || payload.input) {
    return false;
  }

  return 'string' === typeof payload.prompt && (
    'string' === typeof payload.placement
    || 'string' === typeof payload.scope
    || 'boolean' === typeof payload.streamProgress
  );
};

const isInstructionRole = (role?: string): boolean => (
  'system' === role || 'developer' === role
);

const isUserRole = (role?: string): boolean => 'user' === role;

/**
 * Reads the first user-turn text from a captured inference payload.
 *
 * Sub-agent invokes put the self-contained task goal in that user message.
 */
export const extractInferenceUserText = (requestBody: string | null): string => {
  const payload = parsePayload(requestBody);

  if (!payload?.input) {
    return '';
  }

  for (const message of payload.input) {
    if (!isUserRole(message.role)) {
      continue;
    }

    const text = collectMessageText(message).trim();

    if (text) {
      return text;
    }
  }

  return '';
};

/**
 * Classifies which runtime invoked the captured inference request.
 *
 * Build-mode no longer routes to predefined specialists. Requests come from the
 * planner, the parent execution agent, a focused sub-agent, Ask mode, or a
 * classifier/layout helper.
 */
export const extractInferenceCaller = (
  requestBody: string | null,
  url?: string | null,
): InferenceCaller => {
  if (url && /generate-layout/i.test(url)) {
    return 'layout';
  }

  const payload = parsePayload(requestBody);

  if (isGenerateLayoutPayload(payload)) {
    return 'layout';
  }

  if (!payload?.input) {
    return 'unknown';
  }

  for (const message of payload.input) {
    if (!isInstructionRole(message.role)) {
      continue;
    }

    const text = collectMessageText(message);

    if (!text) {
      continue;
    }

    const match = CALLER_PATTERNS.find(({ pattern }) => pattern.test(text));

    if (match) {
      return match.id;
    }
  }

  return 'unknown';
};

/**
 * @deprecated Use `extractInferenceCaller`. Kept for callers that still expect
 * a string agent id; now returns the runtime caller, not a specialist name.
 */
export const extractInferenceAgent = (
  requestBody: string | null,
  url?: string | null,
): string => extractInferenceCaller(requestBody, url);

/**
 * Returns the sub-agent task goal when this request was made by a sub-agent.
 */
export const extractInferenceSubAgentGoal = (
  requestBody: string | null,
  url?: string | null,
): string => {
  if ('sub-agent' !== extractInferenceCaller(requestBody, url)) {
    return '';
  }

  return extractInferenceUserText(requestBody);
};

const extractResolvedModelFromText = (text: string): string | null => {
  if (!text.trim()) {
    return null;
  }

  let resolvedModel: string | null = null;

  const considerModel = (model: string | undefined): void => {
    if (model?.trim()) {
      resolvedModel = model.trim();
    }
  };

  try {
    const parsed = JSON.parse(text) as { model?: string; response?: { model?: string } };

    considerModel(parsed.response?.model ?? parsed.model);
  } catch {
    // Not a single JSON document — fall through to SSE parsing.
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

    try {
      const parsed = JSON.parse(payload) as {
        model?: string;
        response?: { model?: string };
      };

      considerModel(parsed.response?.model ?? parsed.model);
    } catch {
      // Ignore malformed stream chunks.
    }
  });

  return resolvedModel;
};

/**
 * Reads the model requested in the inference payload.
 */
export const extractRequestModel = (requestBody: string | null): string | null => {
  const payload = parsePayload(requestBody);
  const model = payload?.model?.trim();

  return model || null;
};

/**
 * Reads the resolved model reported by the inference response body.
 */
export const extractResponseModel = (
  responseBody: string | null | undefined,
): string | null => extractResolvedModelFromText(responseBody ?? '');

/**
 * Returns true once the recorder has the final response body for a request.
 */
export const isInferenceRecordComplete = (record: NetworkRecord): boolean => (
  null !== record.endedAt && !record.error
);

/**
 * Reads the requested model from the payload and prefers the resolved model
 * reported in the inference response when available.
 */
export const extractInferenceModel = (
  requestBody: string | null,
  responseBody: string | null | undefined,
): string => {
  const responseModel = extractResponseModel(responseBody);
  const requestModel = extractRequestModel(requestBody);

  return responseModel ?? requestModel ?? 'unknown';
};

export type InferenceRecordMetadata = {
  caller: InferenceCaller;
  subAgent: string;
  model: string;
};

/**
 * Extracts caller, sub-agent goal, and model metadata from a captured request.
 */
export const extractInferenceMetadata = (
  record: NetworkRecord,
): InferenceRecordMetadata => ({
  caller: extractInferenceCaller(record.requestBody, record.url),
  subAgent: extractInferenceSubAgentGoal(record.requestBody, record.url),
  model: extractInferenceModel(record.requestBody, record.responseBody),
});
