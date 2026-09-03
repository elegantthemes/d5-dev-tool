// External dependencies.
import React, {
  ReactElement,
  useMemo,
} from 'react';

// Local dependencies.
import {
  getNetworkRole,
  NETWORK_ROLE_LABELS,
} from '../utils/attribute-network-records';
import { type NetworkRecord, type NetworkRecordKind } from '../utils/network-recorder';
import { CollapseControls } from './collapse-controls';
import { CollapsiblePrompt } from './collapsible-prompt';
import { useExpandedItems } from './use-expanded-items';

const KIND_LABELS: Record<NetworkRecordKind, string> = {
  'et-ai': 'ET AI Server',
  'wp-rest': 'WP REST',
  other: 'Other',
};

const PATH_LENGTH_LIMIT = 56;

const formatClockTime = (timestamp: number | null): string => (
  null === timestamp ? '—' : new Date(timestamp).toLocaleTimeString()
);

const formatRequestDuration = (durationMs: number | null): string => (
  null === durationMs ? 'in flight' : `${durationMs}ms`
);

const getStatusLabel = (record: NetworkRecord): string => {
  if (record.error) {
    return `error: ${record.error}`;
  }

  if (null === record.status) {
    return 'pending';
  }

  return `${record.status} ${record.statusText}`.trim();
};

const getStatusVariant = (record: NetworkRecord): string => {
  if (record.error || (null !== record.ok && !record.ok)) {
    return 'error';
  }

  if (null === record.status) {
    return 'active';
  }

  return 'observed';
};

/**
 * Origin-less, length-capped URL for the collapsed header.
 */
const shortenUrl = (url: string): string => {
  const path = url.replace(/^https?:\/\/[^/]+/i, '') || url;
  const queryStart = path.indexOf('?');
  const pathname = -1 === queryStart ? path : path.slice(0, queryStart);
  const query = -1 === queryStart ? '' : path.slice(queryStart + 1);
  const trimmedPath = PATH_LENGTH_LIMIT < pathname.length
    ? `…${pathname.slice(-PATH_LENGTH_LIMIT)}`
    : pathname;
  const queryCount = query ? query.split('&').length : 0;

  return 0 < queryCount
    ? `${trimmedPath} (+${queryCount} query param${1 === queryCount ? '' : 's'})`
    : trimmedPath;
};

/**
 * Renders captured HTTP traffic (URL, payload, response) for one Build phase,
 * collapsed to one scannable line per request.
 */
export const NetworkRequestsDebug = ({
  label,
  records,
  emptyMessage,
}: {
  label: string;
  records: NetworkRecord[];
  emptyMessage: string;
}): ReactElement => {
  const recordIds = useMemo(() => records.map(record => record.id), [records]);
  const {
    isExpanded,
    toggle,
    expandAll,
    collapseAll,
  } = useExpandedItems(recordIds, false);

  if (0 === records.length) {
    return <p className="d5-dev-tool-ai-agent__empty">{emptyMessage}</p>;
  }

  return (
    <div className="d5-dev-tool-ai-agent__network">
      <div className="d5-dev-tool-ai-agent__section-header">
        <span className="d5-dev-tool-ai-agent__context-label">
          {label} ({records.length})
        </span>
        <CollapseControls onExpandAll={expandAll} onCollapseAll={collapseAll} />
      </div>
      {records.map(record => {
        const recordExpanded = isExpanded(record.id);

        return (
          <div key={record.id} className="d5-dev-tool-ai-agent__network-item">
            <button
              type="button"
              className="d5-dev-tool-ai-agent__step-header d5-dev-tool-ai-agent__step-header--stacked"
              onClick={() => toggle(record.id)}
              aria-expanded={recordExpanded}
            >
              <span className="d5-dev-tool-ai-agent__step-header-main">
                <span className="d5-dev-tool-ai-agent__step-title">
                  <code>{record.method}</code> {shortenUrl(record.url)}
                  <span className={`d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--phase-${getStatusVariant(record)}`}>
                    {getStatusLabel(record)}
                  </span>
                </span>
                <span className="d5-dev-tool-ai-agent__step-preview">
                  {NETWORK_ROLE_LABELS[getNetworkRole(record.url)]}
                  {' · '}
                  {KIND_LABELS[record.kind]}
                  {' · '}
                  {formatClockTime(record.startedAt)}
                  {' · '}
                  {formatRequestDuration(record.durationMs)}
                </span>
              </span>
              <span className="d5-dev-tool-ai-agent__card-chevron">
                {recordExpanded ? '▼' : '▶'}
              </span>
            </button>
            {recordExpanded && (
              <div className="d5-dev-tool-ai-agent__step-body">
                <p className="d5-dev-tool-ai-agent__network-url">
                  <code>{record.url}</code>
                </p>
                <div className="d5-dev-tool-ai-agent__meta-grid">
                  <p className="d5-dev-tool-ai-agent__meta-row">
                    <strong>Status:</strong> <code>{getStatusLabel(record)}</code>
                  </p>
                  <p className="d5-dev-tool-ai-agent__meta-row">
                    <strong>Started:</strong> <code>{formatClockTime(record.startedAt)}</code>
                    {' · '}
                    <strong>Ended:</strong> <code>{formatClockTime(record.endedAt)}</code>
                    {' · '}
                    <strong>Duration:</strong> <code>{formatRequestDuration(record.durationMs)}</code>
                  </p>
                </div>
                {record.requestBody && (
                  <CollapsiblePrompt
                    label="Request Payload"
                    content={record.requestBody}
                    variant="tool-request"
                  />
                )}
                {record.responseBody && (
                  <CollapsiblePrompt
                    label="Response"
                    content={record.responseBody}
                    variant="tool-response"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
