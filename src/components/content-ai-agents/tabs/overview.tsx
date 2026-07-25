// External dependencies.
import React, {
  ReactElement,
  useMemo,
} from 'react';

// Divi dependencies.
import { ObjectRenderer } from '@divi/object-renderer';

// Local dependencies.
import { CollapseControls } from '../components/collapse-controls';
import { CollapsibleCard } from '../components/collapsible-card';
import { CollapsiblePrompt } from '../components/collapsible-prompt';
import { useExpandedItems } from '../components/use-expanded-items';
import { ContentAIAgentsStoreUnavailable } from '../store-unavailable';
import { useCurrentChatDebug } from '../use-current-chat-debug';
import '../styles.scss';

const formatTimestamp = (timestamp: number): string => new Date(timestamp).toLocaleString();

/**
 * Overview tab for the active chat and conversation list.
 */
export const ContentAIAgentsOverview = (): ReactElement => {
  const chatDebug = useCurrentChatDebug();
  const conversationIds = useMemo(
    () => (chatDebug?.conversations ?? []).map(conversation => conversation.id),
    [chatDebug?.conversations],
  );
  const {
    isExpanded: isConversationExpanded,
    toggle: toggleConversation,
    expandAll,
    collapseAll,
  } = useExpandedItems(conversationIds, false);
  const {
    isExpanded: isSectionExpanded,
    toggle: toggleSection,
  } = useExpandedItems(['active-chat'], true);

  if (!chatDebug) {
    return <ContentAIAgentsStoreUnavailable />;
  }

  const {
    currentChatId,
    conversations,
    title,
    threadId,
    isStreaming,
    interactionMode,
    pendingInput,
    contextUsage,
    draftPrompt,
    pendingApprovals,
    messages,
  } = chatDebug;

  return (
    <div className="d5-dev-tool-ai-agent">
      <CollapsibleCard
        id="active-chat"
        title="Active Chat"
        subtitle={currentChatId ? `${title || 'Untitled chat'} · ${messages.length} messages` : 'No active chat selected'}
        isExpanded={isSectionExpanded('active-chat')}
        onToggle={() => toggleSection('active-chat')}
      >
        {currentChatId ? (
          <>
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
                <strong>Interaction Mode:</strong> <code>{interactionMode || '—'}</code>
              </p>
              <p className="d5-dev-tool-ai-agent__meta-row">
                <strong>Messages:</strong> <code>{messages.length}</code>
              </p>
            </div>

            {draftPrompt && (
              <CollapsiblePrompt
                label="Draft Prompt"
                content={draftPrompt}
                variant="user-prompt"
              />
            )}
            {pendingInput && (
              <div className="d5-dev-tool-ai-agent__block d5-dev-tool-ai-agent__block--system-prompt">
                <span className="d5-dev-tool-ai-agent__block-label">Pending Input</span>
                <div className="d5-dev-tool-ai-agent__block-content">
                  <ObjectRenderer values={pendingInput} />
                </div>
              </div>
            )}
            {contextUsage && (
              <div className="d5-dev-tool-ai-agent__block d5-dev-tool-ai-agent__block--response">
                <span className="d5-dev-tool-ai-agent__block-label">Context Usage</span>
                <div className="d5-dev-tool-ai-agent__block-content">
                  <ObjectRenderer values={contextUsage} />
                </div>
              </div>
            )}
            {0 < Object.keys(pendingApprovals).length && (
              <div className="d5-dev-tool-ai-agent__block d5-dev-tool-ai-agent__block--tool-request">
                <span className="d5-dev-tool-ai-agent__block-label">Pending Approvals</span>
                <div className="d5-dev-tool-ai-agent__block-content">
                  <ObjectRenderer values={pendingApprovals} />
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="d5-dev-tool-ai-agent__empty">No active chat selected.</p>
        )}
      </CollapsibleCard>

      <div className="d5-dev-tool-ai-agent__section-header">
        <h3 className="d5-dev-tool-ai-agent__section-title">All Chats</h3>
        {0 < conversations.length && (
          <CollapseControls onExpandAll={expandAll} onCollapseAll={collapseAll} />
        )}
      </div>

      {0 === conversations.length ? (
        <p className="d5-dev-tool-ai-agent__empty">No chats yet.</p>
      ) : (
        <div className="d5-dev-tool-ai-agent__card-list">
          {conversations.map(conversation => (
            <CollapsibleCard
              key={conversation.id}
              id={conversation.id}
              isCurrent={conversation.isCurrent}
              title={(
                <>
                  {conversation.title || 'Untitled chat'}
                  {conversation.isCurrent && (
                    <span className="d5-dev-tool-ai-agent__badge">current</span>
                  )}
                </>
              )}
              subtitle={(
                <>
                  <code>{conversation.id}</code>
                  {' · '}
                  {conversation.messageCount} messages
                  {' · '}
                  updated {formatTimestamp(conversation.updatedAt)}
                </>
              )}
              isExpanded={isConversationExpanded(conversation.id)}
              onToggle={() => toggleConversation(conversation.id)}
            >
              <div className="d5-dev-tool-ai-agent__meta-grid">
                <p className="d5-dev-tool-ai-agent__meta-row">
                  <strong>Chat ID:</strong> <code>{conversation.id}</code>
                </p>
                <p className="d5-dev-tool-ai-agent__meta-row">
                  <strong>Title:</strong> <code>{conversation.title || 'Untitled chat'}</code>
                </p>
                <p className="d5-dev-tool-ai-agent__meta-row">
                  <strong>Thread ID:</strong> <code>{conversation.threadId || '—'}</code>
                </p>
                <p className="d5-dev-tool-ai-agent__meta-row">
                  <strong>Messages:</strong> <code>{conversation.messageCount}</code>
                </p>
                <p className="d5-dev-tool-ai-agent__meta-row">
                  <strong>Pending Approvals:</strong> <code>{conversation.pendingApprovalCount}</code>
                </p>
                <p className="d5-dev-tool-ai-agent__meta-row">
                  <strong>Created:</strong> {formatTimestamp(conversation.createdAt)}
                </p>
                <p className="d5-dev-tool-ai-agent__meta-row">
                  <strong>Updated:</strong> {formatTimestamp(conversation.updatedAt)}
                </p>
              </div>
            </CollapsibleCard>
          ))}
        </div>
      )}
    </div>
  );
};
