import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiReviewModal } from './AiReviewModal';

const diagram = {
  title: 'Sample',
  nodes: [{ id: 'n1', type: 'start', text: 'Begin' }],
  connections: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AiReviewModal', () => {
  it('runs a review on open and shows the summary and findings', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      requestId: '123e4567-e89b-42d3-a456-426614174000',
      review: {
        summary: 'Overall solid.',
        findings: [
          { severity: 'high', category: 'missing-branch', message: 'No rejection path.', recommendation: 'Add one.', nodeIds: [], connectionIds: [] },
        ],
      },
    }), { status: 200 })));

    render(<AiReviewModal isOpen diagram={diagram} onClose={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Reviewing the diagram');
    expect(await screen.findByText('Overall solid.')).toBeVisible();
    expect(screen.getByText('No rejection path.')).toBeVisible();
    expect(screen.getByText('Add one.')).toBeVisible();
  });

  it('shows a safe error when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'AI_NOT_CONFIGURED', message: 'AI generation is not configured on this server.' },
    }), { status: 503 })));

    render(<AiReviewModal isOpen diagram={diagram} onClose={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('AI generation is not configured');
  });

  it('does nothing when closed', () => {
    const { container } = render(<AiReviewModal isOpen={false} diagram={diagram} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
