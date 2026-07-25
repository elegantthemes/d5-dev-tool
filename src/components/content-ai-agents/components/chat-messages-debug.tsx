// External dependencies.
import React, {
  ReactElement,
  useMemo,
} from 'react';
import { map } from 'lodash';

// Divi dependencies.
import { ObjectRenderer } from '@divi/object-renderer';

import { isToolDebugStep, parseToolCallStep } from '../utils/parse-tool-call';
import { formatDuration, getAssistantTurnDuration, type ChatTurnDuration } from '../utils/chat-metrics';
import '../styles.scss';
import { CollapseControls } from './collapse-controls';
import { CollapsibleCard } from './collapsible-card';
import { CollapsiblePrompt } from './collapsible-prompt';
import { useExpandedItems } from './use-expanded-items';

type ChatMessage = {
  id?: string;
  role?: string;
  content?: string;
  timestamp?: number;
  isStreaming?: boolean;
  attachments?: unknown[];
  steps?: Array<{
    id?: string;
    type?: string;
    label?: string;
    content?: string;
    argsPreview?: string;
    status?: string;
    actionId?: string;
    agentType?: string;
    options?: string[];
    selectedAnswer?: string;
  }>;
};

type ChatMessagesDebugProps = {
  messages: unknown[];
  turnDurations?: ChatTurnDuration[];
  hasActiveChat?: boolean;
};

const formatTimestamp = (timestamp?: number): string => {
  if (!timestamp) {
    return '—';
  }

  return new Date(timestamp).toLocaleString();
};

const getStepKindLabel = (type?: string): string => {
  switch (type) {
    case 'thinking':
      return 'System / Thinking';
    case 'tool_call':
      return 'Tool Call';
    case 'sub_agent':
      return 'Sub Agent';
    case 'approval':
      return 'Approval Request';
    case 'clarification':
      return 'Clarification';
    case 'text':
      return 'Assistant Response';
    case 'notes':
      return 'Notes';
    case 'status':
      return 'Status';
    case 'routing':
      return 'Routing';
    case 'summarizing':
      return 'Summarizing';
    default:
      return type || 'Step';
  }
};

const getMessageSubtitle = (message: ChatMessage): string => {
  if ('user' === message.role) {
    return 'User prompt';
  }

  if (message.isStreaming) {
    return 'Assistant turn · streaming';
  }

  const stepCount = message.steps?.length ?? 0;

  return `Assistant turn · ${stepCount} step${1 === stepCount ? '' : 's'}`;
};

const ToolCallDebug = ({ step }: { step: NonNullable<ChatMessage['steps']>[number] }): ReactElement => {
  const parsed = parseToolCallStep(step);

  return (
    <div className="d5-dev-tool-ai-agent__step-body">
      <p className="d5-dev-tool-ai-agent__meta-row">
        <strong>Tool:</strong> <code>{parsed.toolName}</code>
        {parsed.status && (
          <>
            {' '}
            <strong>Status:</strong> <code>{parsed.status}</code>
          </>
        )}
      </p>
      {parsed.params && (
        <CollapsiblePrompt
          label="Request Parameters"
          content={parsed.params}
          variant="tool-request"
        />
      )}
      {parsed.result && (
        <CollapsiblePrompt
          label="Returned Value"
          content={parsed.result}
          variant="tool-response"
        />
      )}
      {!parsed.params && !parsed.result && parsed.rawContent && (
        <CollapsiblePrompt
          label="Tool Details"
          content={parsed.rawContent}
          variant="tool-request"
        />
      )}
    </div>
  );
};

