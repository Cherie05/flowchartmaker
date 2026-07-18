import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Node } from './Node';
import type { FlowChartNode } from '../types/flowChart';

describe('Node', () => {
  const mockNode: FlowChartNode = {
    id: 'node-1',
    type: 'process',
    position: { x: 100, y: 100 },
    text: 'Test Node',
    width: 140,
    height: 80,
    style: {},
  };

  it('renders the node text', () => {
    render(
      <Node
        node={mockNode}
        isSelected={false}
        isConnectorTarget={false}
        showControls={false}
        showConnectionHandles={false}
        isDragging={false}
        zoom={1}
        workspaceTheme="light"
        onSelect={vi.fn()}
        onDrag={vi.fn()}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onResizeStart={vi.fn()}
        onResize={vi.fn()}
        onResizeEnd={vi.fn()}
        onTextChange={vi.fn()}
        onDelete={vi.fn()}
        onConnectStart={vi.fn()}
      />
    );

    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });
});
