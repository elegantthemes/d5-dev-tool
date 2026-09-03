// External dependencies.
import { useMemo, useRef } from 'react';

// Divi dependencies.
import { useSelect } from '@divi/data';

import { AI_AGENT_STORE } from './use-ai-agent-selectors';
import { useNetworkRecords } from './use-network-records';
import {
  type ChatMetrics,
  computeChatMetrics,
  computeInferenceTotalTokens,
  extractContextUsageByAgent,
  getLatestTurnWindow,
  toPlainObject,
} from './utils/chat-metrics';
import {
  filterInferenceRecords,
  filterInferenceRecordsForTurn,
} from './utils/filter-inference-records';

type AiAgentStore = Record<string, (...args: unknown[]) => unknown> & {
  allState?: () => unknown;
};

const DEBUG_SELECTOR_NAMES = [
  'getPendingAttachments',
  'getCommands',
  'getCommandsLoaded',
  'getSessionLedger',
  'getChatTodos',
  'getStreamingChatIds',
  'getModelPreferences',
  'getLatestCheckpoint',
  'listCheckpoints',
  'getChatRestorePoints',
  'getRestorePointForMessage',
  'getRules',
  'hasCredentials',
] as const;

type DebugSelectorName = typeof DEBUG_SELECTOR_NAMES[number];

const callSelector = <T>(
  store: AiAgentStore,
  selectorName: DebugSelectorName,
  fallback: T,
  ...args: unknown[]
): T => {
  const selector = store[selectorName];

  if ('function' !== typeof selector) {
    return fallback;
  }

  try {
    return selector(...args) as T;
  } catch {
    return fallback;
  }
};

export type ChatDebugTodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type ChatDebugTodo = {
  id: string;
  content: string;
  status: ChatDebugTodoStatus;
  createdAt: number;
  updatedAt: number;
};

export type ChatDebugContext = {
  schemaVersion: number;
  objective: string;
  notes: string[];
  decisions: string[];
  blockers: string[];
  todos: ChatDebugTodo[];
  updatedAt: number;
};

export type ChatDebugConversation = {
  id: string;
  title: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
  threadId: string;
  pendingApprovalCount: number;
  isCurrent: boolean;
};

type ChatMessageMetrics = {
  id?: string;
  role?: string;
  timestamp?: number;
  isStreaming?: boolean;
};

type CurrentChatDebugState = Omit<CurrentChatDebug, 'chatMetrics'> & {
  chatMetricsInputs: {
    messages: ChatMessageMetrics[];
    contextUsageByAgent: ReturnType<typeof extractContextUsageByAgent>;
    peakContextUsage: { inputTokens: number; modelName: string } | null;
    chatUpdatedAt: number | null;
    turnWindow: ReturnType<typeof getLatestTurnWindow>;
  };
};

export type CurrentChatDebug = {
  currentChatId: string;
  conversations: ChatDebugConversation[];
  messages: unknown[];
  title: string;
  threadId: string;
  isStreaming: boolean;
  interactionMode: string;
  pendingInput: unknown;
  contextUsage: unknown;
  chatContext: ChatDebugContext | null;
  draftPrompt: string;
  pendingApprovals: Record<string, unknown>;
  pendingAttachments: unknown[];
  commands: unknown[];
  commandsLoaded: boolean;
  sessionLedger: unknown;
  chatTodos: unknown[];
  streamingChatIds: string[];
  modelPreferences: unknown;
  latestCheckpoint: unknown;
  checkpoints: unknown[];
  restorePoints: unknown[];
  latestTurnRestorePoint: unknown;
  rules: unknown[];
  hasCredentials: boolean | null;
  chatMetrics: ChatMetrics;
};

/**
 * Reactive snapshot of the active chat and conversation list for debug panels.
 */
