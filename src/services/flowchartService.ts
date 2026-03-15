import { createId } from '../lib/createId';
import type { FlowChartDraft, FlowChartRecord, FlowChartUpdateInput } from '../types/flowChart';

const FLOWCHARTS_STORAGE_KEY = 'flowchart-maker.flowcharts';
const LOCAL_USER_ID = 'local-user';

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
      user_id: LOCAL_USER_ID,
      name: flowchart.name?.trim() || 'Untitled Flowchart',
      description: null,
      nodes: flowchart.nodes ?? [],
      connections: flowchart.connections ?? [],
      created_at: now,
      updated_at: now,
      is_public: false
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
      ...(updates.is_public !== undefined ? { is_public: updates.is_public } : {}),
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
    return Array.isArray(parsedValue) ? parsedValue.filter(isFlowChartRecord) : [];
  } catch {
    return [];
  }
}

function writeFlowcharts(flowcharts: FlowChartRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(FLOWCHARTS_STORAGE_KEY, JSON.stringify(flowcharts));
}

function isFlowChartRecord(value: unknown): value is FlowChartRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<FlowChartRecord>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.user_id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.created_at === 'string' &&
    typeof candidate.updated_at === 'string' &&
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.connections) &&
    typeof candidate.is_public === 'boolean'
  );
}
