// External dependencies.
import React, { ReactElement } from 'react';

// Local dependencies.
import { BuildPhasesDebug } from '../components/build-phases-debug';
import { ContentAIAgentsStoreUnavailable } from '../store-unavailable';
import { useCurrentChatDebug } from '../use-current-chat-debug';
import '../styles.scss';

/**
 * Live phase-by-phase debugger for AI Agent Build-mode turns.
 */
export const ContentAIAgentsExecution = (): ReactElement => {
  const chatDebug = useCurrentChatDebug();

  if (!chatDebug) {
    return <ContentAIAgentsStoreUnavailable />;
  }

  return (
    <div className="d5-dev-tool-ai-agent">
      <BuildPhasesDebug chatDebug={chatDebug} />
    </div>
  );
};
