// External dependencies.
import React, {
  ReactElement,
  useMemo,
} from 'react';

// Local dependencies.
import { formatLlmInferenceRequestsForCopy } from '../utils/format-llm-inference-requests';
import { formatUsdCost } from '../utils/open-router-pricing';
import { type NetworkRecord } from '../utils/network-recorder';
import {
  buildInferenceRecordSummary,
  getLlmInferenceRequestElementId,
} from '../utils/summarize-inference-records';
import { CollapsiblePrompt } from './collapsible-prompt';
import { CopyDataButton } from './copy-data-button';
import { LlmInferenceSummary } from './llm-inference-summary';

type LlmInferenceRequestsDebugProps = {
  records: NetworkRecord[];
  installedAt: number | null;
};

const formatRecorderInstalledAt = (installedAt: number | null): string => (
  null === installedAt ? 'not installed' : new Date(installedAt).toLocaleString()
);

const formatTokenCount = (count: number, isEstimated = false): string => (
  `${isEstimated ? '~' : ''}${count.toLocaleString()}`
);

/**
 * Lists captured LLM inference payloads and responses, grouped by request.
 */
export const LlmInferenceRequestsDebug = ({
  records,
  installedAt,
}: LlmInferenceRequestsDebugProps): ReactElement => {
  const requestSummaries = useMemo(
    () => records.map((record, index) => buildInferenceRecordSummary(record, index + 1)),
    [records],
  );

  return (
    <div className="d5-dev-tool-ai-agent__llm-inference">
      <div className="d5-dev-tool-ai-agent__section-header">
        <div>
          <h3 className="d5-dev-tool-ai-agent__section-title">
            LLM Inference Requests ({records.length})
          </h3>
          <p className="d5-dev-tool-ai-agent__llm-inference-meta">
            Recorder installed: {formatRecorderInstalledAt(installedAt)}
          </p>
        </div>
        {0 < records.length && (
          <CopyDataButton
            label="Copy All"
            getValue={() => formatLlmInferenceRequestsForCopy(records)}
          />
        )}
      </div>

      <LlmInferenceSummary records={records} />

      {0 === records.length ? (
        <p className="d5-dev-tool-ai-agent__empty">
          No LLM inference request has been captured yet. Open this tab before sending a prompt so the network recorder can intercept agent inference calls.
        </p>
      ) : (
        <div className="d5-dev-tool-ai-agent__llm-inference-list">
          {records.map((record, index) => {
            const summary = requestSummaries[index];

            return (
              <section
                key={record.id}
                id={getLlmInferenceRequestElementId(index + 1)}
                className="d5-dev-tool-ai-agent__llm-inference-request"
              >
                <div className="d5-dev-tool-ai-agent__llm-inference-request-header">
                  <h4 className="d5-dev-tool-ai-agent__llm-inference-request-title">
                    Request {index + 1}
                  </h4>
                  <p className="d5-dev-tool-ai-agent__llm-inference-request-usage">
                    <span>Input: {formatTokenCount(summary.payloadTokens, summary.isEstimated)}</span>
                    <span>Output: {formatTokenCount(summary.responseTokens, summary.isEstimated)}</span>
                    <span>Total: {formatTokenCount(summary.totalTokens, summary.isEstimated)}</span>
                    <span>Est. cost: {formatUsdCost(summary.totalCost)}</span>
                  </p>
                  <p className="d5-dev-tool-ai-agent__llm-inference-request-meta">
                    <span>Agent: <code>{summary.agent}</code></span>
                    <span>Model: <code>{summary.model}</code></span>
                  </p>
                </div>
                <CollapsiblePrompt
                  label="Payload"
                  content={record.requestBody ?? ''}
                  variant="tool-request"
                />
                <CollapsiblePrompt
                  label="Response"
                  content={record.responseBody ?? ''}
                  variant="tool-response"
                />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
