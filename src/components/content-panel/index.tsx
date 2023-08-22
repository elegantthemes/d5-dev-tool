import React, { ReactNode } from "react";

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
  return <div className="et-devtool-content-panel">{children}</div>;
};
