/**
 * Compact token counts for glance UI (12.4k, 900, 0).
 */
export const formatCompactTokens = (count: number): string => {
  const absolute = Math.abs(count);

  if (10000 <= absolute) {
    return `${Math.round(count / 1000)}k`;
  }

  if (1000 <= absolute) {
    return `${(count / 1000).toFixed(1)}k`;
  }

  return count.toLocaleString();
};

/**
 * Signed compact token delta (+1.8k, -400, 0).
 */
export const formatTokenDelta = (delta: number): string => {
  if (0 === delta) {
    return '0';
  }

  const prefix = 0 < delta ? '+' : '';

  return `${prefix}${formatCompactTokens(delta)}`;
};

/**
 * Integer percent from a 0–1 ratio, clamped for display.
 */
export const formatPercent = (ratio: number): string => {
  const percent = Math.round(ratio * 100);

  if (0 > percent) {
    return '0%';
  }

  if (100 < percent) {
    return '100%';
  }

  return `${percent}%`;
};
