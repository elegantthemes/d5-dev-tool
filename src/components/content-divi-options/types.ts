// External dependencies.
import { ReactElement } from 'react';

export interface DiviOptionsData {
  [key: string]: unknown;
}

export interface ContentDiviOptionsProps {
  diviOptions: DiviOptionsData;
  isLoading: boolean;
  error: string | null;
  updateOption: (key: string, value: unknown, nestedKeys?: string[]) => Promise<void>;
  deleteOption: (key: string, nestedKeys?: string[]) => Promise<void>;
  refreshOptions: () => Promise<void>;
}

export interface EditableObjectRendererProps {
  values: Record<string, unknown>;
  onUpdate: (key: string, value: unknown, nestedKeys?: string[]) => Promise<void>;
  onDelete: (key: string, nestedKeys?: string[]) => Promise<void>;
  maxDepth?: number;
  currentDepth?: number;
  nestedKeys?: string[];
  propertyName?: string;
}

export interface EditableValueProps {
  name: string;
  value: unknown;
  onUpdate: (key: string, value: unknown, nestedKeys?: string[]) => Promise<void>;
  onDelete: (key: string, nestedKeys?: string[]) => Promise<void>;
  nestedKeys?: string[];
}
