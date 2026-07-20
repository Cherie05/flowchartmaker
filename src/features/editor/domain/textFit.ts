import type { FlowChartNodeType } from '../../../types/flowChart';

// Shared text-fitting estimates so node sizing (when a diagram is generated)
// and font sizing (when a node is rendered) agree on how much room a label
// needs. Both must model word wrapping: CSS breaks on word boundaries, so a
// raw character count underestimates the number of lines and lets text spill
// out of the shape.
//
// Text is always centered in the node's full width x height bounding box
// (Node.tsx never repositions it per shape), but most shapes are NOT full
// rectangles -- a diamond, circle, or hexagon only safely contains a smaller
// inscribed rectangle. Sizing text (or a box) against the raw bounding box
// therefore overflows visually even when it fits the DOM rectangle. These
// ratios are the exact (or, for irregular polygons, closely reasoned)
// largest axis-aligned rectangle that fits centered inside each shape.

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

// A circle/ellipse's largest inscribed axis-aligned rectangle is exactly
// width/sqrt(2) x height/sqrt(2), regardless of aspect ratio.
const INV_SQRT2 = 0.70710678;
// Node.tsx insets the decision surface 12% per side before rotating it 45deg
// into a diamond. Deriving the resulting diamond's inscribed rectangle:
//   preRotate = 0.76 * size (12% off each side)
//   diamondSpan (both axes, symmetric at 45deg) = (preRotateW + preRotateH) / sqrt(2)
//   inscribed rect side (half the diamond span, both axes) = diamondSpan / 2
// which collapses to this single constant applied to (width + height).
const DECISION_INSCRIBED_FACTOR = 0.76 / (2 * Math.SQRT2);

/**
 * The largest axis-aligned rectangle centered in the node that stays fully
 * inside its rendered shape. Equals the node's own box for shapes that are
 * already (near enough) rectangular.
 */
export function getInscribedTextBox(type: FlowChartNodeType, width: number, height: number): { width: number; height: number } {
  switch (type) {
    case 'start':
    case 'end':
    case 'connector':
      return { width: width * INV_SQRT2, height: height * INV_SQRT2 };
    case 'decision': {
      const side = (width + height) * DECISION_INSCRIBED_FACTOR;
      return { width: side, height: side };
    }
    case 'input':
      // 10% horizontal slant on each side; a rectangle spanning the full
      // height only stays inside the overlap of both slanted edges.
      return { width: width * 0.8, height };
    case 'manualOperation':
      // Trapezoid: 80% width at the top edge widening to 100% at the bottom.
      return { width: width * 0.85, height };
    case 'manualInput':
      // Diagonal notch cuts the top-left corner over the top ~16% of height.
      return { width, height: height * 0.84 };
    case 'hexagon':
      // Flat top/bottom edges span 72% of the width; only widens toward the
      // vertical center, so 72% is safe for the full height.
      return { width: width * 0.72, height };
    case 'triangle':
      // Apex-up triangle: the largest inscribed rectangle is exactly half the
      // base and half the height (it sits on the base, not centered, but this
      // stays a safe upper bound for centered text).
      return { width: width / 2, height: height / 2 };
    default:
      return { width, height };
  }
}

/**
 * Inverse of getInscribedTextBox: the smallest node box (>= the given
 * minimums) whose inscribed rectangle is at least innerWidth x innerHeight.
 */
export function growNodeForInnerBox(
  type: FlowChartNodeType,
  innerWidth: number,
  innerHeight: number,
  minWidth: number,
  minHeight: number,
): { width: number; height: number } {
  switch (type) {
    case 'start':
    case 'end':
    case 'connector':
      return {
        width: Math.max(minWidth, innerWidth / INV_SQRT2),
        height: Math.max(minHeight, innerHeight / INV_SQRT2),
      };
    case 'decision': {
      const neededSide = Math.max(innerWidth, innerHeight);
      const neededSum = neededSide / DECISION_INSCRIBED_FACTOR;
      const scale = Math.max(1, neededSum / (minWidth + minHeight));
      return { width: minWidth * scale, height: minHeight * scale };
    }
    case 'input':
      return { width: Math.max(minWidth, innerWidth / 0.8), height: Math.max(minHeight, innerHeight) };
    case 'manualOperation':
      return { width: Math.max(minWidth, innerWidth / 0.85), height: Math.max(minHeight, innerHeight) };
    case 'manualInput':
      return { width: Math.max(minWidth, innerWidth), height: Math.max(minHeight, innerHeight / 0.84) };
    case 'hexagon':
      return { width: Math.max(minWidth, innerWidth / 0.72), height: Math.max(minHeight, innerHeight) };
    case 'triangle':
      return { width: Math.max(minWidth, innerWidth * 2), height: Math.max(minHeight, innerHeight * 2) };
    default:
      return { width: Math.max(minWidth, innerWidth), height: Math.max(minHeight, innerHeight) };
  }
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
