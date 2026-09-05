// External dependencies.
import React, {
  ReactElement,
  useMemo,
} from 'react';

// Local dependencies.
import {
  formatLlmInferenceRequestForCopy,
  formatLlmInferenceRequestsForCopy,
} from '../utils/format-llm-inference-requests';
import { formatUsdCost } from '../utils/open-router-pricing';
import { type NetworkRecord } from '../utils/network-recorder';
import {
  buildInferenceRecordSummary,
  getLlmInferenceRequestElementId,
} from '../utils/summarize-inference-records';
import { CollapseControls } from './collapse-controls';
import { CollapsiblePrompt } from './collapsible-prompt';
import { CollapsibleResponse } from './collapsible-response';
import { CopyDataButton } from './copy-data-button';
import { LlmInferenceSummary } from './llm-inference-summary';
import { useExpandedItems } from './use-expanded-items';

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
  const recordIds = useMemo(() => records.map(record => record.id), [records]);
  const requestSummaries = useMemo(
    () => records.map((record, index) => buildInferenceRecordSummary(record, index + 1)),
    [records],
  );
  const {
    isExpanded,
    toggle,
    expandAll,
    collapseAll,
  } = useExpandedItems(recordIds, true);

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
          <div className="d5-dev-tool-ai-agent__section-actions">
            <CollapseControls onExpandAll={expandAll} onCollapseAll={collapseAll} />
            <CopyDataButton
              label="Copy All"
              getValue={() => formatLlmInferenceRequestsForCopy(records)}
            />
          </div>
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
            const requestExpanded = isExpanded(record.id);

            return (
              <section
                key={record.id}
                id={getLlmInferenceRequestElementId(index + 1)}
                className="d5-dev-tool-ai-agent__llm-inference-request"
              >
                <div className="d5-dev-tool-ai-agent__llm-inference-request-header">
                  <button
                    type="button"
                    className="d5-dev-tool-ai-agent__step-header d5-dev-tool-ai-agent__step-header--stacked d5-dev-tool-ai-agent__llm-inference-request-toggle"
                    onClick={() => toggle(record.id)}
                    aria-expanded={requestExpanded}
                  >
                    <span className="d5-dev-tool-ai-agent__step-header-main">
                      <span className="d5-dev-tool-ai-agent__llm-inference-request-title">
                        Request {index + 1}
                      </span>
                      <span className="d5-dev-tool-ai-agent__llm-inference-request-usage">
                        <span>Input: {formatTokenCount(summary.payloadTokens, summary.isEstimated)}</span>
                        <span>Output: {formatTokenCount(summary.responseTokens, summary.isEstimated)}</span>
                        <span>Total: {formatTokenCount(summary.totalTokens, summary.isEstimated)}</span>
                        <span>Est. cost: {formatUsdCost(summary.totalCost)}</span>
                      </span>
                      <span className="d5-dev-tool-ai-agent__llm-inference-request-meta">
                        <span>Caller: <code>{summary.caller}</code></span>
                        {summary.subAgent && (
                          <span>Subagent: {summary.subAgent}</span>
                        )}
                        <span>Model: <code>{summary.model}</code></span>
                      </span>
                    </span>
                  </button>
                  <div className="d5-dev-tool-ai-agent__llm-inference-request-actions">
                    <CopyDataButton
                      label="Copy"
                      getValue={() => formatLlmInferenceRequestForCopy(record, index + 1)}
                    />
                    <button
                      type="button"
                      className="d5-dev-tool-ai-agent__llm-inference-request-chevron"
                      onClick={() => toggle(record.id)}
                      aria-expanded={requestExpanded}
                      aria-label={requestExpanded ? 'Collapse request' : 'Expand request'}
                    >
                      {requestExpanded ? '▼' : '▶'}
                    </button>
                  </div>
                </div>
                {requestExpanded && (
                  <div className="d5-dev-tool-ai-agent__llm-inference-request-body">
                    <CollapsiblePrompt
                      label="Payload"
                      content={record.requestBody ?? ''}
                      variant="tool-request"
                    />
                    <CollapsibleResponse
                      label="Response"
                      content={record.responseBody ?? ''}
                      variant="tool-response"
                    />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
