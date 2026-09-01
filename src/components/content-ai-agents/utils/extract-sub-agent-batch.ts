// Local dependencies.
import { type DebugStep } from './debug-step';
import {
  parseToolCallStep,
  type AssistantStep,
} from './parse-tool-call';

export const RUN_SUBAGENTS_TOOL = 'run_subagents';

export type SubAgentTaskSpec = {
  goal: string;
  tools: string[];
  resourceKey: string;
};

export type SubAgentJoinResult = {
  success: boolean;
  handleId: string;
  status: string;
  goal: string;
  resourceKey: string;
  content: string;
  message: string;
};

export type SubAgentSummon = {
  parentActivityId: string | null;
  parentGoal: string | null;
  tasks: SubAgentTaskSpec[];
  results: SubAgentJoinResult[];
  toolStep: DebugStep;
  isComplete: boolean;
};

export type SubAgentBatchTask = {
  index: number;
  goal: string;
  tools: string[];
  resourceKey: string;
  handleId: string | null;
  activityId: string | null;
  parentActivityId: string | null;
  status: string;
  lifecycleStep: DebugStep | null;
  childSteps: DebugStep[];
  resultContent: string | null;
};

export type SubAgentBatchDebug = {
  summons: SubAgentSummon[];
  tasks: SubAgentBatchTask[];
  parentActivityIds: string[];
  subAgentActivityIds: string[];
};

const parseJsonValue = (value: string | null): unknown => {
  if (!value?.trim()) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null => (
  value && 'object' === typeof value && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
);

const asString = (value: unknown): string => (
  'string' === typeof value ? value.trim() : ''
);

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => ('string' === typeof item ? item.trim() : ''))
    .filter(Boolean);
};

const parseTaskSpec = (value: unknown): SubAgentTaskSpec | null => {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const goal = asString(record.goal);

  if (!goal) {
    return null;
  }

  return {
    goal,
    tools: asStringArray(record.tools),
    resourceKey: asString(record.resourceKey),
  };
};

const parseJoinResult = (value: unknown): SubAgentJoinResult | null => {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const goal = asString(record.goal);

  if (!goal) {
    return null;
  }

  return {
    success: false !== record.success,
    handleId: asString(record.handleId),
    status: asString(record.status) || (false === record.success ? 'failed' : 'completed'),
    goal,
    resourceKey: asString(record.resourceKey),
    content: asString(record.content),
    message: asString(record.message),
  };
};

/**
 * True when a step is the parent agent's `run_subagents` tool call.
 */
export const isRunSubAgentsStep = (step: DebugStep): boolean => {
  if ('tool_call' !== step.type) {
    return false;
  }

  return RUN_SUBAGENTS_TOOL === parseToolCallStep(step as AssistantStep).toolName;
};

const parseSummonFromToolStep = (step: DebugStep): SubAgentSummon => {
  const parsed = parseToolCallStep(step as AssistantStep);
  const params = asRecord(parseJsonValue(parsed.params));
  const result = asRecord(parseJsonValue(parsed.result));
  const tasks = Array.isArray(params?.tasks)
    ? params.tasks.map(parseTaskSpec).filter((task): task is SubAgentTaskSpec => null !== task)
    : [];
  const results = Array.isArray(result?.results)
    ? result.results.map(parseJoinResult).filter((item): item is SubAgentJoinResult => null !== item)
    : [];

  return {
    parentActivityId: 'string' === typeof step.activityId ? step.activityId : null,
    parentGoal: 'string' === typeof step.goal ? step.goal : null,
    tasks,
    results,
    toolStep: step,
    isComplete: Boolean(parsed.result),
  };
};

const matchLifecycleStep = (
  task: SubAgentTaskSpec,
  joinResult: SubAgentJoinResult | null,
  leftoverSteps: DebugStep[],
): DebugStep | null => {
  const handleId = joinResult?.handleId ?? '';
  const goal = joinResult?.goal || task.goal;

  const handleMatch = leftoverSteps.find(step => (
    handleId && handleId === step.subAgentHandleId
  ));

  if (handleMatch) {
    return handleMatch;
  }

  const goalMatch = leftoverSteps.find(step => (
    'string' === typeof step.goal && step.goal === goal
  ));

  return goalMatch ?? leftoverSteps[0] ?? null;
};

const takeStep = (steps: DebugStep[], step: DebugStep | null): DebugStep[] => {
  if (!step) {
    return steps;
  }

  return steps.filter(candidate => candidate !== step);
};

