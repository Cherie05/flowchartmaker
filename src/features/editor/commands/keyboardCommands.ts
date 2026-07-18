import type { Position } from '../../../types/flowChart';

const NUDGE_STEP = 8;
const GRID_NUDGE_STEP = 24;
const VIEWPORT_PAN_STEP = 20;

export function getKeyboardNudge(key: string, shiftKey: boolean): Position | null {
  const step = shiftKey ? GRID_NUDGE_STEP : NUDGE_STEP;

  switch (key) {
    case 'ArrowUp':
      return { x: 0, y: -step };
    case 'ArrowRight':
      return { x: step, y: 0 };
    case 'ArrowDown':
      return { x: 0, y: step };
    case 'ArrowLeft':
      return { x: -step, y: 0 };
    default:
      return null;
  }
}

export function getKeyboardViewportPan(key: string): Position | null {
  switch (key) {
    case 'ArrowUp':
      return { x: 0, y: -VIEWPORT_PAN_STEP };
    case 'ArrowRight':
      return { x: VIEWPORT_PAN_STEP, y: 0 };
    case 'ArrowDown':
      return { x: 0, y: VIEWPORT_PAN_STEP };
    case 'ArrowLeft':
      return { x: -VIEWPORT_PAN_STEP, y: 0 };
    default:
      return null;
  }
}
