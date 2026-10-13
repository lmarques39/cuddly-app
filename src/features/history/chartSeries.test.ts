import { toggleSlot } from './chartSeries';

describe('toggleSlot (#131)', () => {
  it('gives a new kind the first free colour, and keeps the others where they are', () => {
    const start = ['breastfeeding', null, null];
    const withSleep = toggleSlot(start, 'sono').slots;
    const withDiaper = toggleSlot(withSleep, 'diaper').slots;
    expect(withDiaper).toEqual(['breastfeeding', 'sono', 'diaper']);

    // Switching Sono off leaves Fralda in its own colour slot.
    const noSleep = toggleSlot(withDiaper, 'sono').slots;
    expect(noSleep).toEqual(['breastfeeding', null, 'diaper']);
    expect(toggleSlot(noSleep, 'bottle').slots).toEqual(['breastfeeding', 'bottle', 'diaper']);
  });

  it('refuses a 4th and never empties the chart', () => {
    expect(toggleSlot(['a', 'b', 'c'], 'd')).toEqual({ slots: ['a', 'b', 'c'], full: true });
    expect(toggleSlot(['a', null, null], 'a').slots).toEqual(['a', null, null]);
  });
});
