import { beforeEach, describe, expect, it } from 'vitest';
import { flowchartService } from './flowchartService';

describe('flowchartService local persistence', () => {
  beforeEach(() => window.localStorage.clear());

  it('creates, updates, duplicates, and deletes diagrams without an account', async () => {
    const created = await flowchartService.createFlowchart({ name: 'Local flow', nodes: [], connections: [] });
    expect(created.id).toMatch(/^flowchart-/);

    const updated = await flowchartService.updateFlowchart(created.id, { name: 'Renamed flow' });
    expect(updated.name).toBe('Renamed flow');

    const duplicate = await flowchartService.duplicateFlowchart(created.id);
    expect(duplicate.name).toBe('Renamed flow (Copy)');
    expect(await flowchartService.getAllFlowcharts()).toHaveLength(2);

    await flowchartService.deleteFlowchart(duplicate.id);
    expect((await flowchartService.getAllFlowcharts()).map((item) => item.id)).toEqual([created.id]);
  });

  it('normalizes legacy local records without retaining access-gate fields', async () => {
    window.localStorage.setItem('flowchart-maker.flowcharts', JSON.stringify([{
      id: 'legacy', name: 'Legacy', nodes: [], connections: [], created_at: '2025-01-01', updated_at: '2025-01-02', user_id: 'old-user', is_public: true
    }]));

    const record = await flowchartService.getFlowchartById('legacy');
    expect(record).toEqual({ id: 'legacy', name: 'Legacy', nodes: [], connections: [], created_at: '2025-01-01', updated_at: '2025-01-02' });
  });

  it('reports corrupted browser storage instead of silently discarding it', async () => {
    window.localStorage.setItem('flowchart-maker.flowcharts', '{broken');
    await expect(flowchartService.getAllFlowcharts()).rejects.toThrow(/corrupted/i);
  });
});
