import { describe, expect, it } from 'vitest';
import { DIAGRAM_IMPORT_LIMITS, isApprovedColor, safeSvgColor, validateImportedDiagram } from './diagramValidation';

const validDiagram = {
  name: 'Example',
  nodes: [
    { id: 'start', type: 'start', position: { x: 100, y: 100 }, text: 'Start', width: 132, height: 60 },
    { id: 'end', type: 'end', position: { x: 320, y: 100 }, text: 'End', width: 132, height: 60 }
  ],
  connections: [{ id: 'start-end', from: 'start', to: 'end', fromSide: 'right', toSide: 'left', color: '#64748b' }]
};

describe('validateImportedDiagram', () => {
  it('accepts a bounded diagram with valid endpoints', () => {
    expect(() => validateImportedDiagram(validDiagram)).not.toThrow();
  });

  it('rejects duplicate ids, invalid endpoints, and oversized text', () => {
    expect(() => validateImportedDiagram({ ...validDiagram, nodes: [{ ...validDiagram.nodes[0] }, { ...validDiagram.nodes[1], id: 'start' }] })).toThrow('duplicate id');
    expect(() => validateImportedDiagram({ ...validDiagram, connections: [{ ...validDiagram.connections[0], to: 'missing' }] })).toThrow('existing node ids');
    expect(() => validateImportedDiagram({ ...validDiagram, nodes: [{ ...validDiagram.nodes[0], text: 'x'.repeat(DIAGRAM_IMPORT_LIMITS.maxTextLength + 1) }] })).toThrow('no longer than');
  });
});

describe('SVG colour validation', () => {
  it('allows only the approved colour grammar and falls back safely', () => {
    expect(isApprovedColor('#AbC123')).toBe(true);
    expect(isApprovedColor('rgba(10, 20, 30, 0.5)')).toBe(true);
    expect(isApprovedColor('url(javascript:alert(1))')).toBe(false);
    expect(safeSvgColor('url(javascript:alert(1))', '#000000')).toBe('#000000');
  });
});
