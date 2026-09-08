import {
  isObject,
  isPlainObject,
} from 'lodash';

import {
  GlobalVariableItem,
  GlobalVariableType,
  GlobalVariablesData,
} from '../types';

export const GLOBAL_VARIABLE_GROUP_KEYS: GlobalVariableType[] = [
  'numbers',
  'strings',
  'images',
  'links',
  'colors',
  'fonts',
  'gradients',
];

/**
 * Convert immutable or nested store values into plain objects.
 */
const toPlainValue = (value: unknown): unknown => {
  if (null === value || undefined === value) {
    return value;
  }

  if ('function' === typeof (value as { asMutable?: (options: { deep: boolean }) => unknown }).asMutable) {
    return (value as { asMutable: (options: { deep: boolean }) => unknown }).asMutable({ deep: true });
  }

  if (Array.isArray(value)) {
    return value.map((item) => toPlainValue(item));
  }

  if (isObject(value)) {
    const plain: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
      plain[key] = toPlainValue(nestedValue);
    });

    return plain;
  }

  return value;
};

/**
 * Read a variable status from plain or immutable-derived data.
 */
export const getVariableStatus = (
  variable: GlobalVariableItem | Record<string, unknown> | undefined,
): string => {
  if (!variable || !isPlainObject(variable)) {
    return 'active';
  }

  const status = variable.status;

  return 'string' === typeof status && status ? status : 'active';
};

/**
 * Normalize a single global variable group into a plain record keyed by store id.
 */
const normalizeGroup = (group: unknown): Record<string, GlobalVariableItem> => {
  const plainGroup = toPlainValue(group);

  if (!isPlainObject(plainGroup)) {
    return {};
  }

  const normalizedGroup: Record<string, GlobalVariableItem> = {};

  Object.entries(plainGroup).forEach(([storeKey, value]) => {
    const plainItem = toPlainValue(value);

    if (!isPlainObject(plainItem)) {
      normalizedGroup[storeKey] = {
        id: storeKey,
        label: storeKey,
        value: plainItem,
        status: 'active',
      };
      return;
    }

    const item = plainItem as GlobalVariableItem;

    normalizedGroup[storeKey] = {
      ...item,
      id: 'string' === typeof item.id && item.id ? item.id : storeKey,
      status: getVariableStatus(item),
    };
  });

  return normalizedGroup;
};

/**
 * Normalize global variables from the Divi store for rendering.
 */
export const normalizeGlobalVariables = (data: unknown): GlobalVariablesData | null => {
  if (!data) {
    return null;
  }

  const plainData = toPlainValue(data);

  if (!isPlainObject(plainData)) {
    return null;
  }

  const normalized: GlobalVariablesData = {
    numbers: {},
    strings: {},
    images: {},
    links: {},
    colors: {},
    fonts: {},
    gradients: {},
  };

  GLOBAL_VARIABLE_GROUP_KEYS.forEach((groupKey) => {
    normalized[groupKey] = normalizeGroup(plainData[groupKey]);
  });

  Object.keys(plainData).forEach((groupKey) => {
    if (GLOBAL_VARIABLE_GROUP_KEYS.includes(groupKey as GlobalVariableType)) {
      return;
    }

    normalized[groupKey as GlobalVariableType] = normalizeGroup(plainData[groupKey]);
  });

  return normalized;
};

/**
 * Count entries in a global variable group.
 */
export const getGroupEntryCount = (group: Record<string, GlobalVariableItem> | undefined): number => {
  if (!group || !isPlainObject(group)) {
    return 0;
  }

  return Object.keys(group).length;
};

/**
 * Match Divi's Variables modal filter for visible variables.
 */
export const getVariablesVisibleInDiviUI = (
  group: Record<string, GlobalVariableItem> | undefined,
): GlobalVariableItem[] => {
  if (!group || !isPlainObject(group)) {
    return [];
  }

  return Object.values(group)
    .filter((variable) => isVisibleInVariablesUI(variable))
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
};

/**
 * Determine whether a variable appears in Divi's Variables UI.
 */
export const isVisibleInVariablesUI = (variable: GlobalVariableItem | undefined): boolean => {
  if (!variable) {
    return false;
  }

  return 'archived' !== getVariableStatus(variable);
};
