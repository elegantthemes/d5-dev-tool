// External dependencies.
import React, {
  ReactElement,
  ReactNode,
} from 'react';
import classnames from 'classnames';

type CollapsibleCardProps = {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
  isCurrent?: boolean;
  collapsible?: boolean;
};

/**
 * Bordered card with a clickable header for expand/collapse.
 */
export const CollapsibleCard = ({
  title,
  subtitle,
  isExpanded,
  onToggle,
  children,
  isCurrent = false,
  collapsible = true,
}: CollapsibleCardProps): ReactElement => (
  <div
    className={classnames('d5-dev-tool-ai-agent__card', {
      'd5-dev-tool-ai-agent__card--current': isCurrent,
    })}
  >
    {collapsible ? (
      <button
        type="button"
        className="d5-dev-tool-ai-agent__card-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="d5-dev-tool-ai-agent__card-header-main">
          <h4 className="d5-dev-tool-ai-agent__card-title">{title}</h4>
          {subtitle && (
            <p className="d5-dev-tool-ai-agent__card-subtitle">{subtitle}</p>
          )}
        </div>
        <span className="d5-dev-tool-ai-agent__card-chevron">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>
    ) : (
      <div className="d5-dev-tool-ai-agent__card-header d5-dev-tool-ai-agent__card-header--static">
        <div className="d5-dev-tool-ai-agent__card-header-main">
          <h4 className="d5-dev-tool-ai-agent__card-title">{title}</h4>
          {subtitle && (
            <p className="d5-dev-tool-ai-agent__card-subtitle">{subtitle}</p>
          )}
        </div>
      </div>
    )}
    {(!collapsible || isExpanded) && children && (
      <div className="d5-dev-tool-ai-agent__card-body">
        {children}
      </div>
    )}
  </div>
);
