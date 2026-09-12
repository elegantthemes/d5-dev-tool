// External dependencies.
import React, {
  ReactElement,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';

type PayloadEvolutionHelpProps = {
  title: string;
  actions?: ReactNode;
};

/**
 * Section heading with a toggleable legend for this view.
 */
export const PayloadEvolutionHelp = ({
  title,
  actions,
}: PayloadEvolutionHelpProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if ('Escape' === event.key) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="d5-dev-tool-ai-agent__help" ref={rootRef}>
      <div className="d5-dev-tool-ai-agent__evolution-heading">
        <h3 className="d5-dev-tool-ai-agent__section-title">{title}</h3>
        <button
          type="button"
          className={classnames('d5-dev-tool-ai-agent__help-button', {
            'd5-dev-tool-ai-agent__help-button--open': isOpen,
          })}
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label="How to read this view"
          title="How to read this view"
          onClick={() => setIsOpen(current => !current)}
        >
          ?
        </button>
        {actions}
      </div>
      {isOpen && (
        <div
          id={panelId}
          className="d5-dev-tool-ai-agent__help-panel"
          role="region"
          aria-label="How to read Payload Evolution"
        >
          <p className="d5-dev-tool-ai-agent__help-lead">
            Look at the chart first. Find where the prompt got bigger, and what was sent again without changing. Open a request only if you need to see why.
          </p>
          <dl className="d5-dev-tool-ai-agent__help-list">
            <div>
              <dt>Chart and gray bar</dt>
              <dd>
                The chart shows how big each request was. The solid line is what we sent. The dashed line is what came back. Orange dots are sudden jumps. Click a point to open that request. The gray bar is not “how many times.” It is the share of all tokens that were extra copies: the first send does not count, every later send of the same text does.
              </dd>
            </div>
            <div>
              <dt>Repeated text</dt>
              <dd>
                Each row is a piece of the prompt. Count the filled cells: that is how many requests it was sent in (2 = twice, 10 = ten times). A long bar means it was in every request. The number on the left is extra tokens from those later copies.
              </dd>
            </div>
            <div>
              <dt>Request list</dt>
              <dd>
                Taller bars mean bigger requests. Click one to hide the others. Purple is what we sent. Violet is what came back. ▲ means the prompt jumped in size. ● means the reply jumped in size. Faded requests are normal. <code>n/a</code> means we do not know the reply size.
              </dd>
            </div>
            <div>
              <dt>Why it grew</dt>
              <dd>
                Open a request that jumped. The tags say what added the extra text, like a tool result. Hover a tag to see which part of the AI made that call.
              </dd>
            </div>
            <div>
              <dt>Pieces of the prompt</dt>
              <dd>
                Green is new. Orange changed (open it to see what changed). Gray was sent before. Repeated gray pieces stay hidden until you open them.
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};
