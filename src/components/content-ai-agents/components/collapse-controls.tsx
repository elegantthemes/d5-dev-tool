// External dependencies.
import React, { ReactElement } from 'react';

type CollapseControlsProps = {
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

/**
 * Expand-all / collapse-all controls for grouped debug cards.
 */
export const CollapseControls = ({
  onExpandAll,
  onCollapseAll,
}: CollapseControlsProps): ReactElement => (
  <div className="d5-dev-tool-ai-agent__collapse-controls">
    <button
      type="button"
      className="d5-dev-tool-ai-agent__collapse-button"
      onClick={onExpandAll}
    >
      Expand All
    </button>
    <button
      type="button"
      className="d5-dev-tool-ai-agent__collapse-button"
      onClick={onCollapseAll}
    >
      Collapse All
    </button>
  </div>
);
