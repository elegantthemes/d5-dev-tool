import React, {
  Children,
  isValidElement,
  ReactElement,
  useState,
  MouseEvent
} from "react";

/**
 * Wrapper of content panel component.
 */
export const ContentPanelWrapper = ({ children }: { children: ReactElement<{id: string, label: string}>[] }) => {
  const [activePanel, setActivePanel] = useState(children[0]?.props?.id);

  return (
    <div className="et-devtool-content-panel-wrapper">
      <div className="et-devtool-content-panel-wrapper-nav">
        {Children.map(children, (child) => {
          return isValidElement(child) ? (
            <button
              data-id={child?.props?.id}
              className={child?.props?.id === activePanel ? "active" : null}
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                event.preventDefault();

                console.log(event.currentTarget.getAttribute("data-id"));

                setActivePanel(event.currentTarget.getAttribute("data-id"));
              }}
            >
              {child?.props?.label}
            </button>
          ) : null;
        })}
      </div>
      <div className="et-devtool-content-panels">
        {Children.map(children, (child) => {
          return isValidElement(child) && child.props.id === activePanel
            ? child
            : null;
        })}
      </div>
    </div>
  );
};
