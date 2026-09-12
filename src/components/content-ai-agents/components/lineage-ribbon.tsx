// External dependencies.
import React, { ReactElement } from 'react';
import classnames from 'classnames';

// Local dependencies.
import { type SegmentLineage } from '../utils/analyze-run';
import { formatCompactTokens } from '../utils/format-compact-tokens';

export const LINEAGE_RIBBON_MAX_ROWS = 8;

type LineageRibbonProps = {
  lineages: SegmentLineage[];
  requestOrdinals: number[];
  selectedHash: string | null;
  onSelectLineage: (hash: string | null) => void;
};

/**
 * Gantt-style redundancy shape: rows are sticky segments, columns are requests.
 */
export const LineageRibbon = ({
  lineages,
  requestOrdinals,
  selectedHash,
  onSelectLineage,
}: LineageRibbonProps): ReactElement | null => {
  const rows = lineages
    .filter(lineage => 1 < lineage.occurrences)
    .slice(0, LINEAGE_RIBBON_MAX_ROWS);

  if (0 === rows.length || 0 === requestOrdinals.length) {
    return null;
  }

  const columnTemplate = `minmax(168px, 1.8fr) repeat(${requestOrdinals.length}, minmax(18px, 1fr))`;

  return (
    <section className="d5-dev-tool-ai-agent__ribbon">
      <p className="d5-dev-tool-ai-agent__context-label">
        Text sent more than once (count the cells = how many requests)
      </p>
      <div className="d5-dev-tool-ai-agent__ribbon-grid" role="list">
        <div className="d5-dev-tool-ai-agent__ribbon-head" style={{ gridTemplateColumns: columnTemplate }}>
          <span className="d5-dev-tool-ai-agent__ribbon-label-spacer" />
          {requestOrdinals.map(ordinal => (
            <span key={ordinal} className="d5-dev-tool-ai-agent__ribbon-col-label">
              R{ordinal}
            </span>
          ))}
        </div>
        {rows.map(lineage => {
          const isSelected = lineage.hash === selectedHash;
          const present = new Set(lineage.presentOrdinals);
          const extraCopies = lineage.occurrences - 1;
          const timesLabel = `${lineage.occurrences} ${1 === lineage.occurrences ? 'time' : 'times'}`;
          const extraLabel = `${extraCopies} extra ${1 === extraCopies ? 'copy' : 'copies'}`;

          return (
            <button
              key={`${lineage.role}-${lineage.hash}`}
              type="button"
              role="listitem"
              className={classnames('d5-dev-tool-ai-agent__ribbon-row', {
                'd5-dev-tool-ai-agent__ribbon-row--selected': isSelected,
              })}
              style={{ gridTemplateColumns: columnTemplate }}
              onClick={() => onSelectLineage(isSelected ? null : lineage.hash)}
              aria-pressed={isSelected}
              title={`${lineage.label}: ${timesLabel}, ${extraLabel}, ${formatCompactTokens(lineage.carriedTokenCost)} extra tokens`}
            >
              <span className="d5-dev-tool-ai-agent__ribbon-label">
                <span className="d5-dev-tool-ai-agent__ribbon-label-text">{lineage.label}</span>
                <span className="d5-dev-tool-ai-agent__ribbon-cost">
                  {timesLabel} · {extraLabel}
                </span>
              </span>
              {requestOrdinals.map(ordinal => (
                <span
                  key={ordinal}
                  className={classnames('d5-dev-tool-ai-agent__ribbon-cell', {
                    'd5-dev-tool-ai-agent__ribbon-cell--present': present.has(ordinal),
                  })}
                />
              ))}
            </button>
          );
        })}
      </div>
    </section>
  );
};
