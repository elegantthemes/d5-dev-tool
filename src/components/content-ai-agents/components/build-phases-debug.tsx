// External dependencies.
import React, {
  ReactElement,
  useEffect,
  useMemo,
  useState,
} from 'react';

// Divi dependencies.
import { ObjectRenderer } from '@divi/object-renderer';

// Local dependencies.
import { type CurrentChatDebug } from '../use-current-chat-debug';
import { useNetworkRecords } from '../use-network-records';
import { attributeNetworkRecords } from '../utils/attribute-network-records';
import {
  stepActivityFailed,
  toolStepHasError,
  type DebugStep,
} from '../utils/debug-step';
import { type NetworkRecord } from '../utils/network-recorder';
import { stringifyExecutionData } from '../utils/stringify-execution-data';
import { CollapseControls } from './collapse-controls';
import { CollapsibleCard } from './collapsible-card';
import { CollapsiblePrompt } from './collapsible-prompt';
import { CopyDataButton } from './copy-data-button';
import { NetworkRequestsDebug } from './network-requests-debug';
import { StepListDebug } from './step-list-debug';
import { useExpandedItems } from './use-expanded-items';

type DebugMessage = {
  id?: string;
  role?: string;
  content?: string;
  attachments?: unknown[];
  isStreaming?: boolean;
  timestamp?: number;
  steps?: DebugStep[];
};

type PhaseStatus = 'waiting' | 'active' | 'observed' | 'settled' | 'skipped' | 'aborted' | 'error';

type PhaseDefinition = {
  id: string;
  number: number;
  title: string;
  summary: string;
  status: PhaseStatus;
  data: Record<string, unknown>;
  content: ReactElement;
};

type PhaseTiming = {
  startedAt: number | null;
  endedAt: number | null;
};

type PhaseTimingSignal = {
  started: boolean;
  ended: boolean;
  fallbackStartedAt?: number;
  fallbackEndedAt?: number;
};

type PhaseTimingMap = Record<string, PhaseTiming>;

const PHASE_IDS = [
  'phase-1',
  'phase-2',
  'phase-3',
  'phase-4',
  'phase-5',
  'phase-6',
  'phase-7',
  'phase-8',
];

const UNATTRIBUTED_ID = 'network-unattributed';

const EMPTY_TIMING: PhaseTiming = {
  startedAt: null,
  endedAt: null,
};

const phaseTimingCache = new Map<string, PhaseTimingMap>();
const composerStartedAtCache = new Map<string, {
  startedAt: number;
  precedingUserMessageId?: string;
}>();

const formatPhaseTimestamp = (timestamp: number | null): string => (
  null === timestamp ? '—' : new Date(timestamp).toLocaleString()
);

const padTimeUnit = (value: number): string => (10 > value ? `0${value}` : `${value}`);

const formatPhaseDuration = (timing: PhaseTiming, now: number): string => {
  const elapsedMs = null === timing.startedAt
    ? 0
    : Math.max(0, (timing.endedAt ?? now) - timing.startedAt);
  const totalSeconds = Math.floor(elapsedMs / 1000);

  return `${padTimeUnit(Math.floor(totalSeconds / 60))}m ${padTimeUnit(totalSeconds % 60)}s`;
};

const buildPhaseSnapshot = (
  phase: PhaseDefinition,
  timing: PhaseTiming,
  records: NetworkRecord[],
  now: number,
): Record<string, unknown> => ({
  phase: phase.number,
  id: phase.id,
  title: phase.title,
  status: phase.status,
  summary: phase.summary,
  timing: {
    startedAt: timing.startedAt,
    startedAtLabel: formatPhaseTimestamp(timing.startedAt),
    endedAt: timing.endedAt,
    endedAtLabel: formatPhaseTimestamp(timing.endedAt),
    duration: formatPhaseDuration(timing, now),
    durationMs: null === timing.startedAt
      ? null
      : Math.max(0, (timing.endedAt ?? now) - timing.startedAt),
    isComplete: null !== timing.endedAt,
  },
  state: phase.data,
  network: records,
});

