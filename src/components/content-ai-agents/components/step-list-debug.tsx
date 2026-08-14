// External dependencies.
import React, {
  ReactElement,
  useMemo,
} from 'react';

// Local dependencies.
import {
  formatCompactStepValue,
  formatFieldLabel,
  getStepKindLabel,
  getStepPreview,
  getStepStatusVariant,
  isCompactStepValue,
  stepActivityFailed,
  toolStepHasError,
  type DebugStep,
} from '../utils/debug-step';
import {
  parseToolCallStep,
  type AssistantStep,
} from '../utils/parse-tool-call';
import { stringifyExecutionData } from '../utils/stringify-execution-data';
import { CollapseControls } from './collapse-controls';
import {
  CollapsiblePrompt,
  type PromptVariant,
} from './collapsible-prompt';
import { useExpandedItems } from './use-expanded-items';

type StepListDebugProps = {
  label: string;
  steps: DebugStep[];
  idPrefix: string;
  emptyMessage: string;
};

// Rendered in the header, so they would be duplicated as body fields.
const HEADER_FIELDS = ['type', 'label'];

const getFieldVariant = (key: string, step: DebugStep): PromptVariant => {
  if (/param|arg|request|input/i.test(key)) {
    return 'tool-request';
  }

  if (/result|response|output|return/i.test(key)) {
    return 'tool-response';
  }

  if ('thinking' === step.type || /thinking|system|prompt/i.test(key)) {
    return 'system-prompt';
  }

  return 'response';
};

const toPromptContent = (value: unknown): string => (
  'string' === typeof value ? value : stringifyExecutionData(value)
);

/**
 * Renders one step's own properties: short values inline, bulky ones collapsed.
 */
const StepFields = ({ step }: { step: DebugStep }): ReactElement => {
  const parsedTool = 'tool_call' === step.type
    ? parseToolCallStep(step as AssistantStep)
    : null;
  const hasParsedToolSections = Boolean(parsedTool?.params || parsedTool?.result);
  const skippedFields = HEADER_FIELDS.concat(
    hasParsedToolSections ? ['content', 'argsPreview'] : [],
  );
  const fieldKeys = Object.keys(step).filter(key => -1 === skippedFields.indexOf(key));
  const compactKeys = fieldKeys.filter(key => isCompactStepValue(step[key]));
  const bulkyKeys = fieldKeys.filter(key => !isCompactStepValue(step[key]));

  return (
    <div className="d5-dev-tool-ai-agent__step-body">
      {(parsedTool || 0 < compactKeys.length) && (
        <div className="d5-dev-tool-ai-agent__meta-grid">
          {parsedTool && (
            <p className="d5-dev-tool-ai-agent__meta-row">
              <strong>Tool:</strong> <code>{parsedTool.toolName}</code>
            </p>
          )}
          {compactKeys.map(key => (
            <p key={key} className="d5-dev-tool-ai-agent__meta-row">
              <strong>{formatFieldLabel(key)}:</strong>
              {' '}
              <code>{formatCompactStepValue(step[key])}</code>
            </p>
          ))}
        </div>
      )}
      {parsedTool?.params && (
        <CollapsiblePrompt
          label="Request Parameters"
          content={parsedTool.params}
          variant="tool-request"
        />
      )}
      {parsedTool?.result && (
        <CollapsiblePrompt
          label="Returned Value"
          content={parsedTool.result}
          variant="tool-response"
        />
      )}
      {bulkyKeys.map(key => (
        <CollapsiblePrompt
          key={key}
          label={formatFieldLabel(key)}
          content={toPromptContent(step[key])}
          variant={getFieldVariant(key, step)}
        />
      ))}
    </div>
  );
};

const StepCard = ({
  step,
  index,
  isExpanded,
  onToggle,
}: {
  step: DebugStep;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}): ReactElement => {
  const preview = getStepPreview(step);
  const isToolCall = 'tool_call' === step.type;
  const toolName = isToolCall
    ? parseToolCallStep(step as AssistantStep).toolName
    : '';
  const headline = toolName || step.label || '';
  const hasFailed = isToolCall ? toolStepHasError(step) : stepActivityFailed(step);

  return (
    <div className="d5-dev-tool-ai-agent__step-card">
      <button
        type="button"
        className="d5-dev-tool-ai-agent__step-header d5-dev-tool-ai-agent__step-header--stacked"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className="d5-dev-tool-ai-agent__step-header-main">
          <span className="d5-dev-tool-ai-agent__step-title">
            {index + 1}. {getStepKindLabel(step.type)}
            {headline ? ` — ${headline}` : ''}
            {hasFailed && (
              <span className="d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--phase-error">
                error
              </span>
            )}
            {!hasFailed && step.status && (
              <span className={`d5-dev-tool-ai-agent__badge d5-dev-tool-ai-agent__badge--phase-${getStepStatusVariant(step)}`}>
                {step.status}
              </span>
            )}
          </span>
          {preview && (
            <span className="d5-dev-tool-ai-agent__step-preview">{preview}</span>
          )}
        </span>
        <span className="d5-dev-tool-ai-agent__card-chevron">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>
      {isExpanded && <StepFields step={step} />}
    </div>
  );
};

/**
 * Lists assistant steps as individually collapsible items instead of one
 * object tree, so a turn can be scanned without expanding anything.
 */
export const StepListDebug = ({
  label,
  steps,
  idPrefix,
  emptyMessage,
}: StepListDebugProps): ReactElement => {
  const stepIds = useMemo(
    () => steps.map((step, index) => `${idPrefix}-${step.id ?? index}`),
    [idPrefix, steps],
  );
  const {
    isExpanded,
    toggle,
    expandAll,
    collapseAll,
  } = useExpandedItems(stepIds, false);

  if (0 === steps.length) {
    return <p className="d5-dev-tool-ai-agent__empty">{emptyMessage}</p>;
  }

  return (
    <div className="d5-dev-tool-ai-agent__step-group">
      <div className="d5-dev-tool-ai-agent__section-header">
        <span className="d5-dev-tool-ai-agent__context-label">
          {label} ({steps.length})
        </span>
        <CollapseControls onExpandAll={expandAll} onCollapseAll={collapseAll} />
      </div>
      <div className="d5-dev-tool-ai-agent__step-list">
        {steps.map((step, index) => {
          const stepId = stepIds[index];

          return (
            <StepCard
              key={stepId}
              step={step}
              index={index}
              isExpanded={isExpanded(stepId)}
              onToggle={() => toggle(stepId)}
            />
          );
        })}
      </div>
    </div>
  );
};
