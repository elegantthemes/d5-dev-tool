// Local dependencies.
import { formatInferenceResponseToolCalls } from './extract-inference-tool-calls';
import { formatUsdCost } from './open-router-pricing';
import {
  summarizeInferenceRecords,
  type InferenceSummary,
  type InferenceSummaryRow,
} from './summarize-inference-records';
import { type NetworkRecord } from './network-recorder';

const SUMMARY_TABLE_COLUMNS = [
  { header: 'Request', isCost: false },
  { header: 'Caller', isCost: false },
  { header: 'Subagent', isCost: false },
  { header: 'Model', isCost: false },
  { header: 'Response Tool Call', isCost: false },
  { header: 'Payload Token', isCost: false },
  { header: 'Payload Cost', isCost: true },
  { header: 'Response Token', isCost: false },
  { header: 'Response Cost', isCost: true },
  { header: 'Total Token', isCost: false },
  { header: 'Total Cost', isCost: true },
] as const;

const pickVisibleCells = <T,>(cells: readonly T[], showEstimatedCost: boolean): T[] => (
  cells.filter((_, index) => showEstimatedCost || !SUMMARY_TABLE_COLUMNS[index].isCost)
);

const formatTokenCount = (count: number, isEstimated = false): string => (
  `${isEstimated ? '~' : ''}${count.toLocaleString()}`
);

const escapeMarkdownTableCell = (value: string): string => value.replace(/\|/g, '\\|');

const formatMarkdownTableRow = (cells: string[]): string => (
  `| ${cells.map(escapeMarkdownTableCell).join(' | ')} |`
);

const formatToolCallsForCopy = (toolCalls: string[]): string => {
  if (0 === toolCalls.length) {
    return formatInferenceResponseToolCalls(toolCalls);
  }

  return toolCalls.map(name => `\`${name}\``).join(', ');
};

const formatSummaryDataRow = (
  row: InferenceSummaryRow,
  showEstimatedCost: boolean,
): string => formatMarkdownTableRow(pickVisibleCells([
  `Request ${row.requestNumber}`,
  row.caller,
  row.subAgent || '—',
  `\`${row.model}\``,
  formatToolCallsForCopy(row.responseToolCalls),
  formatTokenCount(row.payloadTokens, row.isEstimated),
  formatUsdCost(row.payloadCost),
  formatTokenCount(row.responseTokens, row.isEstimated),
  formatUsdCost(row.responseCost),
  formatTokenCount(row.totalTokens, row.isEstimated),
  formatUsdCost(row.totalCost),
], showEstimatedCost));

const formatSummaryTotalsRow = (
  summary: InferenceSummary,
  showEstimatedCost: boolean,
): string => formatMarkdownTableRow(pickVisibleCells([
  '**Totals**',
  '',
  '',
  '',
  '',
  formatTokenCount(summary.totals.payloadTokens),
  formatUsdCost(summary.totals.payloadCost),
  formatTokenCount(summary.totals.responseTokens),
  formatUsdCost(summary.totals.responseCost),
  formatTokenCount(summary.totals.totalTokens),
  formatUsdCost(summary.totals.totalCost),
], showEstimatedCost));

/**
 * Serializes the LLM inference summary table as a markdown table for clipboard export.
 * Cost columns are included only when they are visible in the UI.
 */
export const formatLlmInferenceSummaryForCopy = (
  records: NetworkRecord[],
  showEstimatedCost = false,
): string => {
  const summary = summarizeInferenceRecords(records);

  if (0 === summary.rows.length) {
    return '';
  }

  const headers = pickVisibleCells(
    SUMMARY_TABLE_COLUMNS.map(column => column.header),
    showEstimatedCost,
  );
  const headerRow = formatMarkdownTableRow(headers);
  const separatorRow = formatMarkdownTableRow(headers.map(() => '---'));
  const dataRows = summary.rows.map(row => formatSummaryDataRow(row, showEstimatedCost));
  const totalsRow = formatSummaryTotalsRow(summary, showEstimatedCost);

  return [
    headerRow,
    separatorRow,
    ...dataRows,
    totalsRow,
  ].join('\n');
};
