// Local dependencies.
import {
  extractInferenceMetadata,
  isInferenceRecordComplete,
} from './extract-inference-metadata';
import { extractInferenceUsage } from './extract-inference-usage';
import { calculateInferenceCosts } from './open-router-pricing';
import { type NetworkRecord } from './network-recorder';

export type InferenceSummaryRow = {
  requestNumber: number;
  recordId: string;
  agent: string;
  model: string;
  payloadTokens: number;
  payloadCost: number | null;
  responseTokens: number;
  responseCost: number | null;
  totalTokens: number;
  totalCost: number | null;
  isComplete: boolean;
};

export type InferenceSummaryTotals = {
  payloadTokens: number;
  payloadCost: number;
  responseTokens: number;
  responseCost: number;
  totalTokens: number;
  totalCost: number;
  hasUnknownPricing: boolean;
};

export type InferenceSummary = {
  rows: InferenceSummaryRow[];
  totals: InferenceSummaryTotals;
};

export const getLlmInferenceRequestElementId = (requestNumber: number): string => (
  `d5-dev-tool-llm-inference-request-${requestNumber}`
);

/**
 * Scrolls the modal panel to a captured inference request section.
 */
export const scrollToLlmInferenceRequest = (requestNumber: number): void => {
  document.getElementById(getLlmInferenceRequestElementId(requestNumber))?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
};

/**
 * Builds token and cost summary data for one captured inference request.
 */
export const buildInferenceRecordSummary = (
  record: NetworkRecord,
  requestNumber: number,
): InferenceSummaryRow => {
  const isComplete = isInferenceRecordComplete(record);
  const { agent, model } = extractInferenceMetadata(record);
  const usage = extractInferenceUsage(record.responseBody);
  const inputTokens = usage?.inputTokens ?? 0;
  const outputTokens = usage?.outputTokens ?? 0;
  const totalTokens = usage?.totalTokens ?? (inputTokens + outputTokens);
  const costs = calculateInferenceCosts({
    inputTokens,
    outputTokens,
    requestBody: record.requestBody,
    responseBody: record.responseBody,
    reportedTotalCost: isComplete ? (usage?.cost ?? null) : null,
  });

  return {
    requestNumber,
    recordId: record.id,
    agent,
    model,
    payloadTokens: inputTokens,
    payloadCost: costs.payloadCost,
    responseTokens: outputTokens,
    responseCost: costs.responseCost,
    totalTokens,
    totalCost: costs.totalCost,
    isComplete,
  };
};

/**
 * Summarizes every captured inference request with Open Router cost estimates.
 */
export const summarizeInferenceRecords = (records: NetworkRecord[]): InferenceSummary => {
  const rows = records.map((record, index) => buildInferenceRecordSummary(record, index + 1));
  let hasUnknownPricing = false;

  const totals = rows.reduce<InferenceSummaryTotals>((accumulator, row) => {
    if (
      row.isComplete
      && (
        null === row.payloadCost
        || null === row.responseCost
        || null === row.totalCost
      )
    ) {
      hasUnknownPricing = true;
    }

    return {
      payloadTokens: accumulator.payloadTokens + row.payloadTokens,
      payloadCost: accumulator.payloadCost + (row.payloadCost ?? 0),
      responseTokens: accumulator.responseTokens + row.responseTokens,
      responseCost: accumulator.responseCost + (row.responseCost ?? 0),
      totalTokens: accumulator.totalTokens + row.totalTokens,
      totalCost: accumulator.totalCost + (row.totalCost ?? 0),
      hasUnknownPricing,
    };
  }, {
    payloadTokens: 0,
    payloadCost: 0,
    responseTokens: 0,
    responseCost: 0,
    totalTokens: 0,
    totalCost: 0,
    hasUnknownPricing: false,
  });

  return {
    rows,
    totals,
  };
};
