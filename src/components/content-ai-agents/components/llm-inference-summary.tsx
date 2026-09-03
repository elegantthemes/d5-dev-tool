// External dependencies.
import React, {
  ReactElement,
  useMemo,
  useState,
} from 'react';

// Local dependencies.
import { OPEN_ROUTER_PRICING_LAST_UPDATED } from '../constants/open-router-model-pricing';
import { formatInferenceResponseToolCalls } from '../utils/extract-inference-tool-calls';
import { formatLlmInferenceSummaryForCopy } from '../utils/format-llm-inference-summary';
import { formatUsdCost } from '../utils/open-router-pricing';
import {
  scrollToLlmInferenceRequest,
  summarizeInferenceRecords,
  type InferenceSummaryRow,
} from '../utils/summarize-inference-records';
import { type NetworkRecord } from '../utils/network-recorder';
import { CopyDataButton } from './copy-data-button';

type LlmInferenceSummaryProps = {
  records: NetworkRecord[];
};

const formatTokenCount = (count: number, isEstimated = false): string => (
  `${isEstimated ? '~' : ''}${count.toLocaleString()}`
);

const SummaryTableRow = ({
  row,
  showEstimatedCost,
}: {
  row: InferenceSummaryRow;
  showEstimatedCost: boolean;
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
    <td><code>{row.caller}</code></td>
    <td>{row.subAgent || '—'}</td>
    <td><code>{row.model}</code></td>
    <td>
      {0 === row.responseToolCalls.length ? (
        formatInferenceResponseToolCalls(row.responseToolCalls)
      ) : (
        row.responseToolCalls.map((name, index) => (
          <React.Fragment key={name}>
            {0 < index && ', '}
            <code>{name}</code>
          </React.Fragment>
        ))
      )}
    </td>
    <td>{formatTokenCount(row.payloadTokens, row.isEstimated)}</td>
    {showEstimatedCost && <td>{formatUsdCost(row.payloadCost)}</td>}
    <td>{formatTokenCount(row.responseTokens, row.isEstimated)}</td>
    {showEstimatedCost && <td>{formatUsdCost(row.responseCost)}</td>}
    <td>{formatTokenCount(row.totalTokens, row.isEstimated)}</td>
    {showEstimatedCost && <td>{formatUsdCost(row.totalCost)}</td>}
  </tr>
);

/**
 * Token and cost summary for each captured inference request.
 */
export const LlmInferenceSummary = ({
  records,
}: LlmInferenceSummaryProps): ReactElement => {
  const [showEstimatedCost, setShowEstimatedCost] = useState(false);
  const summary = useMemo(
    () => summarizeInferenceRecords(records),
    [records],
  );

  if (0 === records.length) {
    return <></>;
  }

  const pricingNotice = `Pricing source: Open Router model rates (last updated ${OPEN_ROUTER_PRICING_LAST_UPDATED}).`;
  const hasNotice = summary.totals.hasEstimatedUsage
    || (showEstimatedCost && summary.totals.hasUnknownPricing)
    || showEstimatedCost;

  return (
    <div className="d5-dev-tool-ai-agent__llm-inference-summary">
      <div className="d5-dev-tool-ai-agent__llm-inference-summary-header">
        <h4 className="d5-dev-tool-ai-agent__llm-inference-summary-title">
          Summary
        </h4>
        <div className="d5-dev-tool-ai-agent__llm-inference-summary-actions">
          <label className="d5-dev-tool-ai-agent__llm-inference-summary-filter">
            <input
              type="checkbox"
              checked={showEstimatedCost}
              onChange={() => setShowEstimatedCost(current => !current)}
            />
            <span>Show Estimated Cost</span>
          </label>
          <CopyDataButton
            label="Copy Table"
            getValue={() => formatLlmInferenceSummaryForCopy(records)}
          />
        </div>
      </div>
      <table className="d5-dev-tool-ai-agent__llm-inference-summary-table">
        <thead>
          <tr>
            <th>Request</th>
            <th>Caller</th>
            <th>Subagent</th>
            <th>Model</th>
            <th>Response Tool Call</th>
            <th>Payload Token</th>
            {showEstimatedCost && <th>Payload Cost</th>}
            <th>Response Token</th>
            {showEstimatedCost && <th>Response Cost</th>}
            <th>Total Token</th>
            {showEstimatedCost && <th>Total Cost</th>}
          </tr>
        </thead>
        <tbody>
          {summary.rows.map(row => (
            <SummaryTableRow
              key={row.recordId}
              row={row}
              showEstimatedCost={showEstimatedCost}
            />
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={5}>Totals</th>
            <th>{formatTokenCount(summary.totals.payloadTokens)}</th>
            {showEstimatedCost && <th>{formatUsdCost(summary.totals.payloadCost)}</th>}
            <th>{formatTokenCount(summary.totals.responseTokens)}</th>
            {showEstimatedCost && <th>{formatUsdCost(summary.totals.responseCost)}</th>}
            <th>{formatTokenCount(summary.totals.totalTokens)}</th>
            {showEstimatedCost && <th>{formatUsdCost(summary.totals.totalCost)}</th>}
          </tr>
        </tfoot>
      </table>
      {hasNotice && (
        <p className="d5-dev-tool-ai-agent__llm-inference-summary-notice">
          {showEstimatedCost && pricingNotice}
          {summary.totals.hasEstimatedUsage && (
            <>
              {showEstimatedCost && ' '}
              Rows marked with ~ estimate tokens from the captured payload and response because the API did not include usage.
            </>
          )}
          {showEstimatedCost && summary.totals.hasUnknownPricing && (
            <>
              {' '}
              Some completed rows use models without a known Open Router price and show — for cost.
            </>
          )}
        </p>
      )}
    </div>
  );
};
