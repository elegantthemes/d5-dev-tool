// External dependencies.
import React, { ReactElement } from 'react';

// Local dependencies.
import { CollapsibleCard } from './collapsible-card';
import { useExpandedItems } from './use-expanded-items';
import {
  type ChatDebugContext,
  type ChatDebugTodoStatus,
} from '../use-current-chat-debug';

const TODO_STATUS_LABELS: Record<ChatDebugTodoStatus, string> = {
  pending: 'pending',
  in_progress: 'in progress',
  completed: 'done',
  cancelled: 'cancelled',
};

const formatTimestamp = (timestamp: number): string => new Date(timestamp).toLocaleString();

const ContextList = ({
  label,
  items,
}: {
  label: string;
  items: string[];
}): ReactElement | null => {
  if (0 === items.length) {
    return null;
  }

  return (
    <div className="d5-dev-tool-ai-agent__context-group">
      <span className="d5-dev-tool-ai-agent__context-label">{label}</span>
      <ul className="d5-dev-tool-ai-agent__context-list">
        {items.map((item, index) => (
          <li key={`${label}-${index}`} className="d5-dev-tool-ai-agent__context-item">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const hasChatContextContent = (chatContext: ChatDebugContext | null): boolean => {
  if (!chatContext) {
    return false;
  }

  return Boolean(chatContext.objective)
    || 0 < (chatContext.notes?.length ?? 0)
    || 0 < (chatContext.decisions?.length ?? 0)
    || 0 < (chatContext.blockers?.length ?? 0);
};

/**
 * Displays the active chat's TODO list and continuation context.
 */
export const ChatPlanDebug = ({
  chatContext,
  hasActiveChat = true,
}: {
  chatContext: ChatDebugContext | null;
  hasActiveChat?: boolean;
}): ReactElement | null => {
  const {
    isExpanded,
    toggle,
  } = useExpandedItems(['todos', 'chat-context'], true);

  if (!hasActiveChat) {
    return null;
  }

  const todos = chatContext?.todos ?? [];
  const showContext = hasChatContextContent(chatContext);

  return (
    <>
      <CollapsibleCard
        id="todos"
        title="TODOs"
        subtitle={0 < todos.length ? `${todos.length} item${1 === todos.length ? '' : 's'}` : 'No TODOs yet'}
        isExpanded={isExpanded('todos')}
        onToggle={() => toggle('todos')}
      >
        {0 === todos.length ? (
          <p className="d5-dev-tool-ai-agent__empty">No TODOs recorded for this chat yet.</p>
        ) : (
          <ul className="d5-dev-tool-ai-agent__todo-list">
            {todos.map(todo => (
              <li key={todo.id} className="d5-dev-tool-ai-agent__todo-item">
                <div className="d5-dev-tool-ai-agent__todo-header">
                  <span className={`d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--todo-${todo.status}`}>
                    {TODO_STATUS_LABELS[todo.status] ?? todo.status}
                  </span>
                  <code className="d5-dev-tool-ai-agent__todo-id">{todo.id}</code>
                </div>
                <p className="d5-dev-tool-ai-agent__todo-content">{todo.content}</p>
                <p className="d5-dev-tool-ai-agent__todo-meta">
                  updated {formatTimestamp(todo.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleCard>

      <CollapsibleCard
        id="chat-context"
        title="Chat Context"
        subtitle={showContext
          ? (chatContext?.objective || 'Objective, notes, decisions, and blockers')
          : 'No context recorded yet'}
        isExpanded={isExpanded('chat-context')}
        onToggle={() => toggle('chat-context')}
      >
        {!showContext ? (
          <p className="d5-dev-tool-ai-agent__empty">No chat context recorded for this chat yet.</p>
        ) : (
          <div className="d5-dev-tool-ai-agent__context-body">
            {chatContext?.objective && (
              <div className="d5-dev-tool-ai-agent__context-group">
                <span className="d5-dev-tool-ai-agent__context-label">Objective</span>
                <p className="d5-dev-tool-ai-agent__context-objective">{chatContext.objective}</p>
              </div>
            )}
            <ContextList label="Decisions" items={chatContext?.decisions ?? []} />
            <ContextList label="Blockers" items={chatContext?.blockers ?? []} />
            <ContextList label="Notes" items={chatContext?.notes ?? []} />
            {chatContext?.updatedAt && (
              <p className="d5-dev-tool-ai-agent__todo-meta">
                Last updated {formatTimestamp(chatContext.updatedAt)}
              </p>
            )}
          </div>
        )}
      </CollapsibleCard>
    </>
  );
};
