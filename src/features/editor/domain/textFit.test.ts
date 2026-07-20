import { charsPerLineAt, estimateWrappedLines, fitFontSize, toPlainLabel } from './textFit';

describe('estimateWrappedLines', () => {
  it('counts a short label as one line', () => {
    expect(estimateWrappedLines('Process Refund', 20)).toBe(1);
  });

  it('wraps on word boundaries rather than packing characters', () => {
    // 24 chars would be 2 lines if packed, but the words break to 3.
    expect(estimateWrappedLines('Notify Customer Rejected', 10)).toBe(3);
  });

  it('splits a single word that is longer than the line', () => {
    expect(estimateWrappedLines('Supercalifragilistic', 10)).toBe(2);
  });

  it('returns zero lines for empty text', () => {
    expect(estimateWrappedLines('', 10)).toBe(0);
  });
});

describe('fitFontSize', () => {
  it('keeps a long label within the box height', () => {
    const width = 160;
    const height = 80;
    const text = 'Notify Customer: Refund Processed';
    const size = fitFontSize(text, width, height);

    const lines = estimateWrappedLines(toPlainLabel(text), charsPerLineAt(size, width));
    expect(lines * size * 1.3).toBeLessThanOrEqual(height - 16);
  });

  it('uses the maximum size when the label is short', () => {
    expect(fitFontSize('OK', 160, 80, { max: 18 })).toBe(18);
  });

  it('never returns below the configured minimum', () => {
    expect(fitFontSize('word '.repeat(80), 60, 40, { min: 9 })).toBe(9);
  });
});

describe('toPlainLabel', () => {
  it('strips markup and collapses whitespace', () => {
    expect(toPlainLabel('<b>Check</b>&nbsp;  Eligibility ')).toBe('Check Eligibility');
  });
});
