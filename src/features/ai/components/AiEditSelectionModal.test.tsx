import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiEditSelectionModal } from './AiEditSelectionModal';

const diagram = {
  title: 'Sample',
  nodes: [
    { id: 'a', type: 'start', text: 'Start' },
    { id: 'b', type: 'process', text: 'Old step' },
  ],
  connections: [{ id: 'ab', from: 'a', to: 'b', label: '' }],
};

const fragment = {
  schemaVersion: '1.0' as const,
  title: 'Revised step',
  summary: 'Splits the step in two.',
  assumptions: [],
  nodes: [
    { key: 'x', kind: 'start' as const, label: 'Begin', description: '' },
    { key: 'y', kind: 'end' as const, label: 'Done', description: '' },
  ],
  edges: [{ key: 'e', from: 'x', to: 'y', label: '' }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AiEditSelectionModal', () => {
  it('submits an instruction, previews the result, and accepts it', async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { resolveFetch = resolve; })));
    const onAccept = vi.fn();
    const user = userEvent.setup();
    render(<AiEditSelectionModal isOpen diagram={diagram} selectedNodeIds={['b']} onClose={vi.fn()} onAccept={onAccept} />);

    await user.type(screen.getByLabelText('Instruction'), 'Split into two steps');
    await user.click(screen.getByRole('button', { name: 'Generate Edit' }));
    expect(screen.getByRole('status')).toHaveTextContent('Revising the selected area');

    resolveFetch?.(new Response(JSON.stringify({ requestId: '123e4567-e89b-42d3-a456-426614174000', diagram: fragment }), { status: 200 }));
    expect(await screen.findByText('Revised step')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Apply to Selection' }));
    expect(onAccept).toHaveBeenCalledWith(fragment);
  });

  it('shows a safe error and allows cancellation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'RATE_LIMITED', message: "Today's free AI limit has been reached. You can continue creating diagrams manually." },
    }), { status: 429 })));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<AiEditSelectionModal isOpen diagram={diagram} selectedNodeIds={['b']} onClose={onClose} onAccept={vi.fn()} />);
    await user.type(screen.getByLabelText('Instruction'), 'Split into two steps');
    await user.click(screen.getByRole('button', { name: 'Generate Edit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('free AI limit has been reached');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('disables Generate Edit until an instruction is entered', async () => {
    render(<AiEditSelectionModal isOpen diagram={diagram} selectedNodeIds={['b']} onClose={vi.fn()} onAccept={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Generate Edit' })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generate Edit' })).toBeDisabled());
  });
});
