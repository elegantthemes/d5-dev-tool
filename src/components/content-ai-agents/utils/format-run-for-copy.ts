// Local dependencies.
import { type RunAnalysis } from './analyze-run';
import { diffSegments } from './diff-segments';
import {
  formatCompactTokens,
  formatPercent,
  formatTokenDelta,
} from './format-compact-tokens';
import { type CapturedRequest, type HistoryEntry } from './history-store';

export const COPY_SEGMENT_TEXT_LIMIT = 8000;

const truncateText = (text: string, maxLength: number): string => {
  if (maxLength >= text.length) {
    return text;
  }

  return `${text.slice(0, maxLength)}\n... [truncated, ${text.length.toLocaleString()} characters total]`;
};

const formatRequestRow = (
  request: CapturedRequest,
  delta: RunAnalysis['requests'][number] | undefined,
): string => {
  const reply = delta && !delta.responseTokensKnown
    ? 'n/a'
    : request.responseTokens.toLocaleString();
  const change = delta ? formatTokenDelta(delta.payloadDelta) : '0';
  const jump = delta?.payloadIsSpike || delta?.responseIsSpike ? ' JUMP' : '';
  const cause = delta?.topCause
    ? `  why: ${delta.topCause.label} (${formatTokenDelta(delta.topCause.tokens)})`
    : '';

  return `R${request.ordinal}  sent ${request.payloadTokens.toLocaleString()}  reply ${reply}  change ${change}  caller ${request.caller}${cause}${jump}`;
};

const formatRequestDetails = (
  request: CapturedRequest,
  previous: CapturedRequest | null,
  delta: RunAnalysis['requests'][number] | undefined,
): string => {
  const diff = diffSegments(previous?.segments ?? [], request.segments);
  const reply = delta && !delta.responseTokensKnown
    ? 'n/a'
    : request.responseTokens.toLocaleString();
  const lines = [
    `Request R${request.ordinal}`,
    `Caller: ${request.caller}`,
    `Model: ${request.model}`,
    `Sent: ${request.payloadTokens.toLocaleString()} (${delta ? formatTokenDelta(delta.payloadDelta) : '0'})`,
    `Reply: ${reply}`,
  ];

  if (delta?.topCause) {
    lines.push(`Why it grew: ${delta.topCause.label} (${formatTokenDelta(delta.topCause.tokens)})`);
  }

  if (delta && 0 < delta.causes.length) {
    lines.push('Added or changed:');
    delta.causes.forEach(cause => {
      lines.push(`- ${cause.label} (${formatTokenDelta(cause.tokens)}) caller ${cause.caller}`);
    });
  }

  lines.push('');
  lines.push('Pieces of the prompt:');

  diff.current.forEach(item => {
    const change = 'added' === item.change
      ? 'new'
      : 'modified' === item.change
        ? 'changed'
        : 'sent again';

    lines.push('');
    lines.push(`[${change}] ${item.segment.label} | role ${item.segment.role} | ${item.segment.tokensEst.toLocaleString()} tokens`);
    lines.push(truncateText(item.segment.text || '(empty)', COPY_SEGMENT_TEXT_LIMIT));
  });

  if (0 < diff.removed.length) {
    lines.push('');
    lines.push('Removed since previous request:');
    diff.removed.forEach(segment => {
      lines.push(`- ${segment.label} | role ${segment.role} | ${segment.tokensEst.toLocaleString()} tokens`);
    });
  }

  return lines.join('\n');
};

/**
 * Builds a plain-text report of a saved run for pasting into another AI.
 *
 * Always includes the run summary and every request’s size row. Full prompt
 * pieces are included for `focusedRequestId` when set, otherwise for every request.
 */
export const formatRunForCopy = (
  entry: HistoryEntry,
  analysis: RunAnalysis,
  focusedRequestId: string | null = null,
): string => {
  const prompt = entry.promptText.replace(/\s+/g, ' ').trim() || '(empty prompt)';
  const focused = focusedRequestId
    ? entry.requests.find(request => request.id === focusedRequestId) ?? null
    : null;
  const detailRequests = focused ? [focused] : entry.requests;
  const repeated = analysis.lineages.filter(lineage => 1 < lineage.occurrences);
  const jumps = analysis.spikeOrdinals.length
    ? analysis.spikeOrdinals.map(ordinal => `R${ordinal}`).join(', ')
    : 'none';

  const blocks = [
    'Payload evolution report',
    'Find what made the prompt grow, and what text was copied into later requests.',
    '',
    ...(entry.description?.trim() ? [`Note: ${entry.description.trim()}`] : []),
    `Prompt: ${prompt}`,
    `Model: ${entry.model}`,
    `Requests: ${entry.requestCount}`,
    `Extra copies: ${formatPercent(analysis.totalRedundancyRatio)} of all tokens (${formatCompactTokens(analysis.ballastTokens)} tokens after the first send)`,
    `Biggest request: R${analysis.peakPayloadOrdinal}`,
    `Size jumps: ${jumps}`,
  ];

  if (focused) {
    blocks.push(`Showing details for: R${focused.ordinal} only`);
  }

  blocks.push('');
  blocks.push('Repeated text (sent in more than one request)');

  if (0 === repeated.length) {
    blocks.push('None.');
  } else {
    repeated.forEach(lineage => {
      blocks.push(
        `- ${lineage.label} | ${lineage.tokensEst.toLocaleString()} tokens | R${lineage.firstOrdinal}-R${lineage.lastOrdinal} (${lineage.occurrences} times) | extra ${lineage.carriedTokenCost.toLocaleString()} tokens`,
      );
    });
  }

  blocks.push('');
  blocks.push('Request summary');
  entry.requests.forEach(request => {
    const delta = analysis.requests.find(item => item.ordinal === request.ordinal);

    blocks.push(formatRequestRow(request, delta));
  });

  detailRequests.forEach(request => {
    const previous = entry.requests.find(item => item.ordinal === request.ordinal - 1) ?? null;
    const delta = analysis.requests.find(item => item.ordinal === request.ordinal);

    blocks.push('');
    blocks.push(formatRequestDetails(request, previous, delta));
  });

  return `${blocks.join('\n')}\n`;
};
