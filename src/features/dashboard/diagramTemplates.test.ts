import { describe, expect, it } from 'vitest';
import { getStarterDiagramDraft, starterTemplates } from './diagramTemplates';

describe('local starter diagrams', () => {
  it('provides the four expected deterministic starter options', () => {
    expect(starterTemplates.map((template) => template.id)).toEqual(['blank', 'registration', 'approval', 'support']);
  });

  it('returns independent copies with connections that reference existing nodes', () => {
    const first = getStarterDiagramDraft('approval');
    const second = getStarterDiagramDraft('approval');
    const firstNodes = first.nodes ?? [];
    const secondNodes = second.nodes ?? [];
    const nodeIds = new Set(firstNodes.map((node) => node.id));

    expect((first.connections ?? []).every((connection) => nodeIds.has(connection.from) && nodeIds.has(connection.to))).toBe(true);
    expect(firstNodes).not.toBe(secondNodes);
    expect(firstNodes[0]?.position).not.toBe(secondNodes[0]?.position);
  });
});
