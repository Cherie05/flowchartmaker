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
    style: {},
  };

  it('renders the node text', () => {
    render(
      <svg>
        <Node
          node={mockNode}
          selected={false}
          onSelect={vi.fn()}
          onDrag={vi.fn()}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
          onTextChange={vi.fn()}
          isLocked={false}
          onConnectStart={vi.fn()}
        />
      </svg>
    );

    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });
});
