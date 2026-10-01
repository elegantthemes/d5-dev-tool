// External dependencies.
import React, {
  ReactElement,
  useEffect,
  useMemo,
  useState,
} from 'react';
import classnames from 'classnames';

import { copyTextToClipboard } from '../utils/copy-to-clipboard';
import { formatJsonContent } from '../utils/format-json-content';
import { parseSseResponseLines } from '../utils/parse-sse-response-lines';
import { type PromptVariant } from './collapsible-prompt';
import { ResponseFocusView } from './response-focus-view';
import { ViewTabs } from './view-tabs';

type ResponseViewMode = 'focus' | 'formatted' | 'plain';

const RESPONSE_VIEW_TABS = [
  { id: 'focus', label: 'Focus' },
  { id: 'formatted', label: 'Formatted' },
  { id: 'plain', label: 'Plain' },
];

type CollapsibleResponseProps = {
  label: string;
  content: string;
  variant: PromptVariant;
};

const variantClassMap: Record<PromptVariant, string> = {
  'user-prompt': 'd5-dev-tool-ai-agent__block--user-prompt',
  'system-prompt': 'd5-dev-tool-ai-agent__block--system-prompt',
  response: 'd5-dev-tool-ai-agent__block--response',
  'tool-request': 'd5-dev-tool-ai-agent__block--tool-request',
  'tool-response': 'd5-dev-tool-ai-agent__block--tool-response',
};

type SseEventBoxProps = {
  lineNumber: number;
  summary: string;
  formattedJson: string;
  isExpanded: boolean;
  onToggle: () => void;
};

const SseEventBox = ({
  lineNumber,
  summary,
  formattedJson,
  isExpanded,
  onToggle,
}: SseEventBoxProps): ReactElement => {
  return (
    <div className="d5-dev-tool-ai-agent__sse-event">
      <button
        type="button"
        className="d5-dev-tool-ai-agent__sse-event-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className="d5-dev-tool-ai-agent__sse-event-index">{lineNumber}</span>
        <span className="d5-dev-tool-ai-agent__sse-event-summary">{summary}</span>
        <span className="d5-dev-tool-ai-agent__sse-event-toggle">
          {isExpanded ? 'Hide' : 'Show'}
        </span>
      </button>
      {isExpanded && (
        <pre className="d5-dev-tool-ai-agent__sse-event-body">
          {formattedJson}
        </pre>
      )}
    </div>
  );
};

/**
 * Response body with a focused completed-output view, formatted SSE events, and raw text.
 */
export const CollapsibleResponse = ({
  label,
  content,
  variant,
}: CollapsibleResponseProps): ReactElement => {
  const [viewMode, setViewMode] = useState<ResponseViewMode>('focus');
  const [isPlainExpanded, setIsPlainExpanded] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [expandedByIndex, setExpandedByIndex] = useState<Record<number, boolean>>({});
  const formattedContent = useMemo(() => formatJsonContent(content), [content]);
  const sseLines = useMemo(() => parseSseResponseLines(content), [content]);
  const hasContent = Boolean(content.trim());

  useEffect(() => {
    setExpandedByIndex(
      Object.fromEntries(sseLines.map((_, index) => [index, true])),
    );
  }, [sseLines]);

  const allExpanded = 0 < sseLines.length
    && sseLines.every((_, index) => false !== expandedByIndex[index]);

  const handleToggleAllEvents = () => {
    const nextExpanded = !allExpanded;

    setExpandedByIndex(
      Object.fromEntries(sseLines.map((_, index) => [index, nextExpanded])),
    );
  };

  const handleToggleEvent = (index: number) => {
    setExpandedByIndex(previous => ({
      ...previous,
      [index]: false === previous[index],
    }));
  };

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      await copyTextToClipboard(
        content,
        event.currentTarget.ownerDocument ?? document,
      );
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 1500);
    }
  };

  if (!hasContent) {
    return (
      <div className={classnames('d5-dev-tool-ai-agent__block', variantClassMap[variant])}>
        <span className="d5-dev-tool-ai-agent__block-label">{label}</span>
        <pre className="d5-dev-tool-ai-agent__prompt">(empty)</pre>
      </div>
    );
  }

  const copyLabel = 'copied' === copyState
    ? 'Copied'
    : 'error' === copyState
      ? 'Copy failed'
      : 'Copy';

  return (
    <div className={classnames('d5-dev-tool-ai-agent__block', variantClassMap[variant])}>
      <div className="d5-dev-tool-ai-agent__block-label-row">
        <span className="d5-dev-tool-ai-agent__block-label">{label}</span>
        <div className="d5-dev-tool-ai-agent__response-actions">
          <ViewTabs
            ariaLabel={`${label} view`}
            tabs={RESPONSE_VIEW_TABS}
            value={viewMode}
            onChange={nextMode => setViewMode(nextMode as ResponseViewMode)}
          />
          <button
            type="button"
            className="d5-dev-tool-ai-agent__copy-button"
            onClick={handleCopy}
          >
            {copyLabel}
          </button>
        </div>
      </div>

      {'focus' === viewMode ? (
        <ResponseFocusView content={content} />
      ) : 'formatted' === viewMode ? (
        <div className="d5-dev-tool-ai-agent__sse-events">
          {0 < sseLines.length && (
            <div className="d5-dev-tool-ai-agent__sse-events-toolbar">
              <button
                type="button"
                className="d5-dev-tool-ai-agent__copy-button"
                onClick={handleToggleAllEvents}
              >
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </button>
            </div>
          )}
          {sseLines.map((line, index) => (
            <SseEventBox
              key={`${index}-${line.lineNumber}`}
              lineNumber={line.lineNumber}
              summary={line.summary}
              formattedJson={line.formattedJson}
              isExpanded={false !== expandedByIndex[index]}
              onToggle={() => handleToggleEvent(index)}
            />
          ))}
        </div>
      ) : (
        <>
          <button
            type="button"
            className={classnames('d5-dev-tool-ai-agent__prompt', {
              'd5-dev-tool-ai-agent__prompt--collapsed': !isPlainExpanded,
              'd5-dev-tool-ai-agent__prompt--json': formattedContent.isJson,
            })}
            onClick={() => setIsPlainExpanded(!isPlainExpanded)}
            aria-expanded={isPlainExpanded}
          >
            {formattedContent.display}
          </button>
          {!isPlainExpanded && (
            <span className="d5-dev-tool-ai-agent__prompt-hint">
              {formattedContent.isJson
                ? 'Click to expand formatted JSON'
                : 'Click to expand full response'}
            </span>
          )}
        </>
      )}
    </div>
  );
};
