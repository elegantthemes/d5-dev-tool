// Divi dependencies.
import { useSelect } from '@divi/data';

import { AI_AGENT_STORE } from './use-ai-agent-selectors';
import {
  type ChatMetrics,
  computeChatMetrics,
  extractContextUsageByAgent,
  toPlainObject,
} from './utils/chat-metrics';

type AiAgentStore = Record<string, (...args: unknown[]) => unknown> & {
  allState?: () => unknown;
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
  draftPrompt: string;
  pendingApprovals: Record<string, unknown>;
  chatMetrics: ChatMetrics;
};

/**
 * Reactive snapshot of the active chat and conversation list for debug panels.
 */
export const useCurrentChatDebug = (): CurrentChatDebug | null => useSelect(selectStore => {
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
    : (store.getCurrentChatMessages?.() ?? [])) as unknown[];
  const isStreaming = currentChatId ? Boolean(store.isChatStreaming?.(currentChatId)) : false;
  const allState = store.allState?.() ?? null;
  const contextUsageByAgent = extractContextUsageByAgent(allState, currentChatId);
  const peakContextUsage = toPlainObject<{ inputTokens: number; modelName: string }>(
    currentChatId ? store.getContextUsage?.(currentChatId) ?? null : null,
  );
  const chatUpdatedAt = currentConversation?.updatedAt ?? null;

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
    threadId: currentChatId ? (store.getChatThreadId?.(currentChatId) as string ?? '') : '',
    isStreaming,
    interactionMode: currentChatId
      ? (store.getChatInteractionMode?.(currentChatId) as string ?? '')
      : (store.getLastInteractionMode?.() as string ?? ''),
    pendingInput: currentChatId ? store.getPendingInput?.(currentChatId) ?? null : null,
    contextUsage: currentChatId ? store.getContextUsage?.(currentChatId) ?? null : null,
    draftPrompt: (store.getDraftPrompt?.(currentChatId) as string ?? ''),
    pendingApprovals: currentConversation?.pendingApprovals ?? {},
    chatMetrics: computeChatMetrics(
      messages as Array<{ id?: string; role?: string; timestamp?: number; isStreaming?: boolean }>,
      contextUsageByAgent,
      isStreaming,
      chatUpdatedAt,
      peakContextUsage,
    ),
  };
});
