// External dependencies.
import { ReactElement } from 'react';

export interface PresetsData {
  data: {
    module?: Record<string, unknown>;
    group?: Record<string, unknown>;
  };
  legacyData: Record<string, unknown>;
  isLegacyDataImported: boolean;
}

export interface ContentPresetsProps {
  presets: PresetsData | null;
  isLoading: boolean;
  error: string | null;
  updatePreset: (key: string, value: unknown, nestedKeys?: string[]) => Promise<void>;
  deletePreset: (key: string, nestedKeys?: string[]) => Promise<void>;
  refreshPresets: () => Promise<void>;
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
