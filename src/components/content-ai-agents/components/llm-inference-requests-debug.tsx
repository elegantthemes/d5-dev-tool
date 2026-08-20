// External dependencies.
import React, {
  ReactElement,
} from 'react';

// Local dependencies.
import { formatLlmInferenceRequestsForCopy } from '../utils/format-llm-inference-requests';
import { type NetworkRecord } from '../utils/network-recorder';
import { CopyDataButton } from './copy-data-button';
import { CollapsiblePrompt } from './collapsible-prompt';

type LlmInferenceRequestsDebugProps = {
  records: NetworkRecord[];
  installedAt: number | null;
};

const formatRecorderInstalledAt = (installedAt: number | null): string => (
  null === installedAt ? 'not installed' : new Date(installedAt).toLocaleString()
);

/**
 * Lists captured LLM inference payloads and responses, grouped by request.
 */
export const LlmInferenceRequestsDebug = ({
  records,
  installedAt,
}: LlmInferenceRequestsDebugProps): ReactElement => {
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

      {0 === records.length ? (
        <p className="d5-dev-tool-ai-agent__empty">
          No LLM inference request has been captured yet. Open this tab before sending a prompt so the network recorder can intercept agent inference calls.
        </p>
      ) : (
        <div className="d5-dev-tool-ai-agent__llm-inference-list">
          {records.map((record, index) => (
            <section
              key={record.id}
              className="d5-dev-tool-ai-agent__llm-inference-request"
            >
              <h4 className="d5-dev-tool-ai-agent__llm-inference-request-title">
                Request {index + 1}
              </h4>
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
          ))}
        </div>
      )}
    </div>
  );
};
