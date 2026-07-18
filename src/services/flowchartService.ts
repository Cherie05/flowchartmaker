import { createId } from '../lib/createId';
import type { FlowChartDraft, FlowChartRecord, FlowChartUpdateInput } from '../types/flowChart';

const FLOWCHARTS_STORAGE_KEY = 'flowchart-maker.flowcharts';

export const flowchartService = {
  async getAllFlowcharts(): Promise<FlowChartRecord[]> {
    return readFlowcharts().sort(
      (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
    );
  },

  async getFlowchartById(id: string): Promise<FlowChartRecord | null> {
    return readFlowcharts().find((flowchart) => flowchart.id === id) ?? null;
  },

  async createFlowchart(flowchart: FlowChartDraft): Promise<FlowChartRecord> {
    const now = new Date().toISOString();
    const newFlowchart: FlowChartRecord = {
      id: createId('flowchart'),
      name: flowchart.name?.trim() || 'Untitled Flowchart',
      nodes: flowchart.nodes ?? [],
      connections: flowchart.connections ?? [],
      created_at: now,
      updated_at: now
    };

    const flowcharts = readFlowcharts();
    flowcharts.unshift(newFlowchart);
    writeFlowcharts(flowcharts);
    
    return newFlowchart;
  },

  async updateFlowchart(id: string, updates: FlowChartUpdateInput): Promise<FlowChartRecord> {
    const flowcharts = readFlowcharts();
    const index = flowcharts.findIndex((flowchart) => flowchart.id === id);

    if (index === -1) {
      throw new Error('Flowchart not found');
    }

    const current = flowcharts[index];
    const updatedFlowchart: FlowChartRecord = {
      ...current,
      ...(updates.name !== undefined ? { name: updates.name.trim() || 'Untitled Flowchart' } : {}),
      ...(updates.nodes !== undefined ? { nodes: updates.nodes } : {}),
      ...(updates.connections !== undefined ? { connections: updates.connections } : {}),
      updated_at: new Date().toISOString()
    };

    flowcharts[index] = updatedFlowchart;
    writeFlowcharts(flowcharts);
    return updatedFlowchart;
  },

  async deleteFlowchart(id: string): Promise<void> {
    const flowcharts = readFlowcharts();
    writeFlowcharts(flowcharts.filter((flowchart) => flowchart.id !== id));
  },

  async duplicateFlowchart(id: string): Promise<FlowChartRecord> {
    const original = await this.getFlowchartById(id);

    if (!original) {
      throw new Error('Flowchart not found');
    }

    const now = new Date().toISOString();
    const duplicatedFlowchart: FlowChartRecord = {
      ...original,
      id: createId('flowchart'),
      name: `${original.name} (Copy)`,
      created_at: now,
      updated_at: now
    };

    const flowcharts = readFlowcharts();
    flowcharts.unshift(duplicatedFlowchart);
    writeFlowcharts(flowcharts);
    return duplicatedFlowchart;
  }
};

function readFlowcharts(): FlowChartRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawValue = window.localStorage.getItem(FLOWCHARTS_STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsedValue)
      ? parsedValue.flatMap((value) => {
          const flowchart = normalizeFlowChartRecord(value);
          return flowchart ? [flowchart] : [];
        })
      : [];
  } catch {
    throw new Error('Saved diagram data in this browser is corrupted. Export any recoverable data before clearing storage.');
  }
}

function writeFlowcharts(flowcharts: FlowChartRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(FLOWCHARTS_STORAGE_KEY, JSON.stringify(flowcharts));
  } catch {
    throw new Error('Browser storage is unavailable or full. Export a backup and free storage space before continuing.');
  }
}

function normalizeFlowChartRecord(value: unknown): FlowChartRecord | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<FlowChartRecord>;
  const isValid =
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.created_at === 'string' &&
    typeof candidate.updated_at === 'string' &&
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.connections);

  if (!isValid) {
    return null;
  }

  return {
    id: candidate.id as string,
    name: candidate.name as string,
    nodes: candidate.nodes as FlowChartRecord['nodes'],
    connections: candidate.connections as FlowChartRecord['connections'],
    created_at: candidate.created_at as string,
    updated_at: candidate.updated_at as string
  };
}