/**
 * Groups parent `run_subagents` calls with the nested sub-agent lifecycle
 * entries and the child steps each sub-agent emitted while running.
 */
export const extractSubAgentBatch = (steps: DebugStep[]): SubAgentBatchDebug => {
  const summons = steps.filter(isRunSubAgentsStep).map(parseSummonFromToolStep);
  const lifecycleSteps = steps.filter(step => 'sub_agent' === step.type);
  const subAgentActivityIds = lifecycleSteps
    .map(step => ('string' === typeof step.activityId ? step.activityId : ''))
    .filter(Boolean);
  const parentActivityIds = summons
    .map(summon => summon.parentActivityId ?? '')
    .concat(lifecycleSteps.map(step => (
      'string' === typeof step.parentActivityId ? step.parentActivityId : ''
    )))
    .filter((activityId, index, ids) => Boolean(activityId) && index === ids.indexOf(activityId));
  let leftoverLifecycle = [...lifecycleSteps];
  const declaredTasks = 0 < summons.length
    ? summons.reduce<Array<{ task: SubAgentTaskSpec; summon: SubAgentSummon | null }>>((tasks, summon) => (
      tasks.concat(summon.tasks.map(task => ({
        task,
        summon,
      })))
    ), [])
    : lifecycleSteps.map(step => ({
      task: {
        goal: 'string' === typeof step.goal ? step.goal : '',
        tools: [] as string[],
        resourceKey: '',
      },
      summon: null as SubAgentSummon | null,
    }));

  const tasks: SubAgentBatchTask[] = declaredTasks.map(({ task, summon }, index) => {
    const joinResult = summon?.results.find(result => (
      result.goal === task.goal
      && (!task.resourceKey || result.resourceKey === task.resourceKey)
    )) ?? summon?.results[index] ?? null;
    const lifecycleStep = matchLifecycleStep(task, joinResult, leftoverLifecycle);
    leftoverLifecycle = takeStep(leftoverLifecycle, lifecycleStep);
    const activityId = 'string' === typeof lifecycleStep?.activityId
      ? lifecycleStep.activityId
      : null;
    const childSteps = activityId
      ? steps.filter(step => (
        'sub_agent' !== step.type
        && step.activityId === activityId
      ))
      : [];

    return {
      index: index + 1,
      goal: joinResult?.goal || task.goal,
      tools: task.tools,
      resourceKey: joinResult?.resourceKey || task.resourceKey,
      handleId: joinResult?.handleId
        || ('string' === typeof lifecycleStep?.subAgentHandleId
          ? lifecycleStep.subAgentHandleId
          : null),
      activityId,
      parentActivityId: 'string' === typeof lifecycleStep?.parentActivityId
        ? lifecycleStep.parentActivityId
        : (summon?.parentActivityId ?? null),
      status: joinResult?.status
        || ('string' === typeof lifecycleStep?.subAgentStatus
          ? lifecycleStep.subAgentStatus
          : (lifecycleStep ? 'running' : 'waiting')),
      lifecycleStep,
      childSteps,
      resultContent: joinResult?.content || null,
    };
  });

  leftoverLifecycle.forEach(step => {
    const activityId = 'string' === typeof step.activityId ? step.activityId : null;

    tasks.push({
      index: tasks.length + 1,
      goal: 'string' === typeof step.goal ? step.goal : '',
      tools: [],
      resourceKey: '',
      handleId: 'string' === typeof step.subAgentHandleId ? step.subAgentHandleId : null,
      activityId,
      parentActivityId: 'string' === typeof step.parentActivityId ? step.parentActivityId : null,
      status: 'string' === typeof step.subAgentStatus ? step.subAgentStatus : 'running',
      lifecycleStep: step,
      childSteps: activityId
        ? steps.filter(candidate => (
          'sub_agent' !== candidate.type
          && candidate.activityId === activityId
        ))
        : [],
      resultContent: null,
    });
  });

  return {
    summons,
    tasks,
    parentActivityIds,
    subAgentActivityIds,
  };
};

/**
 * True when a step belongs to a nested sub-agent rather than the parent agent.
 */
export const isSubAgentOwnedStep = (
  step: DebugStep,
  batch: SubAgentBatchDebug,
): boolean => {
  if ('sub_agent' === step.type) {
    return true;
  }

  return 'string' === typeof step.activityId
    && -1 !== batch.subAgentActivityIds.indexOf(step.activityId);
};
