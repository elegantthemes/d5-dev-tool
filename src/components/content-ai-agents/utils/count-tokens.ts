/**
 * tiktoken-style token count without shipping the 2MB o200k rank table.
 *
 * OpenAI tiktoken first splits on a pretokenize regex, then applies BPE.
 * Short pieces are almost always one token; longer runs split at about
 * 4 characters per token, which matches typical o200k density.
 */
const PRETOKEN_PATTERN = /[A-Za-z0-9]+|[^A-Za-z0-9\s]+|\s+/g;

const countPretokens = (text: string): number => {
  const pieces = text.match(PRETOKEN_PATTERN);

  if (!pieces) {
    return 0;
  }

  return pieces.reduce((sum, piece) => {
    if (/^\s+$/.test(piece)) {
      return sum;
    }

    if (20 >= piece.length) {
      return sum + 1;
    }

    return sum + Math.ceil(piece.length / 4);
  }, 0);
};

/**
 * Estimates tokens the way tiktoken does for mixed prompt, JSON, and HTML text.
 */
export const countTokens = (text: string): number => {
  if (!text) {
    return 0;
  }

  return Math.max(countPretokens(text), Math.ceil(text.length / 4));
};
