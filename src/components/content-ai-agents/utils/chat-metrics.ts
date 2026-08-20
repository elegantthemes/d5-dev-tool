import { sumInferenceUsage } from './extract-inference-usage';
import { type NetworkRecord } from './network-recorder';

type ContextUsageEntry = {
  inputTokens: number;
  modelName: string;
};

type ContextUsageByAgent = Record<string, ContextUsageEntry | undefined>;

export type ChatMessageMetrics = {
  id?: string;
  role?: string;
  timestamp?: number;
  isStreaming?: boolean;
};

export type ChatTurnDuration = {
  userMessageId: string;
  assistantMessageId?: string;
  durationMs: number;
  isInProgress: boolean;
};

export type TurnWindow = {
  startedAt: number | null;
  endedAt: number | null;
};

export type ChatMetrics = {
  totalTokens: number;
  inferenceRequestCount: number;
  latestTurnDurationMs: number | null;
  totalTurnDurationMs: number;
  turnDurations: ChatTurnDuration[];
  contextUsageByAgent: ContextUsageByAgent;
};

type ImmutableLike = {
  getIn?: (path: string[]) => unknown;
  asMutable?: (options: { deep: boolean }) => unknown;
};

/**
 * Normalizes immutable store values into plain objects for debug calculations.
 */
export const toPlainObject = <T>(value: unknown): T | null => {
  if (!value) {
    return null;
  }

  if ('function' === typeof (value as ImmutableLike).asMutable) {
    return (value as ImmutableLike).asMutable?.({ deep: true }) as T;
  }

  return value as T;
};

/**
 * Reads per-agent context usage from the ai-agent store state.
 */
export const extractContextUsageByAgent = (
  allState: unknown,
  chatId: string,
): ContextUsageByAgent => {
  if (!allState || !chatId) {
    return {};
  }

  const state = allState as ImmutableLike & {
    chats?: Record<string, { contextUsageByAgent?: ContextUsageByAgent }>;
  };
  const chat = 'function' === typeof state.getIn
    ? state.getIn(['chats', chatId])
    : state.chats?.[chatId];

  if (!chat) {
    return {};
  }

  const usage = 'function' === typeof (chat as ImmutableLike).getIn
    ? (chat as ImmutableLike).getIn?.(['contextUsageByAgent'])
    : (chat as { contextUsageByAgent?: ContextUsageByAgent }).contextUsageByAgent;

  return toPlainObject<ContextUsageByAgent>(usage) ?? {};
};

/**
 * Sums token usage reported by captured LLM inference responses for a turn.
 */
export const computeInferenceTotalTokens = (records: NetworkRecord[]): number => (
  sumInferenceUsage(records).totalTokens
);

/**
 * Falls back to the latest per-agent context snapshot when inference traffic
 * was not captured (for example, if the recorder was installed after send).
 */
export const computeContextSnapshotTokens = (
  contextUsageByAgent: ContextUsageByAgent,
  peakContextUsage: ContextUsageEntry | null = null,
): number => {
  const total = Object.values(contextUsageByAgent).reduce(
    (sum, entry) => sum + (entry?.inputTokens ?? 0),
    0,
  );

  if (0 < total) {
    return total;
  }

  return peakContextUsage?.inputTokens ?? 0;
};

/**
 * Prefers cumulative inference usage for the active turn, with a store snapshot
 * fallback only when no inference requests were captured for that turn.
 */
export const computeTotalTokens = (
  contextUsageByAgent: ContextUsageByAgent,
  peakContextUsage: ContextUsageEntry | null = null,
  inferenceRecords: NetworkRecord[] = [],
): number => {
  if (0 < inferenceRecords.length) {
    return computeInferenceTotalTokens(inferenceRecords);
  }

  return computeContextSnapshotTokens(contextUsageByAgent, peakContextUsage);
};

/**
 * Bounds the latest chat turn for duration and inference attribution.
 *
 * Assistant placeholders are stamped when the user sends, so the turn must not
 * end at the assistant message timestamp — that would exclude every inference
 * request fired afterward.
 *
 * For the latest turn, leave the upper bound open (`endedAt: null`). The next
 * user message becomes the lower bound for the following turn, which naturally
 * excludes earlier inference without relying on `chat.updatedAt` (that value can
 * lag behind the final inference response when streaming settles).
 */
