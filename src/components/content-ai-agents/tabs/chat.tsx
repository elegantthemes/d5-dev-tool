// External dependencies.
import React, { ReactElement } from 'react';

// Local dependencies.
import { ChatMessagesDebug } from '../components/chat-messages-debug';
import { ChatPlanDebug } from '../components/chat-plan-debug';
import { CollapsibleCard } from '../components/collapsible-card';
import { useExpandedItems } from '../components/use-expanded-items';
import { ContentAIAgentsStoreUnavailable } from '../store-unavailable';
import { useCurrentChatDebug } from '../use-current-chat-debug';
import { formatDuration } from '../utils/chat-metrics';
import '../styles.scss';

/**
 * Chat tab for user/system messages and tool-call debugging.
 */
export const ContentAIAgentsChat = (): ReactElement => {
  const chatDebug = useCurrentChatDebug();
  const {
    isExpanded,
    toggle,
  } = useExpandedItems(['current-chat'], true);

  if (!chatDebug) {
    return <ContentAIAgentsStoreUnavailable />;
  }

  const {
    currentChatId,
    title,
    threadId,
    isStreaming,
    messages,
    chatContext,
    chatMetrics,
  } = chatDebug;
  const latestTurn = chatMetrics.turnDurations[chatMetrics.turnDurations.length - 1] ?? null;
  const latestTurnLabel = latestTurn?.isInProgress ? 'Latest Turn (in progress)' : 'Latest Turn';

  return (
    <div className="d5-dev-tool-ai-agent">
      <CollapsibleCard
        id="current-chat"
        title="Current Chat"
        subtitle={currentChatId ? `${title || 'Untitled chat'} · ${messages.length} messages` : 'No active chat selected'}
        isExpanded={isExpanded('current-chat')}
        onToggle={() => toggle('current-chat')}
      >
        {currentChatId ? (
          <>
            <div className="d5-dev-tool-ai-agent__stats">
              <div className="d5-dev-tool-ai-agent__stat">
                <span className="d5-dev-tool-ai-agent__stat-label">Total Tokens</span>
                <strong className="d5-dev-tool-ai-agent__stat-value">
                  {chatMetrics.totalTokens.toLocaleString()}
                </strong>
              </div>
              <div className="d5-dev-tool-ai-agent__stat">
                <span className="d5-dev-tool-ai-agent__stat-label">{latestTurnLabel}</span>
                <strong className="d5-dev-tool-ai-agent__stat-value">
                  {formatDuration(chatMetrics.latestTurnDurationMs)}
                </strong>
              </div>
            </div>

            <div className="d5-dev-tool-ai-agent__meta-grid">
              <p className="d5-dev-tool-ai-agent__meta-row">
                <strong>Chat ID:</strong> <code>{currentChatId}</code>
              </p>
              <p className="d5-dev-tool-ai-agent__meta-row">
                <strong>Title:</strong> <code>{title || 'Untitled chat'}</code>
              </p>
              <p className="d5-dev-tool-ai-agent__meta-row">
                <strong>Thread ID:</strong> <code>{threadId || '—'}</code>
              </p>
              <p className="d5-dev-tool-ai-agent__meta-row">
                <strong>Status:</strong>
                {' '}
                <span className={`d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--${isStreaming ? 'streaming' : 'idle'}`}>
                  {isStreaming ? 'streaming' : 'idle'}
                </span>
              </p>
              <p className="d5-dev-tool-ai-agent__meta-row">
                <strong>Completed Turn Time:</strong> <code>{formatDuration(chatMetrics.totalTurnDurationMs)}</code>
              </p>
            </div>
          </>
        ) : (
          <p className="d5-dev-tool-ai-agent__empty">No active chat selected.</p>
        )}
      </CollapsibleCard>

      <ChatPlanDebug
        chatContext={chatContext}
        hasActiveChat={Boolean(currentChatId)}
      />

      <ChatMessagesDebug
        messages={messages}
        turnDurations={chatMetrics.turnDurations}
        hasActiveChat={Boolean(currentChatId)}
      />
    </div>
  );
};
