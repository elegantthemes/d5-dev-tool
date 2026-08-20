// Local dependencies.
import { type NetworkRecord } from './network-recorder';

export type InferenceUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

type RawUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
};

const normalizeUsage = (usage: RawUsage): InferenceUsage | null => {
  const inputTokens = usage.input_tokens;
  const outputTokens = usage.output_tokens;
  const totalTokens = usage.total_tokens;

  if (
    'number' !== typeof inputTokens
    && 'number' !== typeof outputTokens
    && 'number' !== typeof totalTokens
  ) {
    return null;
  }

  const resolvedInput = inputTokens ?? 0;
  const resolvedOutput = outputTokens ?? 0;

  return {
    inputTokens: resolvedInput,
    outputTokens: resolvedOutput,
    totalTokens: totalTokens ?? (resolvedInput + resolvedOutput),
  };
};

const collectUsagesFromText = (text: string): InferenceUsage[] => {
  const usages: InferenceUsage[] = [];

  if (!text.trim()) {
    return usages;
  }

  try {
    const parsed = JSON.parse(text) as { usage?: RawUsage; response?: { usage?: RawUsage } };
    const usage = normalizeUsage(parsed.usage ?? parsed.response?.usage ?? {});

    if (usage) {
      usages.push(usage);
    }
  } catch {
    // Not a single JSON document — fall through to SSE / embedded usage parsing.
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
      const parsed = JSON.parse(payload) as { usage?: RawUsage; response?: { usage?: RawUsage } };
      const usage = normalizeUsage(parsed.response?.usage ?? parsed.usage ?? {});

      if (usage) {
        usages.push(usage);
      }
    } catch {
      // Ignore malformed stream chunks.
    }
  });

  return usages;
};

/**
 * Reads the final `usage` block from a captured LLM inference response body.
 *
 * Streaming responses may emit usage multiple times; the highest `total_tokens`
 * value is treated as the completed request usage.
 */
export const extractInferenceUsage = (
  responseBody: string | null | undefined,
): InferenceUsage | null => {
  const usages = collectUsagesFromText(responseBody ?? '');

  if (0 === usages.length) {
    return null;
  }

  return usages.reduce((latest, usage) => (
    usage.totalTokens > latest.totalTokens ? usage : latest
  ));
};

/**
 * Sums token usage across every captured LLM inference request.
 */
export const sumInferenceUsage = (records: NetworkRecord[]): InferenceUsage => (
  records.reduce<InferenceUsage>((totals, record) => {
    const usage = extractInferenceUsage(record.responseBody);

    if (!usage) {
      return totals;
    }

    return {
      inputTokens: totals.inputTokens + usage.inputTokens,
      outputTokens: totals.outputTokens + usage.outputTokens,
      totalTokens: totals.totalTokens + usage.totalTokens,
    };
  }, {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  })
);