export const useCurrentChatDebug = (): CurrentChatDebug | null => {
  const { records } = useNetworkRecords();
  const turnTokenPeakRef = useRef({
    key: '',
    total: 0,
  });
  const chatDebug = useSelect(selectStore => {
    const store = selectStore(AI_AGENT_STORE) as AiAgentStore | null;

    if (!store) {
      return null;
    }

    const currentChatId = store.getCurrentChatId() as string;
    const conversations = (store.getConversations?.() ?? []) as Array<{
      id: string;
      title: string;
      messages: unknown[];
      createdAt: number;
      updatedAt: number;
      threadId: string;
      pendingApprovals?: Record<string, unknown>;
    }>;
    const currentConversation = conversations.find(conversation => conversation.id === currentChatId);
    const messages = (currentChatId
      ? (store.getChatMessages?.(currentChatId) ?? [])
      : (store.getCurrentChatMessages?.() ?? [])) as ChatMessageMetrics[];
    const isStreaming = currentChatId ? Boolean(store.isChatStreaming?.(currentChatId)) : false;
    const allState = store.allState?.() ?? null;
    const contextUsageByAgent = extractContextUsageByAgent(allState, currentChatId);
    const peakContextUsage = toPlainObject<{ inputTokens: number; modelName: string }>(
      currentChatId ? store.getContextUsage?.(currentChatId) ?? null : null,
    );
    const chatUpdatedAt = currentConversation?.updatedAt ?? null;
    const latestUserMessage = [...messages].reverse().find(message => 'user' === message.role);
    const threadId = currentChatId ? (store.getChatThreadId?.(currentChatId) as string ?? '') : '';
    const turnWindow = getLatestTurnWindow(messages);

    return {
      currentChatId,
      conversations: conversations.map(conversation => ({
        id: conversation.id,
        title: conversation.title,
        messageCount: conversation.messages?.length ?? 0,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        threadId: conversation.threadId,
        pendingApprovalCount: Object.keys(conversation.pendingApprovals ?? {}).length,
        isCurrent: conversation.id === currentChatId,
      })),
      messages,
      title: currentConversation?.title ?? '',
      threadId,
      isStreaming,
      interactionMode: currentChatId
        ? (store.getChatInteractionMode?.(currentChatId) as string ?? '')
        : (store.getLastInteractionMode?.() as string ?? ''),
      pendingInput: currentChatId ? store.getPendingInput?.(currentChatId) ?? null : null,
      contextUsage: currentChatId ? store.getContextUsage?.(currentChatId) ?? null : null,
      chatContext: currentChatId
        ? toPlainObject<ChatDebugContext>(store.getChatContext?.(currentChatId) ?? null)
        : null,
      draftPrompt: (store.getDraftPrompt?.(currentChatId) as string ?? ''),
      pendingApprovals: currentConversation?.pendingApprovals ?? {},
      pendingAttachments: currentChatId
        ? toPlainObject<unknown[]>(callSelector(store, 'getPendingAttachments', [], currentChatId)) ?? []
        : [],
      commands: toPlainObject<unknown[]>(callSelector(store, 'getCommands', [])) ?? [],
      commandsLoaded: callSelector(store, 'getCommandsLoaded', false),
      sessionLedger: currentChatId
        ? toPlainObject(callSelector(store, 'getSessionLedger', null, currentChatId))
        : null,
      chatTodos: currentChatId
        ? toPlainObject<unknown[]>(callSelector(store, 'getChatTodos', [], currentChatId)) ?? []
        : [],
      streamingChatIds: toPlainObject<string[]>(callSelector(store, 'getStreamingChatIds', [])) ?? [],
      modelPreferences: toPlainObject(callSelector(store, 'getModelPreferences', null)),
      latestCheckpoint: threadId
        ? toPlainObject(callSelector(store, 'getLatestCheckpoint', null, threadId))
        : null,
      checkpoints: threadId
        ? toPlainObject<unknown[]>(callSelector(store, 'listCheckpoints', [], threadId)) ?? []
        : [],
      restorePoints: currentChatId
        ? toPlainObject<unknown[]>(callSelector(store, 'getChatRestorePoints', [], currentChatId)) ?? []
        : [],
      latestTurnRestorePoint: currentChatId && latestUserMessage?.id
        ? toPlainObject(callSelector(
          store,
          'getRestorePointForMessage',
          null,
          currentChatId,
          latestUserMessage.id,
        ))
        : null,
      rules: toPlainObject<unknown[]>(callSelector(store, 'getRules', [])) ?? [],
      hasCredentials: 'function' === typeof store.hasCredentials
        ? callSelector(store, 'hasCredentials', false)
        : null,
      chatMetricsInputs: {
        messages,
        contextUsageByAgent,
        peakContextUsage,
        chatUpdatedAt,
        turnWindow,
      },
    } satisfies CurrentChatDebugState;
  }) as CurrentChatDebugState | null;

  return useMemo(() => {
    if (!chatDebug) {
      return null;
    }

    const {
      chatMetricsInputs,
      ...rest
    } = chatDebug;
    const turnInferenceRecords = filterInferenceRecordsForTurn(
      filterInferenceRecords(records),
      chatMetricsInputs.turnWindow.startedAt,
      chatMetricsInputs.turnWindow.endedAt,
    );
    const latestUserMessage = [...chatMetricsInputs.messages].reverse().find(
      message => 'user' === message.role,
    );
    const turnKey = `${rest.currentChatId}:${latestUserMessage?.id ?? 'no-turn'}`;
    const inferenceTotal = computeInferenceTotalTokens(turnInferenceRecords);

    if (turnKey !== turnTokenPeakRef.current.key) {
      turnTokenPeakRef.current = {
        key: turnKey,
        total: inferenceTotal,
      };
    } else {
      turnTokenPeakRef.current.total = Math.max(
        turnTokenPeakRef.current.total,
        inferenceTotal,
      );
    }

    const chatMetrics = computeChatMetrics(
      chatMetricsInputs.messages,
      chatMetricsInputs.contextUsageByAgent,
      rest.isStreaming,
      chatMetricsInputs.chatUpdatedAt,
      chatMetricsInputs.peakContextUsage,
      turnInferenceRecords,
    );

    return {
      ...rest,
      chatMetrics: {
        ...chatMetrics,
        totalTokens: Math.max(chatMetrics.totalTokens, turnTokenPeakRef.current.total),
      },
    };
  }, [chatDebug, records]);
};