const usePhaseTimings = (
  turnKey: string,
  signals: Record<string, PhaseTimingSignal>,
): { timings: PhaseTimingMap; now: number } => {
  const [, setTick] = useState(0);
  const now = Date.now();
  let timings = phaseTimingCache.get(turnKey);

  if (!timings) {
    timings = {};
    phaseTimingCache.set(turnKey, timings);

    if (100 < phaseTimingCache.size) {
      const oldestKey = phaseTimingCache.keys().next().value;

      if (oldestKey) {
        phaseTimingCache.delete(oldestKey);
      }
    }
  }

  Object.keys(signals).forEach(phaseId => {
    const signal = signals[phaseId];
    const timing = timings?.[phaseId] ?? {
      startedAt: null,
      endedAt: null,
    };

    if (signal.started && null === timing.startedAt) {
      timing.startedAt = signal.fallbackStartedAt ?? now;
    }

    if (signal.ended && null !== timing.startedAt && null === timing.endedAt) {
      timing.endedAt = Math.max(
        timing.startedAt,
        signal.fallbackEndedAt ?? now,
      );
    }

    if (timings) {
      timings[phaseId] = timing;
    }
  });

  const hasRunningPhase = Object.keys(timings).some(phaseId => {
    const timing = timings?.[phaseId];

    return Boolean(timing && null !== timing.startedAt && null === timing.endedAt);
  });

  useEffect(() => {
    if (!hasRunningPhase) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTick(tick => tick + 1);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [hasRunningPhase, turnKey]);

  return {
    timings,
    now,
  };
};

const RawDebugBlock = ({
  label,
  values,
}: {
  label: string;
  values: unknown;
}): ReactElement => (
  <div className="d5-dev-tool-ai-agent__block d5-dev-tool-ai-agent__block--response">
    <span className="d5-dev-tool-ai-agent__block-label">{label}</span>
    <div className="d5-dev-tool-ai-agent__block-content">
      <ObjectRenderer values={values as Record<string, unknown>} />
    </div>
  </div>
);

const EmptyDebugValue = ({ children }: { children: string }): ReactElement => (
  <p className="d5-dev-tool-ai-agent__empty">{children}</p>
);

const SelectorGap = ({ children }: { children: string }): ReactElement => (
  <p className="d5-dev-tool-ai-agent__observability-note">
    <strong>Observability gap:</strong> {children}
  </p>
);

const StepCollection = ({
  label,
  steps,
  idPrefix,
}: {
  label: string;
  steps: DebugStep[];
  idPrefix: string;
}): ReactElement => (
  <StepListDebug
    label={label}
    steps={steps}
    idPrefix={idPrefix}
    emptyMessage={`No ${label.toLowerCase()} observed on the latest assistant turn.`}
  />
);

const getPhaseStatus = ({
  hasStarted,
  isActive,
  isComplete,
  canSkip,
  hasError,
  isAborted,
  settlement = false,
}: {
  hasStarted: boolean;
  isActive: boolean;
  isComplete: boolean;
  canSkip: boolean;
  hasError?: boolean;
  isAborted?: boolean;
  settlement?: boolean;
}): PhaseStatus => {
  if (hasError) {
    return 'error';
  }

  // Stopping a turn is a user action, so it outranks the completion states
  // below without being reported as a failure.
  if (isAborted) {
    return 'aborted';
  }

  if (isActive) {
    return 'active';
  }

  if (hasStarted && isComplete) {
    return settlement ? 'settled' : 'observed';
  }

  if (!hasStarted && canSkip) {
    return 'skipped';
  }

  return 'waiting';
};

/**
 * Phase-by-phase view of all Build-mode execution state exposed by the AI Agent store.
 */
export const BuildPhasesDebug = ({
  chatDebug,
}: {
  chatDebug: CurrentChatDebug;
}): ReactElement | null => {
  const {
    currentChatId,
    messages,
    isStreaming,
    interactionMode,
    draftPrompt,
    pendingAttachments,
    commands,
    commandsLoaded,
    sessionLedger,
    pendingInput,
    chatContext,
    chatTodos,
    streamingChatIds,
    modelPreferences,
    contextUsage,
    threadId,
    latestCheckpoint,
    checkpoints,
    pendingApprovals,
    restorePoints,
    latestTurnRestorePoint,
    rules,
    hasCredentials,
  } = chatDebug;
  const typedMessages = messages as DebugMessage[];
  const latestUserMessageIndex = typedMessages.reduce(
    (latestIndex, message, index) => ('user' === message.role ? index : latestIndex),
    -1,
  );
  const latestUserMessage = -1 < latestUserMessageIndex
    ? typedMessages[latestUserMessageIndex]
    : undefined;
  const latestAssistantMessage = -1 < latestUserMessageIndex
    ? typedMessages.slice(latestUserMessageIndex + 1).find(message => 'assistant' === message.role)
    : undefined;
  const assistantSteps = latestAssistantMessage?.steps ?? [];
  const plannerSteps = assistantSteps.filter(step => (
    'status' === step.type
    && /plan|prepar/i.test(`${step.label ?? ''} ${step.content ?? ''}`)
  ));
  const routingSteps = assistantSteps.filter(step => (
    'routing' === step.type || 'sub_agent' === step.type
  ));
  const agentSteps = assistantSteps.filter(step => (
    -1 !== ['thinking', 'text', 'status', 'routing', 'sub_agent', 'summarizing', 'approval', 'clarification', 'media-pick']
      .indexOf(step.type ?? '')
  ));
  const toolSteps = assistantSteps.filter(step => 'tool_call' === step.type);
  const hasUserMessage = Boolean(latestUserMessage);
  const hasAssistantMessage = Boolean(latestAssistantMessage);
  const turnHasSettled = hasAssistantMessage && !isStreaming && !latestAssistantMessage?.isStreaming;
  const runAgentHasStarted = 0 < routingSteps.length
    || 0 < toolSteps.length
    || agentSteps.some(step => -1 !== ['thinking', 'text', 'summarizing', 'approval', 'clarification', 'media-pick']
      .indexOf(step.type ?? ''));
  const phase1Started = Boolean(draftPrompt) || hasUserMessage;
  const phase1Complete = hasUserMessage;
  const phase2Started = hasUserMessage;
  const phase2Complete = hasAssistantMessage;
  const phase3Started = hasAssistantMessage;
  const phase3Complete = 0 < plannerSteps.length || 0 < routingSteps.length || turnHasSettled;
  const phase4Started = 0 < plannerSteps.length;
  const phase4Complete = 0 < routingSteps.length || (phase4Started && turnHasSettled);
  const phase5Started = 0 < routingSteps.length;
  const phase5Complete = phase5Started && turnHasSettled;
  const phase6Started = runAgentHasStarted;
  const phase6Complete = phase6Started && turnHasSettled;
  const phase7Started = 0 < toolSteps.length;
  const phase7Complete = phase7Started && turnHasSettled;
  const phase8Started = turnHasSettled;
  const phase8Complete = turnHasSettled;
  const pendingInputType = (pendingInput as { type?: string } | null)?.type ?? '';
  const turnSummaries = (sessionLedger as { turnSummaries?: Array<{ endedWith?: string }> } | null)?.turnSummaries ?? [];
  const latestTurnSummary = 0 < turnSummaries.length ? turnSummaries[turnSummaries.length - 1] : null;
  const turnAborted = 'aborted' === pendingInputType || 'aborted' === latestTurnSummary?.endedWith;
  const streamErrorSteps = agentSteps.filter(stepActivityFailed);
  const hasToolError = toolSteps.some(toolStepHasError);
  const hasPlannerError = plannerSteps.some(stepActivityFailed);
  // An aborted turn is attributed to the furthest phase that actually started.
  const abortedAtExecuteCommand = turnAborted && !phase4Started && !phase5Started && !phase7Started;
  const abortedAtPlanner = turnAborted && phase4Started && !phase5Started && !phase7Started;
  const abortedAtSpecialistSteps = turnAborted && phase5Started;
  const abortedAtSettlement = turnAborted && turnHasSettled;
  if (currentChatId && draftPrompt && !composerStartedAtCache.has(currentChatId)) {
    composerStartedAtCache.set(currentChatId, {
      startedAt: Date.now(),
      precedingUserMessageId: latestUserMessage?.id,
    });
  }
  const composerTiming = composerStartedAtCache.get(currentChatId);
  const wasComposerPromptSubmitted = Boolean(
    composerTiming
    && latestUserMessage?.id
    && latestUserMessage.id !== composerTiming.precedingUserMessageId
    && !draftPrompt,
  );
  const composerStartedAt = wasComposerPromptSubmitted
    ? composerTiming?.startedAt
    : latestUserMessage?.timestamp;

  if (currentChatId && wasComposerPromptSubmitted) {
    composerStartedAtCache.delete(currentChatId);
  }

  const {
    records: networkRecords,
    installedAt: networkInstalledAt,
  } = useNetworkRecords();
  const turnKey = `${currentChatId || 'no-chat'}:${latestUserMessage?.id ?? 'no-turn'}`;
  const {
    timings: phaseTimings,
    now: timingNow,
  } = usePhaseTimings(turnKey, {
    'phase-1': {
      started: Boolean(draftPrompt) || hasUserMessage,
      ended: hasUserMessage,
      fallbackStartedAt: composerStartedAt,
      fallbackEndedAt: latestUserMessage?.timestamp,
    },
    'phase-2': {
      started: hasUserMessage,
      ended: hasAssistantMessage,
      fallbackStartedAt: latestUserMessage?.timestamp,
      fallbackEndedAt: latestAssistantMessage?.timestamp,
    },
    'phase-3': {
      started: hasAssistantMessage,
      ended: 0 < plannerSteps.length || 0 < routingSteps.length || turnHasSettled,
      fallbackStartedAt: latestAssistantMessage?.timestamp,
    },
    'phase-4': {
      started: 0 < plannerSteps.length,
      ended: 0 < routingSteps.length || (0 < plannerSteps.length && turnHasSettled),
    },
    'phase-5': {
      started: 0 < routingSteps.length,
      ended: 0 < routingSteps.length && turnHasSettled,
    },
    'phase-6': {
      started: runAgentHasStarted,
      ended: runAgentHasStarted && turnHasSettled,
    },
    'phase-7': {
      started: 0 < toolSteps.length,
      ended: 0 < toolSteps.length && turnHasSettled,
    },
    'phase-8': {
      started: turnHasSettled,
      ended: turnHasSettled,
    },
  });
  const {
    isExpanded,
    toggle,
    expandAll,
    collapseAll,
  } = useExpandedItems(PHASE_IDS.concat(UNATTRIBUTED_ID), false);
  const {
    byPhase: phaseNetwork,
    unattributed: unattributedNetwork,
  } = useMemo(
    () => attributeNetworkRecords(networkRecords, phaseTimings, PHASE_IDS),
    [networkRecords, phaseTimings],
  );

  const phases = useMemo<PhaseDefinition[]>(() => [
    {
      id: 'phase-1',
      number: 1,
      title: 'Composer Send',
      summary: `${pendingAttachments.length} attachment(s) · ${commands.length} command(s) loaded`,
      status: getPhaseStatus({
        hasStarted: phase1Started,
        isActive: phase1Started && !phase1Complete,
        isComplete: phase1Complete,
        canSkip: turnHasSettled || phase2Started,
      }),
      data: {
        draftPrompt,
        pendingAttachments,
        commandsLoaded,
        commandCount: commands.length,
        isBusy: Boolean(isStreaming || pendingInput),
        interactionMode,
      },
      content: (
        <>
          <div className="d5-dev-tool-ai-agent__meta-grid">
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Draft:</strong> <code>{draftPrompt ? 'present' : 'empty'}</code>
            </p>
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Commands:</strong> <code>{commandsLoaded ? 'loaded' : 'loading/unavailable'} ({commands.length})</code>
            </p>
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Busy:</strong> <code>{isStreaming || pendingInput ? 'yes' : 'no'}</code>
            </p>
          </div>
          {draftPrompt && (
            <CollapsiblePrompt label="Draft Prompt" content={draftPrompt} variant="user-prompt" />
          )}
          {0 < pendingAttachments.length && (
            <RawDebugBlock label="Pending Attachments" values={pendingAttachments} />
          )}
          <SelectorGap>
            Selected @context chips, expanded command text, effective scope, and queued messages are local React state.
          </SelectorGap>
        </>
      ),
    },
    {
      id: 'phase-2',
      number: 2,
      title: 'Pre-turn Setup',
      summary: latestUserMessage?.id ? `latest user message ${latestUserMessage.id}` : 'waiting for a user message',
      status: getPhaseStatus({
        hasStarted: phase2Started,
        isActive: isStreaming && phase2Started && !phase2Complete,
        isComplete: phase2Complete,
        canSkip: turnHasSettled || phase3Started,
      }),
      data: {
        latestUserMessage,
        chatContext,
        chatTodos,
        threadId,
      },
      content: (
        <>
          {latestUserMessage
            ? <RawDebugBlock label="Latest User Message" values={latestUserMessage} />
            : <EmptyDebugValue>No user turn has been written yet.</EmptyDebugValue>}
          {chatContext && <RawDebugBlock label="Chat Context Snapshot" values={chatContext} />}
          {0 < chatTodos.length && <RawDebugBlock label="Chat TODOs" values={chatTodos} />}
          <SelectorGap>
            The pre-turn layout snapshot, active restore anchor, and effective scope are held in ChatModalContainer refs.
          </SelectorGap>
        </>
      ),
    },
    {
      id: 'phase-3',
      number: 3,
      title: 'executeCommand',
      summary: pendingInput ? 'pending HITL state is present' : `${interactionMode || 'unknown'} interaction mode`,
      status: getPhaseStatus({
        hasStarted: phase3Started,
        isActive: isStreaming && phase3Started && !phase3Complete,
        isComplete: phase3Complete,
        canSkip: turnHasSettled || phase4Started || phase5Started,
        isAborted: abortedAtExecuteCommand,
      }),
      data: {
        interactionMode,
        hasCredentials,
        ruleCount: rules.length,
        pendingInput,
        sessionLedger,
      },
      content: (
        <>
          <div className="d5-dev-tool-ai-agent__meta-grid">
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Interaction Mode:</strong> <code>{interactionMode || '—'}</code>
            </p>
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Credentials Available:</strong> <code>{null === hasCredentials ? 'selector unavailable' : String(hasCredentials)}</code>
            </p>
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Rules:</strong> <code>{rules.length}</code>
            </p>
          </div>
          {pendingInput
            ? <RawDebugBlock label="Pending / Resume Input" values={pendingInput} />
            : <EmptyDebugValue>No pending clarification, media pick, approval, or aborted plan.</EmptyDebugValue>}
          {Boolean(sessionLedger) && <RawDebugBlock label="Session Ledger" values={sessionLedger} />}
          <SelectorGap>
            Scoped user input and encoded multimodal HumanMessage content only exist inside executeCommand.
          </SelectorGap>
        </>
      ),
    },
    {
      id: 'phase-4',
      number: 4,
      title: 'Planner',
      summary: `${plannerSteps.length} planning event(s) observed`,
      status: getPhaseStatus({
        hasStarted: phase4Started,
        isActive: isStreaming && phase4Started && !phase4Complete,
        isComplete: phase4Complete,
        canSkip: turnHasSettled || phase5Started || phase6Started || phase7Started,
        hasError: hasPlannerError,
        isAborted: abortedAtPlanner,
      }),
      data: {
        modelPreferences,
        plannerSteps,
        pendingPlan: (pendingInput as { plan?: unknown } | null)?.plan ?? null,
      },
      content: (
        <>
          {Boolean(modelPreferences) && <RawDebugBlock label="Model Preferences" values={modelPreferences} />}
          <StepCollection label="Planner Events" steps={plannerSteps} idPrefix="phase-4-planner" />
          <SelectorGap>
            A successful fresh PlannedStep[] is ephemeral. Redux only retains a plan when a turn pauses or aborts; routing events below are the durable approximation.
          </SelectorGap>
        </>
      ),
    },
    {
      id: 'phase-5',
      number: 5,
      title: 'Sequential Specialist Steps',
      summary: `${routingSteps.length} routing/sub-agent event(s) · base thread ${threadId || '—'}`,
      status: getPhaseStatus({
        hasStarted: phase5Started,
        isActive: isStreaming && phase5Started && !phase5Complete,
        isComplete: phase5Complete,
        canSkip: turnHasSettled || phase6Started || phase7Started,
        isAborted: abortedAtSpecialistSteps,
      }),
      data: {
        routingSteps,
        pendingInput,
        baseThreadId: threadId,
      },
      content: (
        <>
          <StepCollection label="Routing and Specialist Events" steps={routingSteps} idPrefix="phase-5-routing" />
          {Boolean(pendingInput) && <RawDebugBlock label="Paused Plan / Step State" values={pendingInput} />}
          <SelectorGap>
            Accumulated handoff, facts, ExecuteStepsResult, and successful step-thread IDs are orchestrator locals.
          </SelectorGap>
        </>
      ),
    },
    {
      id: 'phase-6',
      number: 6,
      title: 'LangGraph runAgent Stream',
      summary: `${agentSteps.length} stream event(s) · ${checkpoints.length} base-thread checkpoint(s)`,
      status: getPhaseStatus({
        hasStarted: phase6Started,
        isActive: isStreaming && phase6Started && !phase6Complete,
        isComplete: phase6Complete,
        canSkip: turnHasSettled || phase7Started,
        hasError: 0 < streamErrorSteps.length,
      }),
      data: {
        streamingChatIds,
        baseThreadId: threadId,
        agentSteps,
        contextUsage,
        latestCheckpoint,
        checkpoints,
        streamErrorSteps,
      },
      content: (
        <>
          <div className="d5-dev-tool-ai-agent__meta-grid">
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Streaming Chats:</strong> <code>{streamingChatIds.join(', ') || 'none'}</code>
            </p>
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Base Thread:</strong> <code>{threadId || '—'}</code>
            </p>
          </div>
          <StepCollection label="Agent Stream Events" steps={agentSteps} idPrefix="phase-6-stream" />
          {Boolean(contextUsage) && <RawDebugBlock label="Context Usage" values={contextUsage} />}
          {Boolean(latestCheckpoint) && <RawDebugBlock label="Latest Base-thread Checkpoint" values={latestCheckpoint} />}
          {0 < checkpoints.length && <RawDebugBlock label="Base-thread Checkpoints" values={checkpoints} />}
          <SelectorGap>
            Build specialists use derived step threads. The store exposes checkpoint lookup, but not a list of those derived thread IDs or the final RunAgentResult object.
          </SelectorGap>
        </>
      ),
    },
    {
      id: 'phase-7',
      number: 7,
      title: 'Tool Execution',
      summary: `${toolSteps.length} tool call(s) observed`,
      status: getPhaseStatus({
        hasStarted: phase7Started,
        isActive: isStreaming && phase7Started && !phase7Complete,
        isComplete: phase7Complete,
        canSkip: turnHasSettled,
        hasError: hasToolError,
      }),
      data: {
        toolSteps,
        hasToolError,
      },
      content: (
        <>
          <StepCollection label="Tool Calls and Results" steps={toolSteps} idPrefix="phase-7-tools" />
          <SelectorGap>
            Raw ToolMessages only live inside LangGraph; this view shows the request/result mirror written to assistant steps.
          </SelectorGap>
        </>
      ),
    },
    {
      id: 'phase-8',
      number: 8,
      title: 'Turn Settlement and Persistence',
      summary: isStreaming ? 'waiting for stream end' : 'chat is idle',
      status: getPhaseStatus({
        hasStarted: phase8Started,
        isActive: false,
        isComplete: phase8Complete,
        canSkip: false,
        isAborted: abortedAtSettlement,
        settlement: true,
      }),
      data: {
        isStreaming,
        pendingApprovals,
        restorePoints,
        latestTurnRestorePoint,
        sessionLedger,
        latestAssistantMessage,
        turnAborted,
      },
      content: (
        <>
          <div className="d5-dev-tool-ai-agent__meta-grid">
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Chat Streaming:</strong> <code>{String(isStreaming)}</code>
            </p>
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Pending Approvals:</strong> <code>{Object.keys(pendingApprovals).length}</code>
            </p>
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Restore Points:</strong> <code>{restorePoints.length}</code>
            </p>
          </div>
          {latestAssistantMessage && (
            <RawDebugBlock label="Latest Assistant Settlement State" values={{
              id: latestAssistantMessage.id,
              isStreaming: latestAssistantMessage.isStreaming,
              stepCount: assistantSteps.length,
            }}
            />
          )}
          {Boolean(latestTurnRestorePoint) && (
            <RawDebugBlock label="Latest Turn Restore Point" values={latestTurnRestorePoint} />
          )}
          {Boolean(sessionLedger) && <RawDebugBlock label="Turn Ledger" values={sessionLedger} />}
          <SelectorGap>
            REST queue flush state and pending writes require checkpoint namespace/checkpoint IDs and are not available as a chat-level selector.
          </SelectorGap>
        </>
      ),
    },
  ], [
    abortedAtExecuteCommand,
    abortedAtPlanner,
    abortedAtSettlement,
    abortedAtSpecialistSteps,
    assistantSteps.length,
    chatContext,
    chatTodos,
    checkpoints,
    commands.length,
    commandsLoaded,
    contextUsage,
    draftPrompt,
    hasAssistantMessage,
    hasCredentials,
    hasPlannerError,
    hasToolError,
    hasUserMessage,
    interactionMode,
    isStreaming,
    latestAssistantMessage,
    latestCheckpoint,
    latestTurnRestorePoint,
    latestUserMessage,
    modelPreferences,
    pendingApprovals,
    pendingAttachments,
    pendingInput,
    phase1Complete,
    phase1Started,
    phase2Complete,
    phase2Started,
    phase3Complete,
    phase3Started,
    phase4Complete,
    phase4Started,
    phase5Complete,
    phase5Started,
    phase6Complete,
    phase6Started,
    phase7Complete,
    phase7Started,
    phase8Complete,
    phase8Started,
    plannerSteps,
    restorePoints,
    routingSteps,
    rules.length,
    sessionLedger,
    streamErrorSteps.length,
    streamingChatIds,
    threadId,
    toolSteps,
    turnAborted,
    turnHasSettled,
    agentSteps,
  ]);

  if (!currentChatId) {
    return <EmptyDebugValue>No active chat selected.</EmptyDebugValue>;
  }

  return (
    <div className="d5-dev-tool-ai-agent__phases">
      <div className="d5-dev-tool-ai-agent__section-header">
        <h3 className="d5-dev-tool-ai-agent__section-title">Build-mode Execution Phases</h3>
        <CollapseControls onExpandAll={expandAll} onCollapseAll={collapseAll} />
      </div>
      <p className="d5-dev-tool-ai-agent__phase-intro">
        Live Redux-observable state is grouped by the eight Build-mode phases. Timing uses message timestamps where available
        and records phase transitions as this debugger observes them; historical assistant steps do not contain timestamps.
        HTTP capture patches <code>fetch</code> and started {formatPhaseTimestamp(networkInstalledAt)} —
        requests made before that, and any made via XHR, are not recorded. Each request is attributed to exactly one phase,
        by what the request does first and its timing second; anything left over is listed at the bottom.
      </p>
      {phases.map(phase => {
        const timing = phaseTimings[phase.id] ?? EMPTY_TIMING;
        const phaseRecords = phaseNetwork[phase.id] ?? [];

        return (
          <CollapsibleCard
            key={phase.id}
            id={phase.id}
            title={(
              <>
                Phase {phase.number} — {phase.title}
                <span className={`d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--phase-${phase.status}`}>
                  {phase.status}
                </span>
              </>
            )}
            subtitle={(
              <>
                <span>{phase.summary}</span>
                <br />
                <span className="d5-dev-tool-ai-agent__phase-timing">
                  Duration: {formatPhaseDuration(timing, timingNow)}
                  {' · '}
                  {phaseRecords.length} request(s)
                </span>
              </>
            )}
            isExpanded={isExpanded(phase.id)}
            onToggle={() => toggle(phase.id)}
          >
            <div className="d5-dev-tool-ai-agent__phase-toolbar">
              <CopyDataButton
                label={`Copy Phase ${phase.number} JSON`}
                getValue={() => stringifyExecutionData(
                  buildPhaseSnapshot(phase, timing, phaseRecords, timingNow),
                )}
              />
            </div>
            <div className="d5-dev-tool-ai-agent__meta-grid">
              <p className="d5-dev-tool-ai-agent__meta-row">
                <strong>Started:</strong> <code>{formatPhaseTimestamp(timing.startedAt)}</code>
              </p>
              <p className="d5-dev-tool-ai-agent__meta-row">
                <strong>Ended:</strong> <code>{formatPhaseTimestamp(timing.endedAt)}</code>
              </p>
              <p className="d5-dev-tool-ai-agent__meta-row">
                <strong>Duration:</strong> <code>{formatPhaseDuration(timing, timingNow)}</code>
              </p>
            </div>
            {phase.content}
            <NetworkRequestsDebug
              label="HTTP Requests In This Phase"
              records={phaseRecords}
              emptyMessage="No HTTP request is attributed to this phase. Phases that only read Redux or mutate the canvas make no network calls."
            />
          </CollapsibleCard>
        );
      })}
      {0 < unattributedNetwork.length && (
        <CollapsibleCard
          id={UNATTRIBUTED_ID}
          title="Unattributed Requests"
          subtitle={`${unattributedNetwork.length} request(s) from before this turn or from an unrecognized endpoint`}
          isExpanded={isExpanded(UNATTRIBUTED_ID)}
          onToggle={() => toggle(UNATTRIBUTED_ID)}
        >
          <NetworkRequestsDebug
            label="Requests Outside The Current Turn"
            records={unattributedNetwork}
            emptyMessage="No unattributed requests."
          />
        </CollapsibleCard>
      )}
    </div>
  );
};
