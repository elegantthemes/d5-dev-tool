// External dependencies.
import React, { ReactElement } from 'react';
import classnames from 'classnames';

// Local dependencies.
import { type RequestDelta, type RunAnalysis } from '../utils/analyze-run';
import {
  formatCompactTokens,
  formatTokenDelta,
} from '../utils/format-compact-tokens';
import { type CapturedRequest } from '../utils/history-store';

type PayloadEvolutionTimelineProps = {
  requests: CapturedRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (requestId: string) => void;
  analysis?: RunAnalysis | null;
  splitInputOutput?: boolean;
};

const deltaByOrdinal = (
  analysis: RunAnalysis | null | undefined,
  ordinal: number,
): RequestDelta | null => (
  analysis?.requests.find(request => request.ordinal === ordinal) ?? null
);

/**
 * Horizontal request rail showing per-request payload size and growth.
 *
 * When `analysis` is provided, bars scale to payload size, spikes are marked,
 * and non-spike requests recede.
 */
export const PayloadEvolutionTimeline = ({
  requests,
  selectedRequestId,
  onSelectRequest,
  analysis = null,
  splitInputOutput = false,
}: PayloadEvolutionTimelineProps): ReactElement => {
  if (0 === requests.length) {
    return (
      <p className="d5-dev-tool-ai-agent__empty">
        This run has no captured requests yet.
      </p>
    );
  }

  const maxPayload = Math.max(...requests.map(request => request.payloadTokens), 1);
  const maxResponse = Math.max(
    ...requests.map(request => (deltaByOrdinal(analysis, request.ordinal)?.responseTokensKnown
      ? request.responseTokens
      : 0)),
    1,
  );
  const maxBar = Math.max(maxPayload, splitInputOutput ? maxResponse : 0, 1);
  const showTriage = Boolean(analysis);

  return (
    <div
      className={classnames('d5-dev-tool-ai-agent__timeline', {
        'd5-dev-tool-ai-agent__timeline--triage': showTriage,
      })}
      role="list"
    >
      {requests.map((request, index) => {
        const previous = requests[index - 1];
        const delta = previous ? request.payloadTokens - previous.payloadTokens : null;
        const isSelected = request.id === selectedRequestId;
        const requestDelta = deltaByOrdinal(analysis, request.ordinal);
        const payloadIsSpike = Boolean(requestDelta?.payloadIsSpike);
        const responseIsSpike = Boolean(requestDelta?.responseIsSpike);
        const isSpike = payloadIsSpike || responseIsSpike;
        const payloadHeight = `${Math.max(6, Math.round((request.payloadTokens / maxBar) * 100))}%`;
        const responseKnown = requestDelta?.responseTokensKnown ?? true;
        const responseHeight = responseKnown
          ? `${Math.max(4, Math.round((request.responseTokens / maxBar) * 100))}%`
          : '0%';

        return (
          <button
            key={request.id}
            type="button"
            role="listitem"
            className={classnames('d5-dev-tool-ai-agent__timeline-item', {
              'd5-dev-tool-ai-agent__timeline-item--selected': isSelected,
              'd5-dev-tool-ai-agent__timeline-item--spike': isSpike,
              'd5-dev-tool-ai-agent__timeline-item--receded': showTriage && !isSpike && !isSelected,
            })}
            onClick={() => onSelectRequest(request.id)}
            aria-pressed={isSelected}
          >
            <span className="d5-dev-tool-ai-agent__timeline-label">
              R{request.ordinal}
              {payloadIsSpike && (
                <span className="d5-dev-tool-ai-agent__timeline-marker" title="Prompt jumped in size">▲</span>
              )}
              {responseIsSpike && (
                <span className="d5-dev-tool-ai-agent__timeline-marker d5-dev-tool-ai-agent__timeline-marker--output" title="Reply jumped in size">●</span>
              )}
            </span>
            {showTriage && (
              <span className="d5-dev-tool-ai-agent__timeline-bars" aria-hidden="true">
                <span
                  className="d5-dev-tool-ai-agent__timeline-bar d5-dev-tool-ai-agent__timeline-bar--payload"
                  style={{ height: payloadHeight }}
                />
                {splitInputOutput && (
                  <span
                    className={classnames(
                      'd5-dev-tool-ai-agent__timeline-bar d5-dev-tool-ai-agent__timeline-bar--response',
                      { 'd5-dev-tool-ai-agent__timeline-bar--unknown': !responseKnown },
                    )}
                    style={{ height: responseHeight }}
                  />
                )}
              </span>
            )}
            <span className="d5-dev-tool-ai-agent__timeline-tokens">
              {formatCompactTokens(request.payloadTokens)}
            </span>
            {splitInputOutput && (
              <span className="d5-dev-tool-ai-agent__timeline-output">
                {responseKnown ? formatCompactTokens(request.responseTokens) : 'n/a'}
              </span>
            )}
            {null !== delta && (
              <span
                className={classnames('d5-dev-tool-ai-agent__timeline-delta', {
                  'd5-dev-tool-ai-agent__timeline-delta--up': 0 < delta,
                  'd5-dev-tool-ai-agent__timeline-delta--down': 0 > delta,
                })}
              >
                {formatTokenDelta(delta)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
