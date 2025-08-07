// External dependencies.
import React, {
  ReactElement,
  useState,
} from 'react';
import {
  forEach,
  isObject,
  isString,
  isNumber,
  isBoolean,
} from 'lodash';
// Generate simple unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Helper function to handle processed serialized data from PHP.
 */
const processSerializedData = (value: unknown): unknown => {
  if (isObject(value) && value !== null) {
    const obj = value as Record<string, unknown>;

    // Check if this is a processed serialized data object from PHP
    if (obj.__serialized_data__ === true && 'data' in obj) {
      return obj.data;
    }
  }

  return value;
};

// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Divi dependencies (accessed via window at runtime).
const IconSvg = (window as any)?.divi?.iconLibrary?.IconSvg;

// Local dependencies.
import { EditableObjectRendererProps, EditableValueProps } from './types';
import './styles.scss';

/**
 * Editable Value Component.
 *
 * Renders individual value with edit and delete capabilities.
 */
const EditableValue = ({
  name,
  value,
  onUpdate,
  onDelete,
  nestedKeys = [],
}: EditableValueProps): ReactElement => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ''));
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    try {
      let processedValue: unknown = editValue;

      // Try to parse as JSON for objects/arrays, or convert to appropriate type
      if (isObject(value)) {
        try {
          processedValue = JSON.parse(editValue);
        } catch {
          processedValue = editValue;
        }
      } else if (isNumber(value)) {
        const numValue = Number(editValue);
        processedValue = isNaN(numValue) ? editValue : numValue;
      } else if (isBoolean(value)) {
        processedValue = editValue.toLowerCase() === 'true';
      }

      await onUpdate(name, processedValue, nestedKeys);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update value:', error);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    try {
      await onDelete(name, nestedKeys);
    } catch (error) {
      console.error('Failed to delete value:', error);
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(String(value || ''));
    setIsDeleting(false);
  };

  const displayValue = isObject(value) ? JSON.stringify(value, null, 2) : String(value);

  return (
    <div className="d5-dev-tool-editable-value">
      <div className="d5-dev-tool-editable-value-header">
        <span className="d5-dev-tool-editable-value-name">{name}</span>
        <div className="d5-dev-tool-editable-value-actions">
          {!isEditing && !isDeleting && (
            <>
              <button
                type="button"
                className="d5-dev-tool-btn d5-dev-tool-btn--edit"
                onClick={() => setIsEditing(true)}
                title={__('Edit', 'divi-5-dev-tool')}
              >
                {IconSvg ? <IconSvg name="divi/pencil" viewBox="6 6 16 16" size={6} /> : '✏️'}
              </button>
              <button
                type="button"
                className="d5-dev-tool-btn d5-dev-tool-btn--delete"
                onClick={handleDelete}
                title={__('Delete', 'divi-5-dev-tool')}
              >
                {IconSvg ? <IconSvg name="divi/delete" viewBox="6 6 16 16" size={6} /> : '🗑️'}
              </button>
            </>
          )}
          {isDeleting && (
            <>
              <button
                type="button"
                className="d5-dev-tool-btn d5-dev-tool-btn--confirm-delete"
                onClick={handleDelete}
                title={__('Confirm Delete', 'divi-5-dev-tool')}
              >
                {IconSvg ? <IconSvg name="divi/check" size={6} /> : '✓'}
              </button>
              <button
                type="button"
                className="d5-dev-tool-btn d5-dev-tool-btn--cancel"
                onClick={handleCancel}
                title={__('Cancel', 'divi-5-dev-tool')}
              >
                {IconSvg ? <IconSvg name="divi/close" size={6} /> : '✕'}
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                className="d5-dev-tool-btn d5-dev-tool-btn--save"
                onClick={handleSave}
                title={__('Save', 'divi-5-dev-tool')}
              >
                {IconSvg ? <IconSvg name="divi/check" size={6} /> : '✓'}
              </button>
              <button
                type="button"
                className="d5-dev-tool-btn d5-dev-tool-btn--cancel"
                onClick={handleCancel}
                title={__('Cancel', 'divi-5-dev-tool')}
              >
                {IconSvg ? <IconSvg name="divi/close" size={6} /> : '✕'}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="d5-dev-tool-editable-value-content">
        {isEditing ? (
          <textarea
            className="d5-dev-tool-editable-value-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={isObject(value) ? 4 : 1}
          />
        ) : (
          <span className="d5-dev-tool-editable-value-display">
            {displayValue}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Editable Object Renderer.
 *
 * Component for visualizing and editing object values up to maxDepth levels.
 */
export const EditableObjectRenderer = ({
  values,
  onUpdate,
  onDelete,
  maxDepth = 5,
  currentDepth = 0,
  nestedKeys = [],
  propertyName,
}: EditableObjectRendererProps): ReactElement => {
  const [expand, setExpand] = useState(true);
  const renderedValues: ReactElement[] = [];

  /**
   * Handle deleting the entire object.
   */
  const handleObjectDelete = async () => {
    if (!propertyName || nestedKeys.length === 0) {
      return;
    }

    if (confirm(__('Are you sure you want to delete this entire object? This action cannot be undone.', 'divi-5-dev-tool'))) {
      try {
        // Remove the current property name from nested keys to get parent path
        const parentNestedKeys = nestedKeys.slice(0, -1);
        await onDelete(propertyName, parentNestedKeys);
      } catch (error) {
        console.error('Failed to delete object:', error);
        alert(__('Failed to delete object. Please try again.', 'divi-5-dev-tool'));
      }
    }
  };

    if (expand && currentDepth < maxDepth) {
    forEach(values, (value, name) => {
      const currentNestedKeys = [...nestedKeys, name];

      // Process serialized data
      const processedValue = processSerializedData(value);

      const renderedValue = isObject(processedValue) && !Array.isArray(processedValue) && currentDepth < maxDepth - 1
        ? (
          <EditableObjectRenderer
            values={processedValue as Record<string, unknown>}
            onUpdate={onUpdate}
            onDelete={onDelete}
            maxDepth={maxDepth}
            currentDepth={currentDepth + 1}
            nestedKeys={currentNestedKeys}
            propertyName={name}
          />
        )
        : (
          <EditableValue
            name={name}
            value={processedValue}
            onUpdate={onUpdate}
            onDelete={onDelete}
            nestedKeys={nestedKeys}
          />
        );

      const renderItem = (
        <div
          className="d5-dev-tool-editable-object-item"
          key={`editable-object-item--${name}-${generateId()}`}
        >
          {renderedValue}
        </div>
      );

      renderedValues.push(renderItem);
    });
  }

  return (
    <div className="d5-dev-tool-editable-object">
      <div className="d5-dev-tool-editable-object-header">
        <button
          type="button"
          className="d5-dev-tool-editable-object-toggle"
          onClick={() => setExpand(!expand)}
          title={expand ? __('Collapse', 'divi-5-dev-tool') : __('Expand', 'divi-5-dev-tool')}
        >
          {IconSvg ? (
            <IconSvg
              name={expand ? "divi/caret-down" : "divi/caret-right"}
              viewBox={expand ? "-1 0 8 10" : "-2 0 8 10"}
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
          <span className="d5-dev-tool-editable-object-property-name">
            {propertyName}
          </span>
        )}
        {propertyName && nestedKeys.length > 0 && (
          <button
            type="button"
            className="d5-dev-tool-btn d5-dev-tool-btn--delete d5-dev-tool-object-delete"
            onClick={handleObjectDelete}
            title={__('Delete entire object', 'divi-5-dev-tool')}
          >
            {IconSvg ? <IconSvg name="divi/delete" size={6} /> : '🗑️'}
          </button>
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
