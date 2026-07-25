// External dependencies.
import React, { ReactElement } from 'react';

// WordPress dependencies.
import { __ } from '@wordpress/i18n';

import { AI_AGENT_STORE } from './use-ai-agent-selectors';

/**
 * Fallback UI when the AI Agent store is not registered.
 */
export const ContentAIAgentsStoreUnavailable = (): ReactElement => (
  <div className="d5-dev-tool-overview">
    <p>
      {__('The AI Agent store is not available.', 'et_builder')}
      {' '}
      ({AI_AGENT_STORE})
    </p>
  </div>
);
