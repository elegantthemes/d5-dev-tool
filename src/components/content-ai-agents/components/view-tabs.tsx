// External dependencies.
import React, {
  ReactElement,
} from 'react';
import classnames from 'classnames';

export type ViewTabOption = {
  id: string;
  label: string;
};

type ViewTabsProps = {
  ariaLabel: string;
  tabs: ViewTabOption[];
  value: string;
  onChange: (value: string) => void;
};

/**
 * Compact tablist used by payload and response body views.
 */
export const ViewTabs = ({
  ariaLabel,
  tabs,
  value,
  onChange,
}: ViewTabsProps): ReactElement => (
  <div
    className="d5-dev-tool-ai-agent__view-tabs"
    role="tablist"
    aria-label={ariaLabel}
  >
    {tabs.map(tab => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={tab.id === value}
        className={classnames('d5-dev-tool-ai-agent__view-tab', {
          'd5-dev-tool-ai-agent__view-tab--active': tab.id === value,
        })}
        onClick={() => onChange(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
