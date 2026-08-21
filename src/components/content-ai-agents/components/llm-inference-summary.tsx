// External dependencies.
import React, {
  ReactElement,
  useMemo,
} from 'react';

// Local dependencies.
import { OPEN_ROUTER_PRICING_LAST_UPDATED } from '../constants/open-router-model-pricing';
import { formatUsdCost } from '../utils/open-router-pricing';
import {
  scrollToLlmInferenceRequest,
  summarizeInferenceRecords,
  type InferenceSummaryRow,
} from '../utils/summarize-inference-records';
import { type NetworkRecord } from '../utils/network-recorder';

type LlmInferenceSummaryProps = {
  records: NetworkRecord[];
};

const formatTokenCount = (count: number): string => count.toLocaleString();

const SummaryTableRow = ({
  row,
}: {
  row: InferenceSummaryRow;
}): ReactElement => (
  <tr>
    <td>
      <button
        type="button"
        className="d5-dev-tool-ai-agent__llm-inference-request-link"
        onClick={() => scrollToLlmInferenceRequest(row.requestNumber)}
      >
        Request {row.requestNumber}
      </button>
    </td>
    <td>{row.agent}</td>
    <td><code>{row.model}</code></td>
    <td>{formatTokenCount(row.payloadTokens)}</td>
    <td>{formatUsdCost(row.payloadCost)}</td>
    <td>{formatTokenCount(row.responseTokens)}</td>
    <td>{formatUsdCost(row.responseCost)}</td>
    <td>{formatTokenCount(row.totalTokens)}</td>
    <td>{formatUsdCost(row.totalCost)}</td>
  </tr>
);

/**
 * Token and cost summary for each captured inference request.
 */
export const LlmInferenceSummary = ({
  records,
}: LlmInferenceSummaryProps): ReactElement => {
  const summary = useMemo(
    () => summarizeInferenceRecords(records),
    [records],
  );

  if (0 === records.length) {
    return <></>;
  }

  const pricingNotice = `Pricing source: Open Router model rates (last updated ${OPEN_ROUTER_PRICING_LAST_UPDATED}).`;

  return (
    <div className="d5-dev-tool-ai-agent__llm-inference-summary">
      <table className="d5-dev-tool-ai-agent__llm-inference-summary-table">
        <thead>
          <tr>
            <th>Request</th>
            <th>Agent</th>
            <th>Model</th>
            <th>Payload Token</th>
            <th>Payload Cost</th>
            <th>Response Token</th>
            <th>Response Cost</th>
            <th>Total Token</th>
            <th>Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {summary.rows.map(row => (
            <SummaryTableRow
              key={row.recordId}
              row={row}
            />
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={3}>Totals</th>
            <th>{formatTokenCount(summary.totals.payloadTokens)}</th>
            <th>{formatUsdCost(summary.totals.payloadCost)}</th>
            <th>{formatTokenCount(summary.totals.responseTokens)}</th>
            <th>{formatUsdCost(summary.totals.responseCost)}</th>
            <th>{formatTokenCount(summary.totals.totalTokens)}</th>
            <th>{formatUsdCost(summary.totals.totalCost)}</th>
          </tr>
        </tfoot>
      </table>
      <p className="d5-dev-tool-ai-agent__llm-inference-summary-notice">
        {pricingNotice}
        {summary.totals.hasUnknownPricing && (
          <>
            {' '}
            Some completed rows use models without a known Open Router price and show — for cost.
          </>
        )}
      </p>
    </div>
  );
};
