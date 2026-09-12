// External dependencies.
import React, {
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';

// Local dependencies.
import { type RequestDelta } from '../utils/analyze-run';
import { attributeCause } from '../utils/attribute-cause';
import { formatDuration } from '../utils/chat-metrics';
import {
  type DiffedSegment,
  type SegmentChange,
  diffLines,
  diffSegments,
} from '../utils/diff-segments';
import {
  formatCompactTokens,
  formatTokenDelta,
} from '../utils/format-compact-tokens';
import { type CapturedRequest } from '../utils/history-store';
import { type PayloadSegment } from '../utils/segment-payload';
import { CollapseControls } from './collapse-controls';
import { CopyDataButton } from './copy-data-button';
import { useExpandedItems } from './use-expanded-items';

const CHANGE_LABELS: Record<SegmentChange, string> = {
  carried: 'carried-over',
  modified: 'modified',
  added: 'new',
  removed: 'removed',
};

const CHANGE_RANK: Record<SegmentChange, number> = {
  added: 0,
  modified: 1,
  carried: 2,
  removed: 3,
};

type PayloadEvolutionRequestProps = {
  request: CapturedRequest;
  previous: CapturedRequest | null;
  isSelected: boolean;
  triage?: boolean;
  delta?: RequestDelta | null;
  highlightedHash?: string | null;
  bodyExpanded?: boolean;
  onToggleBody?: () => void;
};

const COLLAPSED_CODE_HEIGHT = 240;

const formatTokenCount = (count: number): string => count.toLocaleString();

const SegmentCodePanel = ({
  copyValue,
  children,
}: {
  copyValue: string;
  children: ReactNode;
}): ReactElement => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const node = scrollRef.current;

    if (!node) {
      return undefined;
    }

    const measure = () => {
      setCanExpand(node.scrollHeight > COLLAPSED_CODE_HEIGHT + 8);
    };

    measure();

    if ('undefined' === typeof ResizeObserver) {
      return undefined;
    }

    const observer = new ResizeObserver(measure);

    observer.observe(node);

    return () => observer.disconnect();
  }, [copyValue]);

  return (
    <div className="d5-dev-tool-ai-agent__segment-code">
      <div className="d5-dev-tool-ai-agent__segment-code-toolbar">
        <CopyDataButton
          label="Copy segment"
          getValue={() => copyValue}
        />
        {canExpand && (
          <button
            type="button"
            className="d5-dev-tool-ai-agent__segment-code-toggle"
            onClick={() => setIsOpen(current => !current)}
          >
            {isOpen ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
      <div
        ref={scrollRef}
        className={classnames('d5-dev-tool-ai-agent__segment-code-scroll', {
          'd5-dev-tool-ai-agent__segment-code-scroll--open': isOpen,
        })}
      >
        {children}
      </div>
    </div>
  );
};

const sortByDeltaContribution = (items: DiffedSegment[]): DiffedSegment[] => (
  items.slice().sort((left, right) => {
    const rankDelta = CHANGE_RANK[left.change] - CHANGE_RANK[right.change];

    if (0 !== rankDelta) {
      return rankDelta;
    }

    const leftTokens = 'carried' === left.change
      ? left.segment.tokensEst
      : Math.max(0, left.segment.tokensEst - (left.previous?.tokensEst ?? 0));
    const rightTokens = 'carried' === right.change
      ? right.segment.tokensEst
      : Math.max(0, right.segment.tokensEst - (right.previous?.tokensEst ?? 0));

    return rightTokens - leftTokens;
  })
);

const SegmentPreview = ({ text }: { text: string }): ReactElement => (
  <p className="d5-dev-tool-ai-agent__segment-preview">
    {text.replace(/\s+/g, ' ').trim() || '(empty)'}
  </p>
);

const SegmentDiffView = ({
  previousText,
  currentText,
}: {
  previousText: string;
  currentText: string;
}): ReactElement => {
  const lines = useMemo(
    () => diffLines(previousText, currentText),
    [currentText, previousText],
  );

  return (
    <pre className="d5-dev-tool-ai-agent__segment-diff">
      {lines.map((line, index) => (
        <span
          key={`${line.type}-${index}`}
          className={`d5-dev-tool-ai-agent__diff-line d5-dev-tool-ai-agent__diff-line--${line.type}`}
        >
          {`${'add' === line.type ? '+' : 'remove' === line.type ? '-' : ' '} ${line.text}`}
        </span>
      ))}
    </pre>
  );
};

const CauseTags = ({ delta }: { delta: RequestDelta }): ReactElement => (
  <div className="d5-dev-tool-ai-agent__cause-tags">
    {delta.causes.slice(0, 3).map(cause => (
      <span
        key={`${cause.kind}-${cause.label}-${cause.tokens}`}
        className={`d5-dev-tool-ai-agent__cause-tag d5-dev-tool-ai-agent__cause-tag--${cause.kind}`}
        title={`Caller: ${cause.caller}`}
      >
        {cause.toolName
          ? `${cause.label.split(':')[0]} · ${cause.toolName} (${formatTokenDelta(cause.tokens)})`
          : `${cause.label} (${formatTokenDelta(cause.tokens)})`}
      </span>
    ))}
    {0 < delta.carriedTokens && (
      <span className="d5-dev-tool-ai-agent__cause-tag d5-dev-tool-ai-agent__cause-tag--carried">
        Sent again ({formatCompactTokens(delta.carriedTokens)})
      </span>
    )}
  </div>
);

const SegmentCard = ({
  item,
  isExpanded,
  onToggle,
  isHighlighted,
  showAttribution,
  caller,
}: {
  item: DiffedSegment;
  isExpanded: boolean;
  onToggle: () => void;
  isHighlighted?: boolean;
  showAttribution?: boolean;
  caller?: CapturedRequest['caller'];
}): ReactElement => {
  const { segment, change, previous } = item;
  const showDiff = 'modified' === change && previous;
  const cause = showAttribution && caller ? attributeCause(item, caller) : null;

  return (
    <div
      className={classnames(
        'd5-dev-tool-ai-agent__segment',
        `d5-dev-tool-ai-agent__segment--${change}`,
        { 'd5-dev-tool-ai-agent__segment--highlighted': isHighlighted },
      )}
    >
      <button
        type="button"
        className="d5-dev-tool-ai-agent__segment-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className="d5-dev-tool-ai-agent__segment-header-main">
          <span className="d5-dev-tool-ai-agent__segment-title">
            {segment.index + 1}. {segment.label}
            <span className={`d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--seg-${change}`}>
              {CHANGE_LABELS[change]}
            </span>
          </span>
          <span className="d5-dev-tool-ai-agent__segment-meta">
            <span>Role: <code>{segment.role}</code></span>
            <span>~{formatTokenCount(segment.tokensEst)} tok</span>
            {cause?.toolName && <span>Tool: <code>{cause.toolName}</code></span>}
            {showAttribution && caller && <span>Caller: <code>{caller}</code></span>}
          </span>
          {!isExpanded && <SegmentPreview text={segment.text} />}
        </span>
        <span className="d5-dev-tool-ai-agent__card-chevron">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>
      {isExpanded && (
        <div className="d5-dev-tool-ai-agent__segment-body">
          <SegmentCodePanel copyValue={segment.text}>
            {showDiff ? (
              <SegmentDiffView
                previousText={previous.text}
                currentText={segment.text}
              />
            ) : (
              <pre className="d5-dev-tool-ai-agent__segment-text">{segment.text || '(empty)'}</pre>
            )}
          </SegmentCodePanel>
        </div>
      )}
    </div>
  );
};

const RemovedSegmentCard = ({
  segment,
  isExpanded,
  onToggle,
}: {
  segment: PayloadSegment;
  isExpanded: boolean;
  onToggle: () => void;
}): ReactElement => (
  <div className="d5-dev-tool-ai-agent__segment d5-dev-tool-ai-agent__segment--removed">
    <button
      type="button"
      className="d5-dev-tool-ai-agent__segment-header"
      onClick={onToggle}
      aria-expanded={isExpanded}
    >
      <span className="d5-dev-tool-ai-agent__segment-header-main">
        <span className="d5-dev-tool-ai-agent__segment-title">
          {segment.label}
          <span className="d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--seg-removed">
            {CHANGE_LABELS.removed}
          </span>
        </span>
        <span className="d5-dev-tool-ai-agent__segment-meta">
          <span>Role: <code>{segment.role}</code></span>
          <span>~{formatTokenCount(segment.tokensEst)} tok</span>
        </span>
        {!isExpanded && <SegmentPreview text={segment.text} />}
      </span>
      <span className="d5-dev-tool-ai-agent__card-chevron">
        {isExpanded ? '▼' : '▶'}
      </span>
    </button>
    {isExpanded && (
      <div className="d5-dev-tool-ai-agent__segment-body">
        <SegmentCodePanel copyValue={segment.text}>
          <pre className="d5-dev-tool-ai-agent__segment-text">{segment.text || '(empty)'}</pre>
        </SegmentCodePanel>
      </div>
    )}
  </div>
);

/**
 * One captured request: color-coded payload segments vs the previous request.
 *
 * In triage mode the body stays collapsed until opened, cause tags lead, and
 * carried-over segments fold under a ballast summary.
 */
export const PayloadEvolutionRequest = ({
  request,
  previous,
  isSelected,
  triage = false,
  delta = null,
  highlightedHash = null,
  bodyExpanded = true,
  onToggleBody,
}: PayloadEvolutionRequestProps): ReactElement => {
  const diff = useMemo(
    () => diffSegments(previous?.segments ?? [], request.segments),
    [previous, request.segments],
  );
  const { ballastSegments, deltaSegments, sortedCurrent } = useMemo(() => {
    const sorted = triage ? sortByDeltaContribution(diff.current) : diff.current;

    return {
      sortedCurrent: sorted,
      deltaSegments: triage ? sorted.filter(item => 'carried' !== item.change) : sorted,
      ballastSegments: triage ? sorted.filter(item => 'carried' === item.change) : [],
    };
  }, [diff.current, triage]);
  const ballastId = `ballast-${request.id}`;
  const itemIds = useMemo(
    () => [
      ...deltaSegments.map(item => `seg-${request.id}-${item.segment.index}`),
      ...ballastSegments.map(item => `seg-${request.id}-${item.segment.index}`),
      ...(0 < ballastSegments.length ? [ballastId] : []),
      ...diff.removed.map(segment => `removed-${request.id}-${segment.index}`),
    ],
    [ballastId, ballastSegments, deltaSegments, diff.removed, request.id],
  );
  const highlightedItemId = highlightedHash
    ? itemIds.find(itemId => sortedCurrent.some(item => (
      `seg-${request.id}-${item.segment.index}` === itemId && item.segment.hash === highlightedHash
    )))
    : null;
  const {
    isExpanded,
    toggle,
    expandAll,
    collapseAll,
  } = useExpandedItems(itemIds, false);
  const requestElementId = `d5-dev-tool-payload-evolution-request-${request.ordinal}`;
  const showBody = !triage || bodyExpanded;
  const ballastTokens = ballastSegments.reduce((sum, item) => sum + item.segment.tokensEst, 0);
  const highlightedInBallast = ballastSegments.some(item => item.segment.hash === highlightedHash);
  const ballastExpanded = isExpanded(ballastId) || highlightedInBallast;

  return (
    <section
      id={requestElementId}
      className={classnames('d5-dev-tool-ai-agent__evolution-request', {
        'd5-dev-tool-ai-agent__evolution-request--selected': isSelected,
        'd5-dev-tool-ai-agent__evolution-request--spike': Boolean(delta?.payloadIsSpike || delta?.responseIsSpike),
      })}
    >
      <div className="d5-dev-tool-ai-agent__section-header">
        {triage && onToggleBody ? (
          <button
            type="button"
            className="d5-dev-tool-ai-agent__evolution-request-toggle"
            onClick={onToggleBody}
            aria-expanded={showBody}
          >
            <span className="d5-dev-tool-ai-agent__evolution-request-toggle-main">
              <span className="d5-dev-tool-ai-agent__card-title">
                Request {request.ordinal}
                {delta?.payloadIsSpike && (
                  <span className="d5-dev-tool-ai-agent__timeline-marker" title="Prompt jumped in size">▲</span>
                )}
                {delta?.responseIsSpike && (
                  <span className="d5-dev-tool-ai-agent__timeline-marker d5-dev-tool-ai-agent__timeline-marker--output" title="Reply jumped in size">●</span>
                )}
              </span>
              <span className="d5-dev-tool-ai-agent__llm-inference-request-usage">
                <span>Payload: {formatTokenCount(request.payloadTokens)}</span>
                <span>
                  Response: {delta && !delta.responseTokensKnown ? 'n/a' : formatTokenCount(request.responseTokens)}
                </span>
                <span>Caller: <code>{request.caller}</code></span>
                <span>Model: <code>{request.model}</code></span>
                <span>Duration: {formatDuration(request.durationMs)}</span>
              </span>
            </span>
            <span className="d5-dev-tool-ai-agent__card-chevron">
              {showBody ? '▼' : '▶'}
            </span>
          </button>
        ) : (
          <div>
            <h4 className="d5-dev-tool-ai-agent__card-title">
              Request {request.ordinal}
            </h4>
            <p className="d5-dev-tool-ai-agent__llm-inference-request-usage">
              <span>Payload: {formatTokenCount(request.payloadTokens)}</span>
              <span>Response: {formatTokenCount(request.responseTokens)}</span>
              <span>Caller: <code>{request.caller}</code></span>
              <span>Model: <code>{request.model}</code></span>
              <span>Duration: {formatDuration(request.durationMs)}</span>
            </p>
          </div>
        )}
        {showBody && 0 < itemIds.length && (
          <div className="d5-dev-tool-ai-agent__section-actions">
            <CollapseControls onExpandAll={expandAll} onCollapseAll={collapseAll} />
          </div>
        )}
      </div>

      {showBody && (
        <>
          {triage && delta && <CauseTags delta={delta} />}

          <div className="d5-dev-tool-ai-agent__segment-list">
            {deltaSegments.map(item => {
              const itemId = `seg-${request.id}-${item.segment.index}`;

              return (
                <SegmentCard
                  key={itemId}
                  item={item}
                  isExpanded={isExpanded(itemId) || highlightedItemId === itemId}
                  onToggle={() => toggle(itemId)}
                  isHighlighted={item.segment.hash === highlightedHash}
                  showAttribution={triage}
                  caller={request.caller}
                />
              );
            })}
          </div>

          {0 < ballastSegments.length && (
            <div className="d5-dev-tool-ai-agent__ballast">
              <button
                type="button"
                className="d5-dev-tool-ai-agent__ballast-toggle"
                onClick={() => toggle(ballastId)}
                aria-expanded={ballastExpanded}
              >
                <span>
                  Sent again ({ballastSegments.length} pieces, ~{formatCompactTokens(ballastTokens)} tokens)
                </span>
                <span className="d5-dev-tool-ai-agent__card-chevron">
                  {ballastExpanded ? '▼' : '▶'}
                </span>
              </button>
              {ballastExpanded && (
                <div className="d5-dev-tool-ai-agent__segment-list">
                  {ballastSegments.map(item => {
                    const itemId = `seg-${request.id}-${item.segment.index}`;

                    return (
                      <SegmentCard
                        key={itemId}
                        item={item}
                        isExpanded={isExpanded(itemId) || item.segment.hash === highlightedHash}
                        onToggle={() => toggle(itemId)}
                        isHighlighted={item.segment.hash === highlightedHash}
                        showAttribution={triage}
                        caller={request.caller}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {0 < diff.removed.length && (
            <div className="d5-dev-tool-ai-agent__segment-removed">
              <p className="d5-dev-tool-ai-agent__context-label">Removed since previous request</p>
              {diff.removed.map(segment => {
                const itemId = `removed-${request.id}-${segment.index}`;

                return (
                  <RemovedSegmentCard
                    key={itemId}
                    segment={segment}
                    isExpanded={isExpanded(itemId)}
                    onToggle={() => toggle(itemId)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
};
