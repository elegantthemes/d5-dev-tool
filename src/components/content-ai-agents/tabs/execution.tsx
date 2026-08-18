// External dependencies.
import React, {
  ReactElement,
  useState,
} from 'react';

// Local dependencies.
import { BuildPhasesDebug } from '../components/build-phases-debug';
import {
  DEFAULT_EXECUTION_VIEW_FILTERS,
  ExecutionFilters,
} from '../components/execution-filters';
import { ContentAIAgentsStoreUnavailable } from '../store-unavailable';
import { useCurrentChatDebug } from '../use-current-chat-debug';
import '../styles.scss';

/**
 * Live phase-by-phase debugger for AI Agent Build-mode turns.
 */
export const ContentAIAgentsExecution = (): ReactElement => {
  const chatDebug = useCurrentChatDebug();
  const [viewFilters, setViewFilters] = useState(DEFAULT_EXECUTION_VIEW_FILTERS);

  if (!chatDebug) {
    return <ContentAIAgentsStoreUnavailable />;
  }

  return (
    <div className="d5-dev-tool-ai-agent">
      <ExecutionFilters filters={viewFilters} onChange={setViewFilters} />
      <BuildPhasesDebug chatDebug={chatDebug} viewFilters={viewFilters} />
    </div>
  );
};
