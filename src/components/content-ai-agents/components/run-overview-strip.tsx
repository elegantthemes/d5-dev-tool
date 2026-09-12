// External dependencies.
import React, { ReactElement, useMemo } from 'react';

// Local dependencies.
import { type RunAnalysis } from '../utils/analyze-run';
import {
  formatCompactTokens,
  formatPercent,
  formatTokenDelta,
} from '../utils/format-compact-tokens';

type RunOverviewStripProps = {
  analysis: RunAnalysis;
};

const buildHeadline = (analysis: RunAnalysis): string => {
  const peak = analysis.requests.find(request => request.ordinal === analysis.peakPayloadOrdinal);
  const biggestHop = analysis.requests.reduce<typeof analysis.requests[number] | null>((current, request) => {
    if (!current || request.payloadDelta > current.payloadDelta) {
      return request;
    }

    return current;
  }, null);

  if (!peak) {
    return 'No captured requests in this run.';
  }

  if (2 > analysis.requests.length) {
    return `R${peak.ordinal} is ${formatCompactTokens(peak.payloadTokens)} tokens. There is only one request, so there is nothing to compare.`;
  }

  const peakText = `Biggest request: R${peak.ordinal} (${formatCompactTokens(peak.payloadTokens)}).`;

  if (!biggestHop || 0 >= biggestHop.payloadDelta) {
    return peakText;
  }

  const cause = biggestHop.topCause
    ? ` because ${biggestHop.topCause.label}`
    : '';

  return `${peakText} Biggest jump: R${biggestHop.ordinal} grew ${formatTokenDelta(biggestHop.payloadDelta)}${cause}.`;
};

/**
 * Extra-copies meter and the peak/cause headline.
 */
export const RunOverviewStrip = ({ analysis }: RunOverviewStripProps): ReactElement => {
  const headline = useMemo(() => buildHeadline(analysis), [analysis]);
  const redundancyLabel = 0 === analysis.ballastTokens
    ? 'No extra copies. Each piece of text was sent only once.'
    : `${formatPercent(analysis.totalRedundancyRatio)} of all tokens were extra copies (same text sent after the first time): ${formatCompactTokens(analysis.ballastTokens)} tokens.`;

  return (
    <section className="d5-dev-tool-ai-agent__overview">
      <div className="d5-dev-tool-ai-agent__overview-meter">
        <p className="d5-dev-tool-ai-agent__context-label">Extra copies</p>
        <div
          className="d5-dev-tool-ai-agent__redundancy-track"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(analysis.totalRedundancyRatio * 100)}
          aria-label="Share of tokens that were extra copies after the first send"
        >
          <span
            className="d5-dev-tool-ai-agent__redundancy-fill"
            style={{ width: formatPercent(analysis.totalRedundancyRatio) }}
          />
        </div>
        <p className="d5-dev-tool-ai-agent__overview-copy">{redundancyLabel}</p>
      </div>
      <p className="d5-dev-tool-ai-agent__overview-headline">{headline}</p>
    </section>
  );
};
