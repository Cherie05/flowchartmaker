import { describe, expect, it } from 'vitest';
import { getNodeDefaults } from './nodeDefaults';

describe('getNodeDefaults', () => {
  it('returns the shared visible defaults for start and process nodes', () => {
    expect(getNodeDefaults('start')).toMatchObject({
      text: 'Start',
      width: 132,
      height: 60
    });
    expect(getNodeDefaults('process')).toMatchObject({
      text: 'Process Step',
      width: 140,
      height: 80
    });
  });
});
