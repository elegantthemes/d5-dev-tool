// External dependencies.
import React, {
  ReactElement,
  useMemo,
} from 'react';

import {
  extractInferenceResponseFocus,
  type ResponseFocusItem,
} from '../utils/extract-inference-response-focus';
import { CollapsiblePrompt } from './collapsible-prompt';

const formatItemTitle = (item: ResponseFocusItem): string => {
  const typeLabel = 'function_call' === item.type || 'tool_use' === item.type
    ? 'Tool call'
    : 'function_call_output' === item.type || 'tool_result' === item.type
      ? 'Tool output'
      : 'message' === item.type
        ? 'Message'
        : item.type;

  if (item.name) {
    return `${typeLabel} — ${item.name}`;
  }

  return typeLabel;
};

const ResponseFocusItemView = ({ item }: { item: ResponseFocusItem }): ReactElement => (
  <div className="d5-dev-tool-ai-agent__focus-item">
    <div className="d5-dev-tool-ai-agent__focus-item-header">
      <span className="d5-dev-tool-ai-agent__focus-item-title">
        {formatItemTitle(item)}
      </span>
      {item.status && (
        <span className="d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--phase-settled">
          {item.status}
        </span>
      )}
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
      {item.callId && (
        <p className="d5-dev-tool-ai-agent__meta-row">
          <strong>Call ID:</strong> <code>{item.callId}</code>
        </p>
      )}
    </div>
    {item.body.trim() ? (
      <CollapsiblePrompt
        label={item.bodyLabel}
        content={item.body}
        variant={'Arguments' === item.bodyLabel ? 'tool-request' : 'tool-response'}
      />
    ) : (
      <p className="d5-dev-tool-ai-agent__focus-empty-inline">No {item.bodyLabel.toLowerCase()}</p>
    )}
  </div>
);

/**
 * Shows decoded `output` items from a completed inference response.
 */
export const ResponseFocusView = ({ content }: { content: string }): ReactElement => {
  const focus = useMemo(() => extractInferenceResponseFocus(content), [content]);

  if (0 === focus.items.length) {
    return (
      <p className="d5-dev-tool-ai-agent__focus-empty">
        {focus.isComplete
          ? 'Completed response has no output items.'
          : 'Waiting for a completed response. Switch to Formatted or Plain to inspect the live stream.'}
      </p>
    );
  }

  return (
    <div className="d5-dev-tool-ai-agent__focus">
      <div className="d5-dev-tool-ai-agent__focus-section">
        <h5 className="d5-dev-tool-ai-agent__focus-section-title">
          Output ({focus.items.length})
          {!focus.isComplete && (
            <span className="d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--streaming">
              in progress
            </span>
          )}
        </h5>
        <div className="d5-dev-tool-ai-agent__focus-input">
          {focus.items.map((item, index) => (
            <ResponseFocusItemView
              key={`${item.id ?? item.callId ?? item.type}-${index}`}
              item={item}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
