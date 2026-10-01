// External dependencies.
import React, {
  ReactElement,
  useMemo,
  useState,
} from 'react';
import classnames from 'classnames';

import { copyTextToClipboard } from '../utils/copy-to-clipboard';
import {
  extractInferencePayloadFocus,
  type PayloadFocusItem,
  type PayloadFocusToolCall,
} from '../utils/extract-inference-payload-focus';
import { formatJsonContent } from '../utils/format-json-content';
import {
  CollapsiblePrompt,
  type PromptVariant,
} from './collapsible-prompt';
import { ViewTabs } from './view-tabs';

type PayloadViewMode = 'focus' | 'plain';

type CollapsiblePayloadProps = {
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

const PAYLOAD_VIEW_TABS = [
  { id: 'focus', label: 'Focus' },
  { id: 'plain', label: 'Plain' },
];

const CollapsibleTools = ({ tools }: { tools: string[] }): ReactElement => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div
        className={classnames('d5-dev-tool-ai-agent__focus-value', {
          'd5-dev-tool-ai-agent__focus-value--collapsed': !isExpanded,
        })}
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={event => {
          if ('Enter' === event.key || ' ' === event.key) {
            event.preventDefault();
            setIsExpanded(current => !current);
          }
        }}
        aria-expanded={isExpanded}
      >
        <ul className="d5-dev-tool-ai-agent__focus-tool-list">
          {tools.map(name => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>
      </div>
      {!isExpanded && (
        <span className="d5-dev-tool-ai-agent__prompt-hint">
          Click to expand tools
        </span>
      )}
    </>
  );
};

const ToolCallFocusItem = ({ item }: { item: PayloadFocusToolCall }): ReactElement => (
  <div className="d5-dev-tool-ai-agent__focus-item">
    <div className="d5-dev-tool-ai-agent__focus-item-header">
      <span className="d5-dev-tool-ai-agent__focus-item-title">
        Tool call
        {item.name ? ` — ${item.name}` : ''}
      </span>
    </div>
    <div className="d5-dev-tool-ai-agent__meta-grid d5-dev-tool-ai-agent__focus-item-meta">
      {item.name && (
        <p className="d5-dev-tool-ai-agent__meta-row">
          <strong>Name:</strong> <code>{item.name}</code>
        </p>
      )}
      {item.id && (
        <p className="d5-dev-tool-ai-agent__meta-row">
          <strong>ID:</strong> <code>{item.id}</code>
        </p>
      )}
    </div>
    {item.output.trim() ? (
      <CollapsiblePrompt
        label="Output"
        content={item.output}
        variant="tool-response"
      />
    ) : (
      <p className="d5-dev-tool-ai-agent__focus-empty-inline">No output</p>
    )}
  </div>
);

const PayloadFocusItemView = ({
  item,
}: {
  item: PayloadFocusItem;
}): ReactElement => {
  if ('tool_call' === item.kind) {
    return <ToolCallFocusItem item={item} />;
  }

  return (
    <CollapsiblePrompt
      label={'system' === item.kind ? 'System' : 'User'}
      content={item.content}
      variant={'system' === item.kind ? 'system-prompt' : 'user-prompt'}
    />
  );
};

const PayloadFocusView = ({ content }: { content: string }): ReactElement => {
  const focus = useMemo(() => extractInferencePayloadFocus(content), [content]);

  if (!focus.isParsed) {
    return (
      <p className="d5-dev-tool-ai-agent__focus-empty">
        Payload could not be parsed. Switch to the Plain tab to inspect the raw body.
      </p>
    );
  }

  return (
    <div className="d5-dev-tool-ai-agent__focus">
      <div className="d5-dev-tool-ai-agent__focus-section">
        <h5 className="d5-dev-tool-ai-agent__focus-section-title">Model</h5>
        {focus.model ? (
          <code className="d5-dev-tool-ai-agent__focus-model">{focus.model}</code>
        ) : (
          <p className="d5-dev-tool-ai-agent__focus-empty-inline">Not specified</p>
        )}
      </div>

      {null !== focus.tools && (
        <div className="d5-dev-tool-ai-agent__focus-section">
          <h5 className="d5-dev-tool-ai-agent__focus-section-title">
            Tools ({focus.tools.length})
          </h5>
          {0 === focus.tools.length ? (
            <p className="d5-dev-tool-ai-agent__focus-empty-inline">None</p>
          ) : (
            <CollapsibleTools tools={focus.tools} />
          )}
        </div>
      )}

      <div className="d5-dev-tool-ai-agent__focus-section">
        <h5 className="d5-dev-tool-ai-agent__focus-section-title">Input</h5>
        {0 === focus.items.length ? (
          <p className="d5-dev-tool-ai-agent__focus-empty-inline">No input messages</p>
        ) : (
          <div className="d5-dev-tool-ai-agent__focus-input">
            {focus.items.map((item, index) => (
              <PayloadFocusItemView
                key={`${item.kind}-${index}`}
                item={item}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Request payload with a focused summary view and a prettified plain JSON view.
 */
export const CollapsiblePayload = ({
  label,
  content,
  variant,
}: CollapsiblePayloadProps): ReactElement => {
  const [viewMode, setViewMode] = useState<PayloadViewMode>('focus');
  const [isPlainExpanded, setIsPlainExpanded] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const formattedContent = useMemo(() => formatJsonContent(content), [content]);
  const hasContent = Boolean(content.trim());

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      await copyTextToClipboard(
        formattedContent.copyValue,
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
      : (formattedContent.isJson ? 'Copy JSON' : 'Copy');

  return (
    <div className={classnames('d5-dev-tool-ai-agent__block', variantClassMap[variant])}>
      <div className="d5-dev-tool-ai-agent__block-label-row">
        <span className="d5-dev-tool-ai-agent__block-label">{label}</span>
        <div className="d5-dev-tool-ai-agent__response-actions">
          <ViewTabs
            ariaLabel={`${label} view`}
            tabs={PAYLOAD_VIEW_TABS}
            value={viewMode}
            onChange={nextMode => setViewMode(nextMode as PayloadViewMode)}
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
        <PayloadFocusView content={content} />
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
                : 'Click to expand full payload'}
            </span>
          )}
        </>
      )}
    </div>
  );
};
