// Local dependencies.
import { type NetworkRecord } from './network-recorder';

type PayloadMessage = {
  role?: string;
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

const AGENT_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: 'planner', pattern: /website planner/i },
  { id: 'module', pattern: /module agent|module specialist/i },
  { id: 'context', pattern: /Context Agent/i },
  { id: 'settings', pattern: /Settings Agent|settings specialist/i },
  { id: 'ui', pattern: /UI Agent|interface specialist/i },
  { id: 'outside_vb', pattern: /Outside-VB Agent|outside-VB specialist/i },
  { id: 'preset', pattern: /Preset Agent|preset specialist/i },
  { id: 'ask', pattern: /Ask mode/i },
  { id: 'tool-router', pattern: /tool-routing classifier/i },
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

/**
 * Infers the Divi agent from the captured request payload system/developer text.
 */
export const extractInferenceAgent = (
  requestBody: string | null,
  url?: string | null,
): string => {
  if (url && /generate-layout/i.test(url)) {
    return 'module';
  }

  const payload = parsePayload(requestBody);

  if (isGenerateLayoutPayload(payload)) {
    return 'module';
  }

  if (!payload?.input) {
    return 'unknown';
  }

  for (const message of payload.input) {
    if ('system' !== message.role && 'developer' !== message.role) {
      continue;
    }

    const text = collectMessageText(message);

    if (!text) {
      continue;
    }

    const match = AGENT_PATTERNS.find(({ pattern }) => pattern.test(text));

    if (match) {
      return match.id;
    }
  }

  return 'unknown';
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
  agent: string;
  model: string;
};

/**
 * Extracts agent and model metadata from a captured inference request.
 */
export const extractInferenceMetadata = (
  record: NetworkRecord,
): InferenceRecordMetadata => ({
  agent: extractInferenceAgent(record.requestBody, record.url),
  model: extractInferenceModel(record.requestBody, record.responseBody),
});
