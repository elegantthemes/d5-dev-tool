// Local dependencies.
import {
  attributeCause,
  type CauseAttribution,
} from './attribute-cause';
import { diffSegments } from './diff-segments';
import { type CapturedRequest, type HistoryEntry } from './history-store';
import { type PayloadSegment } from './segment-payload';

export const SPIKE_MAD_K = 3;
export const RECORDER_PLACEHOLDER_PATTERN = /^\[(?:FormData|Blob |ArrayBuffer |Unreadable |Empty |Response |Stream )/;

export type SegmentLineage = {
  hash: string;
  role: string;
  label: string;
  firstOrdinal: number;
  lastOrdinal: number;
  occurrences: number;
  tokensEst: number;
  carriedTokenCost: number;
  presentOrdinals: number[];
};

export type RequestDelta = {
  ordinal: number;
  payloadTokens: number;
  responseTokens: number;
  payloadDelta: number;
  responseDelta: number;
  payloadSpikeScore: number;
  responseSpikeScore: number;
  addedTokens: number;
  modifiedTokens: number;
  carriedTokens: number;
  topCause: CauseAttribution | null;
  causes: CauseAttribution[];
  payloadIsSpike: boolean;
  responseIsSpike: boolean;
  responseTokensKnown: boolean;
};

export type RunAnalysis = {
  requests: RequestDelta[];
  lineages: SegmentLineage[];
  ballastTokens: number;
  peakPayloadOrdinal: number;
  spikeOrdinals: number[];
  totalRedundancyRatio: number;
};

const lineageKey = (role: string, hash: string): string => `${role}\0${hash}`;

const median = (values: number[]): number => {
  if (0 === values.length) {
    return 0;
  }

  const sorted = values.slice().sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (0 === (sorted.length % 2)) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
};

const medianAbsoluteDeviation = (values: number[], center: number): number => (
  median(values.map(value => Math.abs(value - center)))
);

const spikeScore = (value: number, center: number, deviation: number): number => {
  if (0 === deviation) {
    return 0;
  }

  return (value - center) / deviation;
};

const isUpperSpike = (value: number, center: number, deviation: number, k: number): boolean => {
  if (0 === deviation) {
    return false;
  }

  return value > center + (k * deviation);
};

/**
 * True when output size is missing rather than a real zero (SSE-only / empty).
 */
export const isResponseTokensKnown = (request: CapturedRequest): boolean => {
  if (0 < request.responseTokens) {
    return true;
  }

  const body = request.responseBody?.trim() ?? '';

  if (!body || RECORDER_PLACEHOLDER_PATTERN.test(body)) {
    return false;
  }

  return true;
};

const buildLineages = (requests: CapturedRequest[]): SegmentLineage[] => {
  const byKey = new Map<string, SegmentLineage>();

  requests.forEach(request => {
    const seenThisRequest = new Set<string>();

    request.segments.forEach((segment: PayloadSegment) => {
      const key = lineageKey(segment.role, segment.hash);

      if (seenThisRequest.has(key)) {
        return;
      }

      seenThisRequest.add(key);

      const existing = byKey.get(key);

      if (!existing) {
        byKey.set(key, {
          hash: segment.hash,
          role: segment.role,
          label: segment.label,
          firstOrdinal: request.ordinal,
          lastOrdinal: request.ordinal,
          occurrences: 1,
          tokensEst: segment.tokensEst,
          carriedTokenCost: 0,
          presentOrdinals: [request.ordinal],
        });

        return;
      }

      existing.lastOrdinal = request.ordinal;
      existing.occurrences += 1;
      existing.presentOrdinals = existing.presentOrdinals.concat([request.ordinal]);
      existing.carriedTokenCost = existing.tokensEst * (existing.occurrences - 1);
    });
  });

  return Array.from(byKey.values()).sort((left, right) => {
    if (right.carriedTokenCost !== left.carriedTokenCost) {
      return right.carriedTokenCost - left.carriedTokenCost;
    }

    if (right.tokensEst !== left.tokensEst) {
      return right.tokensEst - left.tokensEst;
    }

    return left.firstOrdinal - right.firstOrdinal;
  });
};

const rankCauses = (
  current: ReturnType<typeof diffSegments>['current'],
  caller: CapturedRequest['caller'],
): CauseAttribution[] => {
  const ranked = current
    .filter(item => 'added' === item.change || 'modified' === item.change)
    .map(item => attributeCause(item, caller))
    .filter(cause => 0 < cause.tokens)
    .sort((left, right) => right.tokens - left.tokens);

  return ranked;
};

const buildRequestDelta = (
  request: CapturedRequest,
  previous: CapturedRequest | null,
): Omit<RequestDelta, 'payloadSpikeScore' | 'responseSpikeScore' | 'payloadIsSpike' | 'responseIsSpike'> => {
  const diff = diffSegments(previous?.segments ?? [], request.segments);
  const addedTokens = diff.current
    .filter(item => 'added' === item.change)
    .reduce((sum, item) => sum + item.segment.tokensEst, 0);
  const modifiedTokens = diff.current
    .filter(item => 'modified' === item.change)
    .reduce((sum, item) => sum + Math.max(0, item.segment.tokensEst - (item.previous?.tokensEst ?? 0)), 0);
  const carriedTokens = diff.current
    .filter(item => 'carried' === item.change)
    .reduce((sum, item) => sum + item.segment.tokensEst, 0);
  const causes = rankCauses(diff.current, request.caller);
  const responseTokensKnown = isResponseTokensKnown(request);

  return {
    ordinal: request.ordinal,
    payloadTokens: request.payloadTokens,
    responseTokens: request.responseTokens,
    payloadDelta: previous ? request.payloadTokens - previous.payloadTokens : 0,
    responseDelta: previous && responseTokensKnown && isResponseTokensKnown(previous)
      ? request.responseTokens - previous.responseTokens
      : 0,
    addedTokens,
    modifiedTokens,
    carriedTokens,
    topCause: causes[0] ?? null,
    causes,
    responseTokensKnown,
  };
};

/**
 * Derives run-level growth, redundancy, and spike analysis from a saved entry.
 *
 * Pure and deterministic: identical `HistoryEntry` input always yields the
 * same `RunAnalysis`. Does not mutate capture or storage.
 */
export const analyzeRun = (entry: HistoryEntry): RunAnalysis => {
  const requests = entry.requests;
  const lineages = buildLineages(requests);
  const ballastTokens = lineages.reduce((sum, lineage) => sum + lineage.carriedTokenCost, 0);
  const payloadTotal = requests.reduce((sum, request) => sum + request.payloadTokens, 0);
  const baseDeltas = requests.map((request, index) => (
    buildRequestDelta(request, requests[index - 1] ?? null)
  ));
  const payloadDeltas = baseDeltas.map(delta => delta.payloadDelta);
  const payloadCenter = median(payloadDeltas);
  const payloadMad = medianAbsoluteDeviation(payloadDeltas, payloadCenter);
  const knownResponseDeltas = baseDeltas
    .filter(delta => delta.responseTokensKnown)
    .map(delta => delta.responseDelta);
  const responseCenter = median(knownResponseDeltas);
  const responseMad = medianAbsoluteDeviation(knownResponseDeltas, responseCenter);

  const analyzed: RequestDelta[] = baseDeltas.map(delta => {
    const payloadIsSpike = isUpperSpike(delta.payloadDelta, payloadCenter, payloadMad, SPIKE_MAD_K);
    const responseIsSpike = delta.responseTokensKnown
      && isUpperSpike(delta.responseDelta, responseCenter, responseMad, SPIKE_MAD_K);

    return {
      ...delta,
      payloadSpikeScore: spikeScore(delta.payloadDelta, payloadCenter, payloadMad),
      responseSpikeScore: delta.responseTokensKnown
        ? spikeScore(delta.responseDelta, responseCenter, responseMad)
        : 0,
      payloadIsSpike,
      responseIsSpike,
    };
  });

  const peakPayloadOrdinal = requests.reduce<{ ordinal: number; tokens: number }>((peak, request) => (
    request.payloadTokens > peak.tokens
      ? { ordinal: request.ordinal, tokens: request.payloadTokens }
      : peak
  ), { ordinal: requests[0]?.ordinal ?? 0, tokens: -1 }).ordinal;

  const spikeOrdinals = analyzed
    .filter(delta => delta.payloadIsSpike || delta.responseIsSpike)
    .map(delta => delta.ordinal);

  return {
    requests: analyzed,
    lineages,
    ballastTokens,
    peakPayloadOrdinal,
    spikeOrdinals,
    totalRedundancyRatio: 0 === payloadTotal ? 0 : ballastTokens / payloadTotal,
  };
};
