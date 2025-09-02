// External dependencies.
import React, { ReactNode } from "react";

// WordPress dependencies.
import { __ } from "@wordpress/i18n";

// Local dependencies.
import {
  useSelect,
  dispatch
} from "@divi/data";
import './styles.scss';

/**
 * Content panel component.
 */
export const ContentPanel = ({
  children,
  id,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) => {
  const modalName = `divi/divi-5-dev-tool--${id}`;
  const isOpen    = useSelect(selectStore => selectStore('divi/modal-library').isModalActive(modalName));

  return <div className="d5-dev-tool-content-panel">
    {!isOpen && (
      <button
        className="d5-dev-tool-open-in-new-modal-button"
        onClick={(e) => {
          e.preventDefault();
          dispatch('divi/modal-library').open({ name: modalName });
        }}
      >{__('Open in New Modal', 'et_builder')}</button>
    )}

  {children}
  </div>;
};
