// External dependencies.
import React, {
  ReactElement,
  useState,
} from 'react';

// Divi dependencies.
import { useSelect } from '@divi/data';
import { ObjectRenderer } from '@divi/object-renderer';

type CanvasesHistoryItem = {
  id?: string;
  [key: string]: unknown;
};

/**
 * Component for rendering canvases history items.
 */
export const ContentCanvasesHistory = (): ReactElement => {
  const canvases = useSelect((selectStore: any): CanvasesHistoryItem[] => {
    const allState = selectStore('divi/history').allState();
    const canvasItems = allState?.layout?.canvases;

    if (Array.isArray(canvasItems)) {
      return canvasItems;
    }

    if (canvasItems && 'object' === typeof canvasItems) {
      return Object.entries(canvasItems).map(([key, value]) => ({
        ...(value as CanvasesHistoryItem),
        id: key,
      }));
    }

    return [];
  });

  const [expandedCanvases, setExpandedCanvases] = useState<Record<string, boolean>>({});

  const toggleCanvasState = (canvasKey: string) => {
    setExpandedCanvases(previousState => ({
      ...previousState,
      [canvasKey]: !previousState[canvasKey],
    }));
  };

  return (
    <div className="d5-dev-tool-overview">
      {canvases.map((canvas: CanvasesHistoryItem, index: number) => {
        const canvasKey = String(canvas?.id ?? index);
        const isExpanded = Boolean(expandedCanvases[canvasKey]);

        return (
          <div key={canvasKey} className="d5-dev-tool-panel-item-wrapper">
            <h3>{canvas?.id}</h3>
            <button
              onClick={() => toggleCanvasState(canvasKey)}
            >{isExpanded ? 'Collapse' : 'Expand'}</button>
            {isExpanded && (
              <ObjectRenderer values={canvas} />
            )}
          </div>
        );
      })}
    </div>
  );
};
