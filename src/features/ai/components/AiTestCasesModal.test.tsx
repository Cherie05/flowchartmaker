import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiTestCasesModal } from './AiTestCasesModal';

const diagram = {
  title: 'Sample',
  nodes: [{ id: 'n1', type: 'start', text: 'Begin' }],
  connections: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AiTestCasesModal', () => {
  it('generates test cases on open and lists them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      requestId: '123e4567-e89b-42d3-a456-426614174000',
      testCases: [
        {
          title: 'Happy path',
          inputs: ['Valid details'],
          expectedPath: ['Begin', 'End'],
          expectedOutcome: 'Account created',
          riskCovered: 'Successful registration',
        },
      ],
    }), { status: 200 })));

    render(<AiTestCasesModal isOpen diagram={diagram} onClose={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Generating test cases');
    expect(await screen.findByText('Happy path')).toBeVisible();
    expect(screen.getByText('Begin → End')).toBeVisible();
    expect(screen.getByText('Account created')).toBeVisible();
  });

  it('shows a safe error when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'AI_NOT_CONFIGURED', message: 'AI generation is not configured on this server.' },
    }), { status: 503 })));

    render(<AiTestCasesModal isOpen diagram={diagram} onClose={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('AI generation is not configured');
  });
});
