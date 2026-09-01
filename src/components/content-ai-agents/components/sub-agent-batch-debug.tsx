// External dependencies.
import React, {
  ReactElement,
} from 'react';

// Local dependencies.
import {
  getStepStatusVariant,
  type DebugStep,
} from '../utils/debug-step';
import {
  type SubAgentBatchDebug,
  type SubAgentBatchTask,
  type SubAgentSummon,
} from '../utils/extract-sub-agent-batch';
import { CollapseControls } from './collapse-controls';
import { CollapsiblePrompt } from './collapsible-prompt';
import { StepListDebug } from './step-list-debug';
import { useExpandedItems } from './use-expanded-items';

type SubAgentBatchDebugProps = {
  batch: SubAgentBatchDebug;
  parentSteps?: DebugStep[];
  showSummon?: boolean;
  showTasks?: boolean;
};

const SUB_AGENT_STATUS_VARIANT: Record<string, string> = {
  running: 'active',
  completed: 'observed',
  failed: 'error',
  aborted: 'aborted',
  waiting: 'waiting',
};

const getSubAgentBadgeVariant = (status: string): string => (
  SUB_AGENT_STATUS_VARIANT[status] ?? getStepStatusVariant({ status })
);

const formatToolList = (tools: string[]): string => (
  0 === tools.length ? '—' : tools.join(', ')
);

