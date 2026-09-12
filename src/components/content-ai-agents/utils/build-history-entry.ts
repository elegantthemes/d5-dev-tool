// Local dependencies.
import { extractInferenceMetadata } from './extract-inference-metadata';
import { resolveInferenceUsage } from './extract-inference-usage';
import {
  HISTORY_SCHEMA_VERSION,
  type CapturedRequest,
  type HistoryEntry,
} from './history-store';
import { type NetworkRecord } from './network-recorder';
import { segmentPayload } from './segment-payload';

/**
 * Builds a persisted request snapshot from a settled network record.
 */
export const buildCapturedRequest = (
  record: NetworkRecord,
  ordinal: number,
): CapturedRequest => {
  const segments = segmentPayload(record.requestBody);
  const usage = resolveInferenceUsage(record.requestBody, record.responseBody);
  const { caller, model } = extractInferenceMetadata(record);
  const payloadTokens = usage?.inputTokens
    ?? segments.reduce((sum, segment) => sum + segment.tokensEst, 0);
  const responseTokens = usage?.outputTokens ?? 0;

  return {
    id: record.id,
    ordinal,
    startedAt: record.startedAt,
    durationMs: record.durationMs,
    caller,
    model,
    segments,
    responseBody: record.responseBody,
    payloadTokens,
    responseTokens,
  };
};

/**
 * Keeps already-saved requests when the live recorder has dropped earlier LLM
 * calls. Incoming copies win so a later stream settlement can fill in bodies.
 */
export const mergeHistoryEntry = (
  existing: HistoryEntry | null,
  incoming: HistoryEntry,
): HistoryEntry => {
  if (null === existing || existing.id !== incoming.id) {
    return incoming;
  }

  const byId = new Map<string, CapturedRequest>();

  existing.requests.forEach(request => {
    byId.set(request.id, request);
  });
  incoming.requests.forEach(request => {
    byId.set(request.id, request);
  });

  const requests = Array.from(byId.values())
    .sort((left, right) => left.startedAt - right.startedAt)
    .map((request, index) => ({
      ...request,
      ordinal: index + 1,
    }));
  const totalTokens = requests.reduce(
    (sum, request) => sum + request.payloadTokens + request.responseTokens,
    0,
  );
  const lastRequest = requests[requests.length - 1];

  return {
    ...incoming,
    createdAt: existing.createdAt,
    description: incoming.description ?? existing.description,
    model: lastRequest?.model ?? incoming.model,
    requestCount: requests.length,
    totalTokens,
    requests,
  };
};

/**
 * Builds a persisted run from the settled inference requests of one chat turn.
 */
export const buildHistoryEntry = ({
  id,
  chatId,
  promptText,
  createdAt,
  records,
}: {
  id: string;
  chatId: string;
  promptText: string;
  createdAt?: number;
  records: NetworkRecord[];
}): HistoryEntry => {
  const now = Date.now();
  const requests = records.map((record, index) => buildCapturedRequest(record, index + 1));
  const totalTokens = requests.reduce(
    (sum, request) => sum + request.payloadTokens + request.responseTokens,
    0,
  );
  const lastRequest = requests[requests.length - 1];

  return {
    id,
    chatId,
    promptText,
    createdAt: createdAt ?? now,
    updatedAt: now,
    model: lastRequest?.model ?? 'unknown',
    requestCount: requests.length,
    totalTokens,
    requests,
    schemaVersion: HISTORY_SCHEMA_VERSION,
  };
};
