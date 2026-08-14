/**
 * Copies text using a temporary textarea and `document.execCommand`.
 *
 * The dev tool renders inside the Visual Builder iframe, where the async
 * Clipboard API is commonly unavailable: it requires a secure context and an
 * `allow="clipboard-write"` iframe permission. This synchronous path runs
 * inside the click gesture and works without either.
 */
const copyWithExecCommand = (value: string, ownerDocument: Document): boolean => {
  const { body } = ownerDocument;

  if (!body || 'function' !== typeof ownerDocument.execCommand) {
    return false;
  }

  const textarea = ownerDocument.createElement('textarea');

  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.opacity = '0';

  body.appendChild(textarea);

  const selection = ownerDocument.getSelection();
  const previousRange = selection && 0 < selection.rangeCount
    ? selection.getRangeAt(0)
    : null;

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, value.length);

    return ownerDocument.execCommand('copy');
  } catch {
    return false;
  } finally {
    body.removeChild(textarea);

    if (selection && previousRange) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }
  }
};

/**
 * Copies text to the clipboard, preferring the gesture-safe `execCommand` path
 * and falling back to the async Clipboard API.
 *
 * @throws When neither clipboard mechanism is available.
 */
export const copyTextToClipboard = async (
  value: string,
  ownerDocument: Document = document,
): Promise<void> => {
  if (copyWithExecCommand(value, ownerDocument)) {
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);

    return;
  }

  throw new Error('Clipboard is unavailable in this context.');
};
