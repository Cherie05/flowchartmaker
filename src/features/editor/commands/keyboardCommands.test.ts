import { describe, expect, it } from 'vitest';
import { getKeyboardNudge, getKeyboardViewportPan } from './keyboardCommands';

describe('keyboard movement commands', () => {
  it('uses one consistent nudge distance per arrow keypress', () => {
    expect(getKeyboardNudge('ArrowRight', false)).toEqual({ x: 8, y: 0 });
    expect(getKeyboardNudge('ArrowRight', true)).toEqual({ x: 24, y: 0 });
    expect(getKeyboardNudge('KeyA', false)).toBeNull();
  });

  it('returns viewport movement only for arrow keys', () => {
    expect(getKeyboardViewportPan('ArrowUp')).toEqual({ x: 0, y: -20 });
    expect(getKeyboardViewportPan('Enter')).toBeNull();
  });
});
