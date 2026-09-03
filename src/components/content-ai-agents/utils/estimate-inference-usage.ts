// Local dependencies.
import { countTokens } from './count-tokens';
import type { InferenceUsage } from './extract-inference-usage';

type BillableContent = {
  text: string;
  imageCount: number;
};

// High-detail 1024px screenshot estimate used by OpenAI vision (85 + 4 * 170).
const ESTIMATED_IMAGE_TOKENS = 765;
const MIN_BASE64_LENGTH = 256;
const DATA_URL_PATTERN = /data:[^;]+;base64,[A-Za-z0-9+/=\s]+/gi;
const DATA_URL_PREFIX = /^data:[^;]+;base64,/i;
const LONG_BASE64_PATTERN = /^[A-Za-z0-9+/=\s]+$/;
const RECORDER_PLACEHOLDER_PATTERN = /^\[(?:FormData|Blob |ArrayBuffer |Unreadable |Empty |Response |Stream )/;

const isBinaryPayload = (value: string): boolean => {
  if (DATA_URL_PREFIX.test(value)) {
    return true;
  }

  return MIN_BASE64_LENGTH <= value.length && LONG_BASE64_PATTERN.test(value.trim());
};

const isRecorderPlaceholder = (body: string): boolean => RECORDER_PLACEHOLDER_PATTERN.test(body);

const parseJsonOrNull = (text: string): unknown | null => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const collectFromValue = (
  value: unknown,
  texts: string[],
  imageCount: { current: number },
): void => {
  if ('string' === typeof value) {
    if (isBinaryPayload(value)) {
      imageCount.current += 1;

      return;
    }

    if (value.trim()) {
      texts.push(value);
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectFromValue(item, texts, imageCount));

    return;
  }

  if (value && 'object' === typeof value) {
    Object.values(value as Record<string, unknown>).forEach(item => (
      collectFromValue(item, texts, imageCount)
    ));
  }
};

const collectFromSse = (text: string): BillableContent => {
  const texts: string[] = [];
  const imageCount = { current: 0 };

  text.split('\n').forEach(line => {
    const trimmed = line.trim();

    if (!trimmed || '[DONE]' === trimmed) {
      return;
    }

    const payload = trimmed.startsWith('data: ') ? trimmed.slice(6).trim() : trimmed;

    if (!payload.startsWith('{')) {
      return;
    }

    const parsed = parseJsonOrNull(payload);

    if (null !== parsed) {
      collectFromValue(parsed, texts, imageCount);
    }
  });

  return {
    text: texts.join('\n'),
    imageCount: imageCount.current,
  };
};

const stripBinaryPayloads = (text: string): BillableContent => {
  let imageCount = 0;
  const stripped = text.replace(DATA_URL_PATTERN, () => {
    imageCount += 1;

    return '';
  });

  return {
    text: stripped,
    imageCount,
  };
};

/**
 * Collects billable text and image attachments from a captured request or
 * response body. Data URLs and long base64 blobs are counted as images so they
 * are not tokenized as raw text.
 */
export const collectBillableContent = (body: string | null | undefined): BillableContent => {
  const trimmed = body?.trim() ?? '';

  if (!trimmed || isRecorderPlaceholder(trimmed)) {
    return {
      text: '',
      imageCount: 0,
    };
  }

  const parsed = parseJsonOrNull(trimmed);

  if (null !== parsed) {
    const texts: string[] = [];
    const imageCount = { current: 0 };

    collectFromValue(parsed, texts, imageCount);

    return {
      text: texts.join('\n'),
      imageCount: imageCount.current,
    };
  }

  if (trimmed.includes('data: ')) {
    const sseContent = collectFromSse(trimmed);

    if (sseContent.text || 0 < sseContent.imageCount) {
      return sseContent;
    }
  }

  return stripBinaryPayloads(trimmed);
};

const countBillableTokens = (content: BillableContent): number => (
  countTokens(content.text) + (content.imageCount * ESTIMATED_IMAGE_TOKENS)
);

/**
 * Estimates token usage from captured request and response bodies when the
 * provider does not report a `usage` block (for example `generate_layout`).
 */
export const estimateInferenceUsage = (
  requestBody: string | null | undefined,
  responseBody: string | null | undefined,
): InferenceUsage | null => {
  const payload = collectBillableContent(requestBody);
  const response = collectBillableContent(responseBody);
  const inputTokens = countBillableTokens(payload);
  const outputTokens = countBillableTokens(response);

  if (0 === inputTokens && 0 === outputTokens) {
    return null;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    cost: null,
    isEstimated: true,
  };
};
