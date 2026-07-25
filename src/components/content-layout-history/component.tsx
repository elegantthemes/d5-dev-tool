// External dependencies.
import React, { ReactElement } from 'react';

// Divi dependencies.
import { useSelect } from '@divi/data';
import { ObjectRenderer } from '@divi/object-renderer';

/**
 * Component for rendering layout history items.
 */
export const ContentLayoutHistory = (): ReactElement => {
  const activeCanvasId = useSelect(selectStore => selectStore('divi/off-canvas')?.getActiveCanvasId?.() ?? '', []);
  const isCanvasGridView = useSelect(selectStore => selectStore('divi/app-ui')?.getCanvasGridView() ?? false, []);
  const layoutItems = useSelect((selectStore: any) => selectStore('divi/history').getLayoutItems({
    canvasId: activeCanvasId,
    isCanvasGridView,
  }));

  return (
    <div className="d5-dev-tool-overview">
      <div className="d5-dev-tool-panel-item-wrapper">
        <h3>Layout History</h3>
        <ObjectRenderer values={layoutItems} />
      </div>
    </div>
  );
};
