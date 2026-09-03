// Local dependencies.
import {
  OPEN_ROUTER_MODEL_ALIASES,
  OPEN_ROUTER_MODEL_PRICING,
  type OpenRouterModelPricing,
} from '../constants/open-router-model-pricing';
import {
  extractRequestModel,
  extractResponseModel,
} from './extract-inference-metadata';

export type InferenceCostBreakdown = {
  payloadCost: number | null;
  responseCost: number | null;
  totalCost: number | null;
};

const buildModelCandidates = (modelId: string): string[] => {
  const trimmed = modelId.trim();

  if (!trimmed) {
    return [];
  }

  const candidates = new Set<string>([trimmed]);

  if (trimmed.startsWith('~')) {
    candidates.add(trimmed.slice(1));

    const aliasTarget = OPEN_ROUTER_MODEL_ALIASES[trimmed];

    if (aliasTarget) {
      candidates.add(aliasTarget);
    }
  }

  if (!trimmed.includes('/')) {
    candidates.add(`openai/${trimmed}`);
  }

  return Array.from(candidates);
};

const uniqueModels = (models: Array<string | null | undefined>): string[] => {
  const seen = new Set<string>();

  return models.reduce<string[]>((resolved, model) => {
    const trimmed = model?.trim();

    if (!trimmed || seen.has(trimmed)) {
      return resolved;
    }

    seen.add(trimmed);

    return resolved.concat(trimmed);
  }, []);
};

/**
 * Resolves Open Router per-token pricing for a model id or alias.
 */
export const getOpenRouterModelPricing = (
  modelId: string,
): OpenRouterModelPricing | null => {
  for (const candidate of buildModelCandidates(modelId)) {
    const pricing = OPEN_ROUTER_MODEL_PRICING[candidate];

    if (pricing) {
      return pricing;
    }
  }

  return null;
};

/**
 * Picks the first model identifier that has a known Open Router price.
 *
 * Response models are preferred, but payload aliases are used while a stream
 * is still in flight or when the resolved model is not present in pricing yet.
 */
export const resolveInferencePricingModel = (
  requestBody: string | null,
  responseBody: string | null | undefined,
): string | null => {
  const candidates = uniqueModels([
    extractResponseModel(responseBody),
    extractRequestModel(requestBody),
  ]);

  for (const candidate of candidates) {
    if (getOpenRouterModelPricing(candidate)) {
      return candidate;
    }
  }

  return candidates[0] ?? null;
};

/**
 * Calculates USD cost from token counts and Open Router per-token rates.
 */
export const calculateOpenRouterCost = (
  inputTokens: number,
  outputTokens: number,
  modelId: string | null | undefined,
): number | null => {
  if (!modelId) {
    return null;
  }

  const pricing = getOpenRouterModelPricing(modelId);

  if (!pricing) {
    return null;
  }

  return (inputTokens * pricing.prompt) + (outputTokens * pricing.completion);
};

const splitReportedCost = (
  inputTokens: number,
  outputTokens: number,
  reportedTotalCost: number,
): InferenceCostBreakdown => {
  const totalTokens = inputTokens + outputTokens;

  if (0 >= totalTokens) {
    return {
      payloadCost: reportedTotalCost,
      responseCost: null,
      totalCost: reportedTotalCost,
    };
  }

  const payloadShare = inputTokens / totalTokens;
  const responseShare = outputTokens / totalTokens;

  return {
    payloadCost: reportedTotalCost * payloadShare,
    responseCost: reportedTotalCost * responseShare,
    totalCost: reportedTotalCost,
  };
};

/**
 * Estimates per-request costs from Open Router pricing, falling back to the
 * upstream `usage.cost` reported in a completed inference response.
 */
export const calculateInferenceCosts = ({
  inputTokens,
  outputTokens,
  requestBody,
  responseBody,
  reportedTotalCost = null,
}: {
  inputTokens: number;
  outputTokens: number;
  requestBody: string | null;
  responseBody: string | null | undefined;
  reportedTotalCost?: number | null;
}): InferenceCostBreakdown => {
  const pricingModel = resolveInferencePricingModel(requestBody, responseBody);

  if (pricingModel) {
    const payloadCost = calculateOpenRouterCost(inputTokens, 0, pricingModel);
    const responseCost = calculateOpenRouterCost(0, outputTokens, pricingModel);
    const totalCost = calculateOpenRouterCost(inputTokens, outputTokens, pricingModel);

    if (null !== totalCost) {
      return {
        payloadCost,
        responseCost,
        totalCost,
      };
    }
  }

  if (null !== reportedTotalCost) {
    return splitReportedCost(inputTokens, outputTokens, reportedTotalCost);
  }

  return {
    payloadCost: null,
    responseCost: null,
    totalCost: null,
  };
};

/**
 * Formats a USD amount for display in the summary table.
 */
export const formatUsdCost = (cost: number | null): string => {
  if (null === cost || Number.isNaN(cost)) {
    return '—';
  }

  if (0 === cost) {
    return '$0.00';
  }

  if (0.01 <= cost) {
    return `$${cost.toFixed(4)}`;
  }

  return `$${cost.toFixed(6)}`;
};
