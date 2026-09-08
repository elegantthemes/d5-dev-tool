// External dependencies.
import React, {
  ReactElement,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  isObject,
} from 'lodash';

// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Divi dependencies (accessed via window at runtime).
const IconSvg = (window as any)?.divi?.iconLibrary?.IconSvg;

// Local dependencies.
import { CopyValueButton } from './copy-value-button';
import {
  CollapsibleControlSignal,
  CollapsibleObjectRendererProps,
  CollapsibleValueProps,
} from './types';
import { getVariableStatus } from './utils/normalize-global-variables';

/**
 * Helper function to handle processed serialized data from PHP.
 */
const processSerializedData = (value: unknown): unknown => {
  if (isObject(value) && value !== null) {
    const obj = value as Record<string, unknown>;

    if (obj.__serialized_data__ === true && 'data' in obj) {
      return obj.data;
    }
  }

  return value;
};

/**
 * Serialize a value for clipboard copy.
 */
const serializeValueForCopy = (value: unknown): string => {
  if (isObject(value) || Array.isArray(value)) {
    return JSON.stringify(value, null, 2);
  }

  return String(value ?? '');
};

/**
 * Determine whether a value should render as a collapsible object.
 */
const isCollapsibleObjectValue = (value: unknown, currentDepth: number, maxDepth: number): boolean => {
  const processedValue = processSerializedData(value);

  return isObject(processedValue)
    && !Array.isArray(processedValue)
    && currentDepth < maxDepth - 1;
};

/**
 * Collapsible Value Component.
 */
const CollapsibleValue = ({
  name,
  value,
}: CollapsibleValueProps): ReactElement => {
  const displayValue = isObject(value) ? JSON.stringify(value, null, 2) : String(value);

  return (
    <div className="d5-dev-tool-editable-value">
      <div className="d5-dev-tool-editable-value-header">
        <span className="d5-dev-tool-editable-value-name">{name}</span>
        <div className="d5-dev-tool-editable-value-actions">
          <CopyValueButton getValue={() => serializeValueForCopy(value)} />
        </div>
      </div>
      <div className="d5-dev-tool-editable-value-content">
        <span className="d5-dev-tool-editable-value-display">
          {displayValue}
        </span>
      </div>
    </div>
  );
};

/**
 * Collapsible Object Renderer with copy support at each level.
 */
