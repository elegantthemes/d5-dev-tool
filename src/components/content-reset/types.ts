// External dependencies.
import { ReactElement } from 'react';

export type ResetAction = 'global-variables' | 'module-presets' | 'group-presets';

export interface ContentResetProps {
  isResetting: ResetAction | null;
  pendingReset: ResetAction | null;
  error: string | null;
  successMessage: string | null;
  onResetClick: (action: ResetAction) => void;
  onConfirmReset: (action: ResetAction) => Promise<void>;
  onCancelReset: () => void;
}

export type ContentResetComponent = (props: ContentResetProps) => ReactElement;
