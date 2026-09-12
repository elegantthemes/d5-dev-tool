// Local dependencies.
import { type PayloadSegment } from './segment-payload';

export type SegmentChange = 'carried' | 'modified' | 'added' | 'removed';

export type DiffedSegment = {
  segment: PayloadSegment;
  change: SegmentChange;
  previous?: PayloadSegment;
};

export type SegmentDiff = {
  current: DiffedSegment[];
  removed: PayloadSegment[];
};

export type DiffLineType = 'same' | 'add' | 'remove';

export type DiffLine = {
  type: DiffLineType;
  text: string;
};

const MAX_LCS_LINES = 2000;

/**
 * Classifies current-request segments against the previous request.
 *
 * Matching prefers identical `(role, hash)` pairs (carried-over), then the
 * first unmatched previous segment with the same role (modified or carried).
 */
export const diffSegments = (
  previous: PayloadSegment[],
  current: PayloadSegment[],
): SegmentDiff => {
  const usedPrevious = new Set<number>();
  const classified: Array<DiffedSegment | null> = current.map(() => null);

  current.forEach((segment, currentIndex) => {
    const matchIndex = previous.findIndex((candidate, previousIndex) => (
      !usedPrevious.has(previousIndex)
      && candidate.role === segment.role
      && candidate.hash === segment.hash
    ));

    if (-1 === matchIndex) {
      return;
    }

    usedPrevious.add(matchIndex);
    classified[currentIndex] = {
      segment,
      change: 'carried',
      previous: previous[matchIndex],
    };
  });

  current.forEach((segment, currentIndex) => {
    if (classified[currentIndex]) {
      return;
    }

    const matchIndex = previous.findIndex((candidate, previousIndex) => (
      !usedPrevious.has(previousIndex)
      && candidate.role === segment.role
    ));

    if (-1 === matchIndex) {
      classified[currentIndex] = {
        segment,
        change: 'added',
      };

      return;
    }

    usedPrevious.add(matchIndex);
    classified[currentIndex] = {
      segment,
      change: previous[matchIndex].hash === segment.hash ? 'carried' : 'modified',
      previous: previous[matchIndex],
    };
  });

  return {
    current: classified.filter((item): item is DiffedSegment => null !== item),
    removed: previous.filter((_, previousIndex) => !usedPrevious.has(previousIndex)),
  };
};

const splitLines = (text: string): string[] => {
  if (!text) {
    return [];
  }

  return text.split('\n');
};

const buildLcsTable = (left: string[], right: string[]): number[][] => {
  const table: number[][] = Array.from({ length: left.length + 1 }, () => (
    Array(right.length + 1).fill(0) as number[]
  ));

  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      table[leftIndex + 1][rightIndex + 1] = left[leftIndex] === right[rightIndex]
        ? table[leftIndex][rightIndex] + 1
        : Math.max(table[leftIndex + 1][rightIndex], table[leftIndex][rightIndex + 1]);
    }
  }

  return table;
};

const walkLcs = (left: string[], right: string[], table: number[][]): DiffLine[] => {
  const lines: DiffLine[] = [];
  let leftIndex = left.length;
  let rightIndex = right.length;

  while (0 < leftIndex && 0 < rightIndex) {
    if (left[leftIndex - 1] === right[rightIndex - 1]) {
      lines.push({ type: 'same', text: left[leftIndex - 1] });
      leftIndex -= 1;
      rightIndex -= 1;
    } else if (table[leftIndex][rightIndex - 1] >= table[leftIndex - 1][rightIndex]) {
      lines.push({ type: 'add', text: right[rightIndex - 1] });
      rightIndex -= 1;
    } else {
      lines.push({ type: 'remove', text: left[leftIndex - 1] });
      leftIndex -= 1;
    }
  }

  while (0 < rightIndex) {
    lines.push({ type: 'add', text: right[rightIndex - 1] });
    rightIndex -= 1;
  }

  while (0 < leftIndex) {
    lines.push({ type: 'remove', text: left[leftIndex - 1] });
    leftIndex -= 1;
  }

  return lines.reverse();
};

const diffLinesFallback = (previous: string[], current: string[]): DiffLine[] => {
  let prefixLength = 0;
  const maxPrefix = Math.min(previous.length, current.length);

  while (prefixLength < maxPrefix && previous[prefixLength] === current[prefixLength]) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  const previousRemain = previous.length - prefixLength;
  const currentRemain = current.length - prefixLength;

  while (
    suffixLength < previousRemain
    && suffixLength < currentRemain
    && previous[previous.length - 1 - suffixLength] === current[current.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  const lines: DiffLine[] = previous.slice(0, prefixLength).map(text => ({ type: 'same' as const, text }));

  previous.slice(prefixLength, previous.length - suffixLength).forEach(text => {
    lines.push({ type: 'remove', text });
  });
  current.slice(prefixLength, current.length - suffixLength).forEach(text => {
    lines.push({ type: 'add', text });
  });
  previous.slice(previous.length - suffixLength).forEach(text => {
    lines.push({ type: 'same', text });
  });

  return lines;
};

/**
 * Line-level diff for a modified segment. Uses LCS when both sides are small,
 * otherwise a prefix/suffix split so huge prompts stay cheap to render.
 */
export const diffLines = (previousText: string, currentText: string): DiffLine[] => {
  const previous = splitLines(previousText);
  const current = splitLines(currentText);

  if (0 === previous.length && 0 === current.length) {
    return [];
  }

  if (MAX_LCS_LINES < previous.length || MAX_LCS_LINES < current.length) {
    return diffLinesFallback(previous, current);
  }

  return walkLcs(previous, current, buildLcsTable(previous, current));
};
