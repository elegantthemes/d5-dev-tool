// External dependencies.
import React, { ReactElement } from 'react';

// Local dependencies.
import { type NetworkRecord } from '../utils/network-recorder';

export type ExecutionViewFilters = {
  phaseEvents: boolean;
  wpRestEndpoint: boolean;
  aiEndpoint: boolean;
};

export const DEFAULT_EXECUTION_VIEW_FILTERS: ExecutionViewFilters = {
  phaseEvents: true,
  wpRestEndpoint: true,
  aiEndpoint: true,
};

type ExecutionFilterKey = keyof ExecutionViewFilters;

const FILTER_OPTIONS: {
  key: ExecutionFilterKey;
  label: string;
}[] = [
  { key: 'phaseEvents', label: 'Phase Events' },
  { key: 'wpRestEndpoint', label: 'WP REST endpoint' },
  { key: 'aiEndpoint', label: 'AI endpoint' },
];

/**
 * Returns network records visible under the current endpoint filters.
 */
export const filterNetworkRecordsByView = (
  records: NetworkRecord[],
  filters: ExecutionViewFilters,
): NetworkRecord[] => {
  if (!filters.wpRestEndpoint && !filters.aiEndpoint) {
    return [];
  }

  return records.filter(record => {
    if ('wp-rest' === record.kind) {
      return filters.wpRestEndpoint;
    }

    if ('et-ai' === record.kind) {
      return filters.aiEndpoint;
    }

    return true;
  });
};

/**
 * Checkbox filters for the Execution tab content sections.
 */
export const ExecutionFilters = ({
  filters,
  onChange,
}: {
  filters: ExecutionViewFilters;
  onChange: (filters: ExecutionViewFilters) => void;
}): ReactElement => (
  <div className="d5-dev-tool-ai-agent__execution-filters">
    <span className="d5-dev-tool-ai-agent__execution-filters-label">Show:</span>
    {FILTER_OPTIONS.map(({ key, label }) => (
      <label key={key} className="d5-dev-tool-ai-agent__execution-filter">
        <input
          type="checkbox"
          checked={filters[key]}
          onChange={() => onChange({
            ...filters,
            [key]: !filters[key],
          })}
        />
        <span>{label}</span>
      </label>
    ))}
  </div>
);
