import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal accessibility', () => {
  it('uses dialog semantics, supports Escape, and restores focus', async () => {
    const onCancel = vi.fn();
    const trigger = document.createElement('button');
    trigger.textContent = 'Trigger';
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<ConfirmModal isOpen title="Delete diagram?" message="This cannot be undone." onConfirm={vi.fn()} onCancel={onCancel} />);
    expect(screen.getByRole('alertdialog', { name: 'Delete diagram?' })).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
    rerender(<ConfirmModal isOpen={false} title="Delete diagram?" message="This cannot be undone." onConfirm={vi.fn()} onCancel={onCancel} />);
    await waitFor(() => expect(trigger).toHaveFocus());
    trigger.remove();
  });
});
