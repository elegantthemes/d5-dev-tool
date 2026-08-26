// Local dependencies.
import { formatUsdCost } from './open-router-pricing';
import {
  summarizeInferenceRecords,
  type InferenceSummary,
  type InferenceSummaryRow,
} from './summarize-inference-records';
import { type NetworkRecord } from './network-recorder';

const SUMMARY_TABLE_HEADERS = [
  'Request',
  'Agent',
  'Model',
  'Payload Token',
  'Payload Cost',
  'Response Token',
  'Response Cost',
  'Total Token',
  'Total Cost',
] as const;

const formatTokenCount = (count: number, isEstimated = false): string => (
  `${isEstimated ? '~' : ''}${count.toLocaleString()}`
);

const escapeMarkdownTableCell = (value: string): string => value.replace(/\|/g, '\\|');

const formatMarkdownTableRow = (cells: string[]): string => (
  `| ${cells.map(escapeMarkdownTableCell).join(' | ')} |`
);

const formatSummaryDataRow = (row: InferenceSummaryRow): string => formatMarkdownTableRow([
  `Request ${row.requestNumber}`,
  row.agent,
  `\`${row.model}\``,
  formatTokenCount(row.payloadTokens, row.isEstimated),
  formatUsdCost(row.payloadCost),
  formatTokenCount(row.responseTokens, row.isEstimated),
  formatUsdCost(row.responseCost),
  formatTokenCount(row.totalTokens, row.isEstimated),
  formatUsdCost(row.totalCost),
]);

const formatSummaryTotalsRow = (summary: InferenceSummary): string => formatMarkdownTableRow([
  '**Totals**',
  '',
  '',
  formatTokenCount(summary.totals.payloadTokens),
  formatUsdCost(summary.totals.payloadCost),
  formatTokenCount(summary.totals.responseTokens),
  formatUsdCost(summary.totals.responseCost),
  formatTokenCount(summary.totals.totalTokens),
  formatUsdCost(summary.totals.totalCost),
]);

/**
 * Serializes the LLM inference summary table as a markdown table for clipboard export.
 */
export const formatLlmInferenceSummaryForCopy = (records: NetworkRecord[]): string => {
  const summary = summarizeInferenceRecords(records);

  if (0 === summary.rows.length) {
    return '';
  }

  const headerRow = formatMarkdownTableRow([...SUMMARY_TABLE_HEADERS]);
  const separatorRow = formatMarkdownTableRow(
    SUMMARY_TABLE_HEADERS.map(() => '---'),
  );
  const dataRows = summary.rows.map(formatSummaryDataRow);
  const totalsRow = formatSummaryTotalsRow(summary);

  return [
    headerRow,
    separatorRow,
    ...dataRows,
    totalsRow,
  ].join('\n');
};
