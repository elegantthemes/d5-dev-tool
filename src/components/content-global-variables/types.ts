import { ReactElement } from 'react';

export interface GlobalVariableItem {
  id?: string;
  label?: string;
  value?: unknown;
  status?: string;
  order?: number | null;
  allowedActions?: {
    remove?: boolean;
  };
}

export interface GlobalVariablesData {
  numbers: Record<string, GlobalVariableItem>;
  strings: Record<string, GlobalVariableItem>;
  images: Record<string, GlobalVariableItem>;
  links: Record<string, GlobalVariableItem>;
  colors: Record<string, GlobalVariableItem>;
  fonts: Record<string, GlobalVariableItem>;
  gradients: Record<string, GlobalVariableItem>;
}

export type GlobalVariableType = keyof GlobalVariablesData;

export interface ContentGlobalVariablesProps {
  globalVariables: GlobalVariablesData | null;
}

export interface CollapsibleControlSignal {
  action: 'expand' | 'collapse';
  token: number;
}

export interface CollapsibleObjectRendererProps {
  values: Record<string, unknown>;
  maxDepth?: number;
  currentDepth?: number;
  propertyName?: string;
  variableId?: string;
  groupKey?: GlobalVariableType;
  parentControl?: CollapsibleControlSignal | null;
}

export interface CollapsibleValueProps {
  name: string;
  value: unknown;
}
