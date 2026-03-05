// External dependencies.
import React, { ReactElement } from 'react';
import {
  reduce,
  size,
} from 'lodash';

// Divi dependencies.
import { useSelect } from '@divi/data';
import { ObjectRenderer } from '@divi/object-renderer';

/**
 * Component for rendering off-canvas selectors and values.
 */
export const ContentCanvasStates = (): ReactElement => {
  const {
    activeCanvas,
    activeCanvasId,
    activeCanvasIdOnEditPost,
    canvases,
    canvasGridView,
  } = useSelect((selectStore: any) => {
    return {
      activeCanvasId: selectStore('divi/off-canvas').getActiveCanvasId(),
      activeCanvasIdOnEditPost: selectStore('divi/edit-post').getActiveCanvasId(),
      activeCanvas: selectStore('divi/off-canvas').getActiveCanvas(),
      canvases: selectStore('divi/off-canvas').getCanvases(),
      canvasGridView: selectStore('divi/app-ui').getCanvasGridView(),
    };
  });

  return (
    <div className="d5-dev-tool-overview">
      <div className="d5-dev-tool-panel-item-wrapper">
        <h3>Active Canvas ID</h3>
        <h4>divi/off-canvas store</h4>
        <p><code>{activeCanvasId}</code></p>

        <h4>divi/edit-post store</h4>
        <p><code>{activeCanvasIdOnEditPost}</code></p>

        <h4>Is Main Canvas</h4>
        <p><code>{activeCanvas?.isMainCanvas ? 'true' : 'false'}</code></p>
      </div>

      <div className="d5-dev-tool-panel-item-wrapper">
        <h3>Canvas Grid View</h3>
        <p><code>{canvasGridView ? 'true' : 'false'}</code></p>
      </div>

      <div className="d5-dev-tool-panel-item-wrapper">
        <h3>Active Canvas</h3>
        <ObjectRenderer values={activeCanvas} />
      </div>

      <div className="d5-dev-tool-panel-item-wrapper">
        <h3>Canvases</h3>
        <ObjectRenderer values={canvases} />
      </div>
    </div>
  );
};
