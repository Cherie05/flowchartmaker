import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiFlowchartModal } from './AiFlowchartModal';
import { resetAiAvailabilityCacheForTests } from '../services/aiFlowchartClient';

const diagram = {
  schemaVersion: '1.0' as const,
  title: 'Registration workflow',
  summary: 'Registers a user.',
  assumptions: [],
  nodes: [
    { key: 'start', kind: 'start' as const, label: 'Start', description: '' },
    { key: 'input', kind: 'inputOutput' as const, label: 'Enter details', description: '' },
    { key: 'end', kind: 'end' as const, label: 'Complete', description: '' },
  ],
  edges: [
    { key: 'a', from: 'start', to: 'input', label: '' },
    { key: 'b', from: 'input', to: 'end', label: '' },
  ],
};

afterEach(() => {
  resetAiAvailabilityCacheForTests();
  vi.unstubAllGlobals();
});

describe('AiFlowchartModal', () => {
  it('uses an example prompt, shows loading, previews, and accepts a diagram', async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      if (String(input) === '/api/health') return Promise.resolve(configuredHealthResponse());
      return new Promise<Response>((resolve) => { resolveFetch = resolve; });
    }));
    const onAccept = vi.fn();
    const user = userEvent.setup();
    render(<AiFlowchartModal isOpen hasExistingContent={false} onClose={vi.fn()} onAccept={onAccept} />);

    await user.click(screen.getByRole('button', { name: /Example 3/i }));
    expect((screen.getByLabelText('Process description') as HTMLTextAreaElement).value).toContain('registration');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(screen.getByRole('status')).toHaveTextContent('Understanding your workflow');
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();

    resolveFetch?.(new Response(JSON.stringify({ requestId: '123e4567-e89b-42d3-a456-426614174000', diagram }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    expect(await screen.findByText('Registration workflow')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Use This Flowchart' }));
    expect(onAccept).toHaveBeenCalledWith(diagram, 'replace');
  });

  it('preserves the generated result until add or confirmed replace is selected', async () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => Promise.resolve(
      String(input) === '/api/health'
        ? configuredHealthResponse()
        : new Response(JSON.stringify({ requestId: '123e4567-e89b-42d3-a456-426614174000', diagram }), { status: 200 }),
    )));
    const onAccept = vi.fn();
    const user = userEvent.setup();
    render(<AiFlowchartModal isOpen hasExistingContent onClose={vi.fn()} onAccept={onAccept} />);
    await user.type(screen.getByLabelText('Process description'), 'Create registration');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Generate' }));
    await user.click(await screen.findByRole('button', { name: 'Use This Flowchart' }));
    expect(screen.getByText('How should this generated flowchart be added?')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Replace current diagram/i }));
    expect(onAccept).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirm replacement' }));
    expect(onAccept).toHaveBeenCalledWith(diagram, 'replace');
  });

  it('shows a safe server error and cancellation remains available', async () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => Promise.resolve(
      String(input) === '/api/health'
        ? configuredHealthResponse()
        : new Response(JSON.stringify({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI generation is not configured on this server.' } }), { status: 503 }),
    )));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<AiFlowchartModal isOpen hasExistingContent={false} onClose={onClose} onAccept={vi.fn()} />);
    await user.type(screen.getByLabelText('Process description'), 'Create a process');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('AI generation is not configured');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows the development setup message and disables generation when AI is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      ai: { configured: false },
    }), { status: 200 })));
    const user = userEvent.setup();
    render(<AiFlowchartModal isOpen hasExistingContent={false} onClose={vi.fn()} onAccept={vi.fn()} />);
    await user.type(screen.getByLabelText('Process description'), 'Create a process');
    expect(await screen.findByText(/Add GEMINI_API_KEY to the root \.env file/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();
  });
});

function configuredHealthResponse(): Response {
  return new Response(JSON.stringify({
    status: 'ok',
    ai: { configured: true, provider: 'gemini', model: 'gemini-3.1-flash-lite' },
  }), { status: 200 });
}
