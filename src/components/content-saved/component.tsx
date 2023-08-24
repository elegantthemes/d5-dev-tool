// External dependencies.
import React from 'react';

// Local dependencies.
import { ContentSavedProps } from './types';

/**
 * Component for displaying saved content.
 */
export const ContentSaved = ({
  serializedLayout
}: ContentSavedProps) => (
  <pre>{serializedLayout}</pre>
)