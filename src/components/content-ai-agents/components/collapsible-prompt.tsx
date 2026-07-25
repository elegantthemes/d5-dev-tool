// External dependencies.
import React, {
  ReactElement,
  useMemo,
  useState,
} from 'react';
import classnames from 'classnames';

import { formatJsonContent } from '../utils/format-json-content';

type PromptVariant = 'user-prompt' | 'system-prompt' | 'response' | 'tool-request' | 'tool-response';

type CollapsiblePromptProps = {
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

/**
 * Full prompt text with a 3-line preview, click-to-expand, and JSON pretty-print.
 */
export const CollapsiblePrompt = ({
  label,
  content,
  variant,
}: CollapsiblePromptProps): ReactElement => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const formattedContent = useMemo(() => formatJsonContent(content), [content]);
  const hasContent = Boolean(content.trim());

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(formattedContent.copyValue);
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
      : 'Copy JSON';

  return (
    <div className={classnames('d5-dev-tool-ai-agent__block', variantClassMap[variant])}>
      <div className="d5-dev-tool-ai-agent__block-label-row">
        <span className="d5-dev-tool-ai-agent__block-label">{label}</span>
        {formattedContent.isJson && (
          <button
            type="button"
            className="d5-dev-tool-ai-agent__copy-button"
            onClick={handleCopy}
          >
            {copyLabel}
          </button>
        )}
      </div>
      <button
        type="button"
        className={classnames('d5-dev-tool-ai-agent__prompt', {
          'd5-dev-tool-ai-agent__prompt--collapsed': !isExpanded,
          'd5-dev-tool-ai-agent__prompt--json': formattedContent.isJson,
        })}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        {formattedContent.display}
      </button>
      {!isExpanded && (
        <span className="d5-dev-tool-ai-agent__prompt-hint">
          {formattedContent.isJson ? 'Click to expand formatted JSON' : 'Click to expand full prompt'}
        </span>
      )}
    </div>
  );
};
