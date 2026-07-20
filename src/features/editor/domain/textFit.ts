// Shared text-fitting estimates so node sizing (when a diagram is generated)
// and font sizing (when a node is rendered) agree on how much room a label
// needs. Both must model word wrapping: CSS breaks on word boundaries, so a
// raw character count underestimates the number of lines and lets text spill
// out of the shape.

/** Average glyph width as a fraction of font size, tuned for the UI font. */
export const AVERAGE_GLYPH_RATIO = 0.6;
export const LINE_HEIGHT_RATIO = 1.3;
/** Padding reserved inside a node box (horizontal and vertical). */
export const NODE_TEXT_PADDING = 16;

export function toPlainLabel(text: string): string {
  return text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Estimates how many lines `text` occupies when wrapped at `charsPerLine`,
 * breaking on spaces and splitting any single word that is itself too long.
 */
export function estimateWrappedLines(text: string, charsPerLine: number): number {
  if (charsPerLine <= 0) return Number.POSITIVE_INFINITY;
  const words = text.split(' ').filter(Boolean);
  if (words.length === 0) return 0;

  let lines = 1;
  let used = 0;

  for (const word of words) {
    if (word.length > charsPerLine) {
      if (used > 0) {
        lines += 1;
        used = 0;
      }
      const extraLines = Math.ceil(word.length / charsPerLine) - 1;
      lines += extraLines;
      used = word.length - extraLines * charsPerLine;
      continue;
    }

    const needed = used === 0 ? word.length : used + 1 + word.length;
    if (needed <= charsPerLine) {
      used = needed;
    } else {
      lines += 1;
      used = word.length;
    }
  }

  return lines;
}

export function charsPerLineAt(fontSize: number, boxWidth: number): number {
  return Math.floor((boxWidth - NODE_TEXT_PADDING) / (fontSize * AVERAGE_GLYPH_RATIO));
}

/**
 * Largest font size (within bounds) at which the wrapped label still fits the
 * node box. Falls back to the minimum rather than overflowing.
 */
export function fitFontSize(
  text: string,
  boxWidth: number,
  boxHeight: number,
  options: { min?: number; max?: number } = {},
): number {
  const min = options.min ?? 9;
  const max = options.max ?? 18;
  const plain = toPlainLabel(text);
  if (!plain) return max;

  const usableHeight = boxHeight - NODE_TEXT_PADDING;
  for (let size = max; size >= min; size -= 0.5) {
    const lines = estimateWrappedLines(plain, charsPerLineAt(size, boxWidth));
    if (lines * size * LINE_HEIGHT_RATIO <= usableHeight) return size;
  }
  return min;
}
