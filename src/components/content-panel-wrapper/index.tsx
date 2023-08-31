// External dependencies.
import React, {
  Children,
  isValidElement,
  ReactElement,
  useState,
  MouseEvent
} from "react";

// Local dependencies.
import './styles.scss';

/**
 * Wrapper of content panel component.
 */
export const ContentPanelWrapper = ({ children }: { children: ReactElement<{id: string, label: string}>[] }) => {
  const [activePanel, setActivePanel] = useState(children[0]?.props?.id);

  return (
    <div className="d5-dev-tool-content-panel-wrapper">
      <div className="d5-dev-tool-content-panel-wrapper-nav">
        {Children.map(children, (child) => {
          return isValidElement(child) ? (
            <button
              data-id={child?.props?.id}
              className={child?.props?.id === activePanel ? "active" : null}
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                event.preventDefault();
                setActivePanel(event.currentTarget.getAttribute("data-id"));
              }}
            >
              {child?.props?.label}
            </button>
          ) : null;
        })}
      </div>
      <div className="d5-dev-tool-content-panels">
        {Children.map(children, (child) => {
          return isValidElement(child) && child.props.id === activePanel
            ? child
            : null;
        })}
      </div>
    </div>
  );
};
