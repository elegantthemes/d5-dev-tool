// External dependencies.
import React, {
  ReactElement,
  ReactNode,
  useState,
} from 'react';

// Divi dependencies.
import { ObjectRenderer } from '@divi/object-renderer';

type ContentAIAgentsSelectorItemProps = {
  label: string;
  value: unknown;
  renderValue?: (value: unknown) => ReactNode;
};

/**
 * Expandable selector value renderer for AI Agent store debug panels.
 */
export const ContentAIAgentsSelectorItem = ({
  label,
  value,
  renderValue,
}: ContentAIAgentsSelectorItemProps): ReactElement => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPrimitive = null === value || ['string', 'number', 'boolean', 'undefined'].includes(typeof value);

  return (
    <div className="d5-dev-tool-panel-item-wrapper">
      <h3>{label}</h3>
      <h4>divi/ai-agent store</h4>
      {isPrimitive ? (
        <p><code>{String(value)}</code></p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          {isExpanded && (
            renderValue ? renderValue(value) : <ObjectRenderer values={value} />
          )}
        </>
      )}
    </div>
  );
};