const SummonTree = ({
  summons,
}: {
  summons: SubAgentSummon[];
}): ReactElement => {
  if (0 === summons.length) {
    return (
      <p className="d5-dev-tool-ai-agent__empty">
        No `run_subagents` call has been observed on this turn yet. The planner can still instruct concurrent delegation; the parent agent summons sub-agents when it invokes that tool.
      </p>
    );
  }

  return (
    <ol className="d5-dev-tool-ai-agent__summon-list">
      {summons.map((summon, index) => (
        <li key={summon.toolStep.id ?? `summon-${index}`} className="d5-dev-tool-ai-agent__summon-item">
          <div className="d5-dev-tool-ai-agent__summon-parent">
            <span className="d5-dev-tool-ai-agent__context-label">Parent agent</span>
            <p className="d5-dev-tool-ai-agent__summon-goal">
              {summon.parentGoal || 'Planner step (goal not stored on this tool call)'}
            </p>
            <p className="d5-dev-tool-ai-agent__todo-meta">
              summoned {summon.tasks.length} sub-agent{1 === summon.tasks.length ? '' : 's'} via
              {' '}
              <code>run_subagents</code>
              {summon.isComplete ? ' · joined' : ' · joining'}
            </p>
          </div>
          {0 < summon.tasks.length && (
            <ol className="d5-dev-tool-ai-agent__summon-tasks">
              {summon.tasks.map(task => (
                <li key={`${task.resourceKey}-${task.goal}`} className="d5-dev-tool-ai-agent__summon-task">
                  <div className="d5-dev-tool-ai-agent__todo-header">
                    {task.resourceKey && (
                      <span className="d5-dev-tool-ai-agent__badge">
                        {task.resourceKey}
                      </span>
                    )}
                    <span className="d5-dev-tool-ai-agent__summon-task-goal">{task.goal}</span>
                  </div>
                  <p className="d5-dev-tool-ai-agent__todo-meta">
                    tools: <code>{formatToolList(task.tools)}</code>
                  </p>
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  );
};

const SubAgentTaskCard = ({
  task,
  isExpanded,
  onToggle,
}: {
  task: SubAgentBatchTask;
  isExpanded: boolean;
  onToggle: () => void;
}): ReactElement => (
  <div className="d5-dev-tool-ai-agent__step-card">
    <button
      type="button"
      className="d5-dev-tool-ai-agent__step-header d5-dev-tool-ai-agent__step-header--stacked"
      onClick={onToggle}
      aria-expanded={isExpanded}
    >
      <span className="d5-dev-tool-ai-agent__step-header-main">
        <span className="d5-dev-tool-ai-agent__step-title">
          Sub-agent {task.index}
          {task.resourceKey ? ` — ${task.resourceKey}` : ''}
          <span className={`d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--phase-${getSubAgentBadgeVariant(task.status)}`}>
            {task.status}
          </span>
        </span>
        <span className="d5-dev-tool-ai-agent__step-preview">{task.goal}</span>
      </span>
      <span className="d5-dev-tool-ai-agent__card-chevron">
        {isExpanded ? '▼' : '▶'}
      </span>
    </button>
    {isExpanded && (
      <div className="d5-dev-tool-ai-agent__step-body">
        <div className="d5-dev-tool-ai-agent__meta-grid">
          {task.resourceKey && (
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Resource Key:</strong> <code>{task.resourceKey}</code>
            </p>
          )}
          {task.handleId && (
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Handle / Thread:</strong> <code>{task.handleId}</code>
            </p>
          )}
          {task.activityId && (
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Activity ID:</strong> <code>{task.activityId}</code>
            </p>
          )}
          {task.parentActivityId && (
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Parent Activity:</strong> <code>{task.parentActivityId}</code>
            </p>
          )}
          <p className="d5-dev-tool-ai-agent__meta-row">
            <strong>Tools:</strong> <code>{formatToolList(task.tools)}</code>
          </p>
        </div>
        {task.resultContent && (
          <CollapsiblePrompt
            label="Returned Report"
            content={task.resultContent}
            variant="tool-response"
          />
        )}
        <StepListDebug
          label="Sub-agent Events"
          steps={task.childSteps}
          idPrefix={`sub-agent-${task.index}`}
          emptyMessage="This sub-agent has not emitted nested thinking or tool-call steps yet."
        />
      </div>
    )}
  </div>
);

/**
 * Shows how the parent agent summoned concurrent sub-agents and how each one completed.
 */
export const SubAgentBatchDebugView = ({
  batch,
  parentSteps = [],
  showSummon = true,
  showTasks = true,
}: SubAgentBatchDebugProps): ReactElement => {
  const taskIds = batch.tasks.map(task => `sub-agent-task-${task.index}-${task.handleId ?? task.goal}`);
  const {
    isExpanded,
    toggle,
    expandAll,
    collapseAll,
  } = useExpandedItems(taskIds, false);

  return (
    <div className="d5-dev-tool-ai-agent__subagent-batch">
      {showSummon && (
        <div className="d5-dev-tool-ai-agent__context-group">
          <span className="d5-dev-tool-ai-agent__context-label">How the parent summoned sub-agents</span>
          <SummonTree summons={batch.summons} />
        </div>
      )}

      {0 < parentSteps.length && (
        <StepListDebug
          label="Parent Agent Events"
          steps={parentSteps}
          idPrefix="parent-agent"
          emptyMessage="No parent-agent events observed."
        />
      )}

      {showTasks && (
        <div className="d5-dev-tool-ai-agent__step-group">
          <div className="d5-dev-tool-ai-agent__section-header">
            <span className="d5-dev-tool-ai-agent__context-label">
              Concurrent Sub-agents ({batch.tasks.length})
            </span>
            {0 < batch.tasks.length && (
              <CollapseControls onExpandAll={expandAll} onCollapseAll={collapseAll} />
            )}
          </div>
          {0 === batch.tasks.length ? (
            <p className="d5-dev-tool-ai-agent__empty">
              No sub-agent was summoned on this turn. Ordinary parent-agent work continues without delegation.
            </p>
          ) : (
            <div className="d5-dev-tool-ai-agent__step-list">
              {batch.tasks.map((task, index) => {
                const taskId = taskIds[index];

                return (
                  <SubAgentTaskCard
                    key={taskId}
                    task={task}
                    isExpanded={isExpanded(taskId)}
                    onToggle={() => toggle(taskId)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
