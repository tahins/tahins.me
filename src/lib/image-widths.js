export const COVER_WIDTHS = [800, 1600, 2400];
export const CARD_WIDTHS = [80, 112, 160, 224, 240];
export const PROJECT_WIDTHS = [96, 480, 800];
export const WEBP_QUALITY = 82;

/**
 * Widths to emit for a local image: never larger than the source,
 * and include the intrinsic width when it sits below the largest candidate.
 */
export function servedWidths(image, candidates) {
  const max = Number(image?.width);
  if (!max) return [...candidates];
  const widths = candidates.filter((width) => width <= max);
  if (!widths.length) return [max];
  if (widths[widths.length - 1] < max && max <= candidates[candidates.length - 1]) {
    widths.push(max);
  }
  return widths;
}

export function servedSize(image, widths) {
  const width = widths[widths.length - 1];
  const height = Math.round((width * Number(image.height)) / Number(image.width));
  return { width, height };
}