const AssistantStepDebug = ({ step }: { step: NonNullable<ChatMessage['steps']>[number] }): ReactElement => {
  if (isToolDebugStep(step)) {
    return <ToolCallDebug step={step} />;
  }

  if ('thinking' === step.type) {
    return (
      <div className="d5-dev-tool-ai-agent__step-body">
        <CollapsiblePrompt
          label="System / Thinking"
          content={step.content || ''}
          variant="system-prompt"
        />
      </div>
    );
  }

  if ('clarification' === step.type) {
    return (
      <div className="d5-dev-tool-ai-agent__step-body">
        <CollapsiblePrompt
          label="Clarification Question"
          content={step.content || ''}
          variant="response"
        />
        {step.selectedAnswer && (
          <CollapsiblePrompt
            label="User Answer"
            content={step.selectedAnswer}
            variant="user-prompt"
          />
        )}
        {step.options && 0 < step.options.length && (
          <div className="d5-dev-tool-ai-agent__block d5-dev-tool-ai-agent__block--response">
            <span className="d5-dev-tool-ai-agent__block-label">Options</span>
            <div className="d5-dev-tool-ai-agent__block-content">
              <ObjectRenderer values={step.options} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="d5-dev-tool-ai-agent__step-body">
      {step.content && (
        <CollapsiblePrompt
          label={getStepKindLabel(step.type)}
          content={step.content}
          variant="response"
        />
      )}
      {step.argsPreview && (
        <CollapsiblePrompt
          label="Request Preview"
          content={step.argsPreview}
          variant="tool-request"
        />
      )}
      {step.status && (
        <p className="d5-dev-tool-ai-agent__meta-row">
          <strong>Status:</strong> <code>{step.status}</code>
        </p>
      )}
    </div>
  );
};

const AssistantStepsDebug = ({
  message,
}: {
  message: ChatMessage;
}): ReactElement => {
  const messageId = message.id ?? 'unknown-message';
  const stepIds = useMemo(
    () => (message.steps ?? []).map((step, index) => step.id ?? `${messageId}-step-${index}`),
    [message.steps, messageId],
  );
  const {
    isExpanded,
    toggle,
    expandAll,
    collapseAll,
  } = useExpandedItems(stepIds, false);

  if (!message.steps || 0 === message.steps.length) {
    return <p className="d5-dev-tool-ai-agent__empty">No assistant steps yet.</p>;
  }

  return (
    <>
      <div className="d5-dev-tool-ai-agent__section-header">
        <h5 className="d5-dev-tool-ai-agent__section-title">Assistant Steps</h5>
        <CollapseControls onExpandAll={expandAll} onCollapseAll={collapseAll} />
      </div>
      <div className="d5-dev-tool-ai-agent__step-list">
        {map(message.steps, (step, index) => {
          const stepId = step.id ?? `${messageId}-step-${index}`;
          const stepExpanded = isExpanded(stepId);

          return (
            <div key={stepId} className="d5-dev-tool-ai-agent__step-card">
              <button
                type="button"
                className="d5-dev-tool-ai-agent__step-header"
                onClick={() => toggle(stepId)}
                aria-expanded={stepExpanded}
              >
                <h5 className="d5-dev-tool-ai-agent__step-title">
                  Step {index + 1}: {getStepKindLabel(step.type)}
                  {step.label ? ` — ${step.label}` : ''}
                </h5>
                <span className="d5-dev-tool-ai-agent__card-chevron">
                  {stepExpanded ? '▼' : '▶'}
                </span>
              </button>
              {stepExpanded && <AssistantStepDebug step={step} />}
            </div>
          );
        })}
      </div>
    </>
  );
};

const ChatMessageDebug = ({
  message,
  isExpanded,
  onToggle,
  turnDurations = [],
}: {
  message: ChatMessage;
  isExpanded: boolean;
  onToggle: () => void;
  turnDurations?: ChatTurnDuration[];
}): ReactElement => {
  const messageId = message.id ?? 'unknown-message';
  const isUser = 'user' === message.role;
  const turnDuration = !isUser ? getAssistantTurnDuration(messageId, turnDurations) : null;

  return (
    <CollapsibleCard
      id={messageId}
      title={(
        <>
          {isUser ? 'User Prompt' : 'Assistant Turn'}
          {' '}
          <code>{messageId}</code>
          {!isUser && message.isStreaming && (
            <span className="d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--streaming">
              streaming
            </span>
          )}
        </>
      )}
      subtitle={(
        <>
          {formatTimestamp(message.timestamp)}
          {' · '}
          {getMessageSubtitle(message)}
          {turnDuration && (
            <>
              {' · '}
              {turnDuration.isInProgress ? 'In progress' : 'Completed'}
              {' '}
              in {formatDuration(turnDuration.durationMs)}
            </>
          )}
        </>
      )}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="d5-dev-tool-ai-agent__meta-grid">
        <p className="d5-dev-tool-ai-agent__meta-row">
          <strong>Role:</strong> <code>{message.role}</code>
        </p>
        {!isUser && message.isStreaming && (
          <p className="d5-dev-tool-ai-agent__meta-row">
            <strong>Status:</strong> <code>streaming</code>
          </p>
        )}
      </div>

      {isUser ? (
        <>
          <CollapsiblePrompt
            label="User Prompt"
            content={message.content || ''}
            variant="user-prompt"
          />
          {message.attachments && 0 < message.attachments.length && (
            <div className="d5-dev-tool-ai-agent__block d5-dev-tool-ai-agent__block--response">
              <span className="d5-dev-tool-ai-agent__block-label">Attachments</span>
              <div className="d5-dev-tool-ai-agent__block-content">
                <ObjectRenderer values={message.attachments} />
              </div>
            </div>
          )}
        </>
      ) : (
        <AssistantStepsDebug message={message} />
      )}
    </CollapsibleCard>
  );
};

/**
 * Message-by-message debug view for the active chat thread.
 */
export const ChatMessagesDebug = ({
  messages,
  turnDurations = [],
  hasActiveChat = true,
}: ChatMessagesDebugProps): ReactElement => {
  const typedMessages = messages as ChatMessage[];
  const messageIds = useMemo(
    () => typedMessages.map((message, index) => message.id ?? `message-${index}`),
    [typedMessages],
  );
  const {
    isExpanded,
    toggle,
    expandAll,
    collapseAll,
  } = useExpandedItems(messageIds, false);

  if (!hasActiveChat) {
    return null;
  }

  if (0 === typedMessages.length) {
    return (
      <div className="d5-dev-tool-ai-agent__messages">
        <p className="d5-dev-tool-ai-agent__empty">No messages in the current chat yet.</p>
      </div>
    );
  }

  return (
    <div className="d5-dev-tool-ai-agent__messages">
      <div className="d5-dev-tool-ai-agent__section-header">
        <h3 className="d5-dev-tool-ai-agent__section-title">Messages</h3>
        <CollapseControls onExpandAll={expandAll} onCollapseAll={collapseAll} />
      </div>
      <div className="d5-dev-tool-ai-agent__card-list">
        {typedMessages.map((message, index) => {
          const messageId = message.id ?? `message-${index}`;

          return (
            <ChatMessageDebug
              key={messageId}
              message={message}
              isExpanded={isExpanded(messageId)}
              onToggle={() => toggle(messageId)}
              turnDurations={turnDurations}
            />
          );
        })}
      </div>
    </div>
  );
};
