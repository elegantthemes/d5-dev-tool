// External dependencies.
import React, { ReactNode } from "react";

// Local dependencies.
import './styles.scss';

/**
 * Content panel component.
 */
export const ContentPanel = ({
  children
}: {
  id: string;
  label: string;
  children: ReactNode;
}) => {
  return <div className="d5-dev-tool-content-panel">{children}</div>;
};