export const CollapsibleObjectRenderer = ({
  values,
  maxDepth = 15,
  currentDepth = 0,
  propertyName,
  variableId,
  groupKey,
  parentControl = null,
}: CollapsibleObjectRendererProps): ReactElement => {
  const [expand, setExpand] = useState(true);
  const [descendantControl, setDescendantControl] = useState<CollapsibleControlSignal | null>(null);

  const entries = useMemo(
    () => Object.entries(values ?? {}),
    [values],
  );

  const hasCollapsibleChildren = useMemo(
    () => entries.some(([, value]) => isCollapsibleObjectValue(value, currentDepth, maxDepth)),
    [entries, currentDepth, maxDepth],
  );

  useEffect(() => {
    if (!parentControl) {
      return;
    }

    setExpand('expand' === parentControl.action);
    setDescendantControl(parentControl);
  }, [parentControl?.action, parentControl?.token]);

  const isGroupRoot = Boolean(groupKey && 0 === currentDepth && !propertyName);
  const isVariableHeader = Boolean(groupKey && propertyName && variableId && 1 === currentDepth);
  const isArchived = isVariableHeader && 'archived' === getVariableStatus(values as Record<string, unknown>);
  const displayTitle = isVariableHeader
    ? String((values as Record<string, unknown>).label || propertyName)
    : propertyName;
  const isRootGroupToggle = isGroupRoot;
  const showHeaderActions = Boolean(propertyName || isRootGroupToggle);

  const handleCollapseAll = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setDescendantControl({ action: 'collapse', token: Date.now() });
  };

  const handleExpandAll = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setExpand(true);
    setDescendantControl({ action: 'expand', token: Date.now() });
  };

  const renderedValues: ReactElement[] = [];

  if (expand && currentDepth < maxDepth) {
    if (isGroupRoot && groupKey) {
      entries.forEach(([entryId, entryValue]) => {
        const processedValue = processSerializedData(entryValue);
        const plainValue = isObject(processedValue) && !Array.isArray(processedValue)
          ? processedValue as Record<string, unknown>
          : { value: processedValue };
        const entryLabel = 'string' === typeof plainValue.label && plainValue.label
          ? plainValue.label
          : entryId;

        renderedValues.push(
          <div className="d5-dev-tool-editable-object-item" key={entryId}>
            <CollapsibleObjectRenderer
              values={plainValue}
              maxDepth={maxDepth}
              currentDepth={1}
              propertyName={entryLabel}
              variableId={entryId}
              groupKey={groupKey}
              parentControl={descendantControl}
            />
          </div>,
        );
      });
    } else {
      entries.forEach(([name, value]) => {
        const processedValue = processSerializedData(value);

        const renderedValue = isCollapsibleObjectValue(value, currentDepth, maxDepth)
          ? (
            <CollapsibleObjectRenderer
              values={processedValue as Record<string, unknown>}
              maxDepth={maxDepth}
              currentDepth={currentDepth + 1}
              propertyName={name}
              variableId={variableId}
              groupKey={groupKey}
              parentControl={descendantControl}
            />
          )
          : (
            <CollapsibleValue
              name={name}
              value={processedValue}
            />
          );

        renderedValues.push(
          <div className="d5-dev-tool-editable-object-item" key={name}>
            {renderedValue}
          </div>,
        );
      });
    }
  }

  return (
    <div className={`d5-dev-tool-editable-object${isArchived ? ' d5-dev-tool-global-variables__item--archived' : ''}`}>
      <div className="d5-dev-tool-editable-object-header">
        <button
          type="button"
          className="d5-dev-tool-editable-object-toggle"
          onClick={() => setExpand(!expand)}
          title={expand ? __('Collapse', 'divi-5-dev-tool') : __('Expand', 'divi-5-dev-tool')}
        >
          {IconSvg ? (
            <IconSvg
              name={expand ? 'divi/caret-down' : 'divi/caret-right'}
              viewBox={expand ? '-1 0 8 10' : '-2 0 8 10'}
              size={5}
              styles={expand ? { height: '16px', marginTop: '10px' } : { height: '16px', marginTop: '7px' }}
            />
          ) : (
            <span className="d5-dev-tool-caret-fallback">
              {expand ? '▼' : '▶'}
            </span>
          )}
        </button>
        {propertyName && (
          <div className="d5-dev-tool-global-variables__title-row">
            <span className="d5-dev-tool-editable-object-property-name">
              {displayTitle}
            </span>
            {isArchived && (
              <span className="d5-dev-tool-global-variables__archived-badge">
                {__('Archived', 'divi-5-dev-tool')}
              </span>
            )}
          </div>
        )}
        {showHeaderActions && (
          <div className="d5-dev-tool-global-variables__header-actions">
            {hasCollapsibleChildren && (
              <>
                <button
                  type="button"
                  className="d5-dev-tool-global-variables__tree-button"
                  onClick={handleCollapseAll}
                  title={__('Collapse', 'divi-5-dev-tool')}
                >
                  {__('Collapse', 'divi-5-dev-tool')}
                </button>
                <button
                  type="button"
                  className="d5-dev-tool-global-variables__tree-button"
                  onClick={handleExpandAll}
                  title={__('Expand', 'divi-5-dev-tool')}
                >
                  {__('Expand', 'divi-5-dev-tool')}
                </button>
              </>
            )}
            {(propertyName || isRootGroupToggle) && (
              <CopyValueButton getValue={() => serializeValueForCopy(values)} />
            )}
          </div>
        )}
      </div>
      {expand && (
        <div className="d5-dev-tool-editable-object-content">
          {renderedValues}
        </div>
      )}
    </div>
  );
};
