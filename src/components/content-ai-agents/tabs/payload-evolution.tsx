// External dependencies.
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

// Local dependencies.
import { CopyDataButton } from '../components/copy-data-button';
import { HistorySelector } from '../components/history-selector';
import { LineageRibbon } from '../components/lineage-ribbon';
import { PayloadEvolutionHelp } from '../components/payload-evolution-help';
import { PayloadEvolutionRequest } from '../components/payload-evolution-request';
import { PayloadEvolutionSizeChart } from '../components/payload-evolution-size-chart';
import { PayloadEvolutionTimeline } from '../components/payload-evolution-timeline';
import { RunOverviewStrip } from '../components/run-overview-strip';
import { useAiHistory } from '../use-ai-history';
import { usePersistHistory } from '../use-persist-history';
import { analyzeRun } from '../utils/analyze-run';
import { formatRunForCopy } from '../utils/format-run-for-copy';
import '../styles.scss';

/**
 * Shows how a saved run’s prompt payload grew, what was sent again, and why.
 */
export const ContentAIAgentsPayloadEvolution = (): ReactElement => {
  usePersistHistory();

  const { activeEntry } = useAiHistory();
  const [focusedRequestId, setFocusedRequestId] = useState<string | null>(null);
  const [highlightedHash, setHighlightedHash] = useState<string | null>(null);
  const requests = activeEntry?.requests ?? [];
  const analysis = useMemo(
    () => (activeEntry ? analyzeRun(activeEntry) : null),
    [activeEntry],
  );
  const focusedId = focusedRequestId && requests.some(request => request.id === focusedRequestId)
    ? focusedRequestId
    : null;
  const focusedRequest = focusedId
    ? requests.find(request => request.id === focusedId) ?? null
    : null;
  const visibleRequests = focusedId
    ? requests.filter(request => request.id === focusedId)
    : requests;

  useEffect(() => {
    setFocusedRequestId(null);
    setHighlightedHash(null);
  }, [activeEntry?.id]);

  const handleSelectRequest = useCallback((requestId: string) => {
    setFocusedRequestId(current => (current === requestId ? null : requestId));
    const ordinal = requests.find(request => request.id === requestId)?.ordinal;

    if (ordinal) {
      window.setTimeout(() => {
        document.getElementById(`d5-dev-tool-payload-evolution-request-${ordinal}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 0);
    }
  }, [requests]);

  const handleSelectLineage = (hash: string | null) => {
    setHighlightedHash(hash);

    if (!hash || !analysis) {
      return;
    }

    const lineage = analysis.lineages.find(item => item.hash === hash);
    const firstOrdinal = lineage?.firstOrdinal;
    const firstRequest = requests.find(request => request.ordinal === firstOrdinal);

    if (firstRequest) {
      setFocusedRequestId(firstRequest.id);
    }
  };

  const promptPreview = useMemo(() => {
    if (!activeEntry) {
      return '';
    }

    return activeEntry.promptText.replace(/\s+/g, ' ').trim();
  }, [activeEntry]);

  return (
    <div className="d5-dev-tool-ai-agent">
      <HistorySelector skipIfHosted />
      {!activeEntry || !analysis ? (
        <p className="d5-dev-tool-ai-agent__empty">
          No saved run selected. Open this panel before prompting so the network recorder can intercept inference calls. Saved runs survive refresh.
        </p>
      ) : (
        <>
          <div className="d5-dev-tool-ai-agent__evolution-intro">
            <PayloadEvolutionHelp
              title="Payload Evolution"
              actions={(
                <CopyDataButton
                  label="Copy for AI"
                  getValue={() => formatRunForCopy(activeEntry, analysis, focusedId)}
                />
              )}
            />
            {activeEntry.description?.trim() && (
              <p className="d5-dev-tool-ai-agent__evolution-note">
                {activeEntry.description.trim()}
              </p>
            )}
            <p className="d5-dev-tool-ai-agent__evolution-prompt">
              {promptPreview || '(empty prompt)'}
            </p>
            <p className="d5-dev-tool-ai-agent__llm-inference-meta">
              Look at the chart and the gray bars first. Click a request to look at it alone. Copy for AI pastes this view as text.
            </p>
          </div>

          <PayloadEvolutionSizeChart
            analysis={analysis}
            requests={requests}
            selectedRequestId={focusedId}
            onSelectRequest={handleSelectRequest}
          />

          <RunOverviewStrip analysis={analysis} />

          <LineageRibbon
            lineages={analysis.lineages}
            requestOrdinals={requests.map(request => request.ordinal)}
            selectedHash={highlightedHash}
            onSelectLineage={handleSelectLineage}
          />

          <PayloadEvolutionTimeline
            requests={requests}
            selectedRequestId={focusedId}
            onSelectRequest={handleSelectRequest}
            analysis={analysis}
            splitInputOutput
          />

          <div className="d5-dev-tool-ai-agent__evolution-requests">
            {focusedRequest && 1 < requests.length && (
              <div className="d5-dev-tool-ai-agent__evolution-focus-bar">
                <p className="d5-dev-tool-ai-agent__evolution-focus-copy">
                  Showing R{focusedRequest.ordinal} only
                </p>
                <button
                  type="button"
                  className="d5-dev-tool-ai-agent__collapse-button"
                  onClick={() => setFocusedRequestId(null)}
                >
                  Show all requests
                </button>
              </div>
            )}
            {visibleRequests.map(request => {
              const requestIndex = requests.findIndex(item => item.id === request.id);
              const requestDelta = analysis.requests.find(item => item.ordinal === request.ordinal) ?? null;

              return (
                <PayloadEvolutionRequest
                  key={request.id}
                  request={request}
                  previous={requests[requestIndex - 1] ?? null}
                  isSelected={request.id === focusedId}
                  triage
                  delta={requestDelta}
                  highlightedHash={highlightedHash}
                  bodyExpanded={Boolean(focusedId)}
                  onToggleBody={() => handleSelectRequest(request.id)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