export const getLatestTurnWindow = (
  messages: ChatMessageMetrics[],
): TurnWindow => {
  const latestUserMessageIndex = messages.reduce(
    (latestIndex, message, index) => ('user' === message.role ? index : latestIndex),
    -1,
  );

  if (-1 === latestUserMessageIndex) {
    return {
      startedAt: null,
      endedAt: null,
    };
  }

  const latestUserMessage = messages[latestUserMessageIndex];
  const nextUserMessage = messages
    .slice(latestUserMessageIndex + 1)
    .find(message => 'user' === message.role);

  return {
    startedAt: latestUserMessage.timestamp ?? null,
    endedAt: nextUserMessage?.timestamp ?? null,
  };
};

/**
 * Formats a duration as `Xm Ys` or `Xs`.
 */
export const formatDuration = (durationMs: number | null): string => {
  if (null === durationMs || 0 > durationMs) {
    return '—';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (0 < minutes) {
    return `${minutes}m ${seconds}s`;
  }

  if (0 < totalSeconds) {
    return `${totalSeconds}s`;
  }

  return '<1s';
};

const getTurnEndTimestamp = ({
  messageIndex,
  messages,
  chatUpdatedAt,
  isStreaming,
  now,
}: {
  messageIndex: number;
  messages: ChatMessageMetrics[];
  chatUpdatedAt: number | null;
  isStreaming: boolean;
  now: number;
}): number => {
  const assistantMessage = messages[messageIndex + 1];
  const nextUserMessage = messages
    .slice(messageIndex + 1)
    .find(message => 'user' === message.role);
  const isLatestTurn = !nextUserMessage;
  const isTurnStreaming = Boolean(
    assistantMessage
    && 'assistant' === assistantMessage.role
    && (assistantMessage.isStreaming || (isStreaming && isLatestTurn)),
  );

  if (isTurnStreaming) {
    return now;
  }

  if (isLatestTurn && chatUpdatedAt) {
    return chatUpdatedAt;
  }

  if (nextUserMessage?.timestamp) {
    return nextUserMessage.timestamp;
  }

  return chatUpdatedAt ?? now;
};

/**
 * Derives per-turn and aggregate durations from user send time to turn completion.
 *
 * Assistant placeholders are created with the same timestamp as the user message,
 * so turn duration must use `chat.updatedAt` (last store mutation) as completion time.
 */
export const computeChatMetrics = (
  messages: ChatMessageMetrics[],
  contextUsageByAgent: ContextUsageByAgent,
  isStreaming: boolean,
  chatUpdatedAt: number | null,
  peakContextUsage: ContextUsageEntry | null = null,
  inferenceRecords: NetworkRecord[] = [],
  now = Date.now(),
): ChatMetrics => {
  const turnDurations: ChatTurnDuration[] = [];

  messages.forEach((message, index) => {
    if ('user' !== message.role || !message.timestamp) {
      return;
    }

    const assistantMessage = 'assistant' === messages[index + 1]?.role
      ? messages[index + 1]
      : undefined;
    const endTimestamp = getTurnEndTimestamp({
      messageIndex: index,
      messages,
      chatUpdatedAt,
      isStreaming,
      now,
    });
    const isInProgress = Boolean(
      assistantMessage?.isStreaming
      || (isStreaming && !messages.slice(index + 1).some(item => 'user' === item.role)),
    );

    turnDurations.push({
      userMessageId: message.id ?? '',
      assistantMessageId: assistantMessage?.id,
      durationMs: Math.max(0, endTimestamp - message.timestamp),
      isInProgress,
    });
  });

  const completedTurnDurations = turnDurations.filter(turn => !turn.isInProgress);
  const latestTurn = turnDurations[turnDurations.length - 1] ?? null;

  return {
    totalTokens: computeTotalTokens(contextUsageByAgent, peakContextUsage, inferenceRecords),
    inferenceRequestCount: inferenceRecords.length,
    latestTurnDurationMs: latestTurn?.durationMs ?? null,
    totalTurnDurationMs: completedTurnDurations.reduce(
      (total, turn) => total + turn.durationMs,
      0,
    ),
    turnDurations,
    contextUsageByAgent,
  };
};

/**
 * Finds the completed turn duration for a specific assistant message.
 */
export const getAssistantTurnDuration = (
  assistantMessageId: string | undefined,
  turnDurations: ChatTurnDuration[],
): ChatTurnDuration | null => {
  if (!assistantMessageId) {
    return null;
  }

  return turnDurations.find(turn => turn.assistantMessageId === assistantMessageId) ?? null;
};
