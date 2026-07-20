import { StrictMode, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFlowChart } from './useFlowChart';

describe('useFlowChart connection history', () => {
  it('undoes and redoes one node addition as one history entry', () => {
    const { result } = renderHook(() => useFlowChart(), { wrapper: ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode> });

    act(() => result.current.addNode('start', { x: 100, y: 100 }));
    act(() => result.current.addNode('process', { x: 100, y: 240 }));
    expect(result.current.flowChart.nodes).toHaveLength(2);

    act(() => result.current.undo());
    expect(result.current.flowChart.nodes).toHaveLength(1);

    act(() => result.current.redo());
    expect(result.current.flowChart.nodes).toHaveLength(2);
  });

  it('persists animated connection changes through undo and redo', () => {
    const { result } = renderHook(() => useFlowChart());

    act(() => {
      result.current.addNode('start', { x: 100, y: 100 });
      result.current.addNode('end', { x: 100, y: 260 });
    });

    const [startNode, endNode] = result.current.flowChart.nodes;

    act(() => {
      result.current.addConnection(startNode.id, endNode.id);
    });

    const connectionId = result.current.flowChart.connections[0]?.id;
    expect(connectionId).toBeDefined();

    act(() => {
      result.current.updateConnection(connectionId!, { animated: true });
    });

    expect(result.current.flowChart.connections[0]?.animated).toBe(true);

    act(() => {
      result.current.undo();
    });

    expect(result.current.flowChart.connections[0]?.animated).toBeUndefined();

    act(() => {
      result.current.redo();
    });

    expect(result.current.flowChart.connections[0]?.animated).toBe(true);
  });

  it('undoes an accepted generated diagram replacement in one action', () => {
    const { result } = renderHook(() => useFlowChart());
    act(() => result.current.addNode('process', { x: 100, y: 100 }));
    const originalId = result.current.flowChart.nodes[0].id;

    act(() => result.current.replaceFlowChartContent({
      name: 'Generated workflow',
      nodes: [
        { id: 'generated-start', type: 'start', text: 'Start', width: 132, height: 60, position: { x: 200, y: 100 } },
        { id: 'generated-end', type: 'end', text: 'End', width: 132, height: 60, position: { x: 200, y: 300 } },
      ],
      connections: [{ id: 'generated-edge', from: 'generated-start', to: 'generated-end', fromSide: 'bottom', toSide: 'top' }],
    }));
    expect(result.current.flowChart.nodes).toHaveLength(2);

    act(() => result.current.undo());
    expect(result.current.flowChart.nodes).toHaveLength(1);
    expect(result.current.flowChart.nodes[0].id).toBe(originalId);
  });
});
