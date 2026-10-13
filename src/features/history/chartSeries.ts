/**
 * Series colours for the Tendências calendar (#131) — chart-only, not the
 * tracker pastels: Amamentação's and Sono's pastels are nearly the same
 * lilac, fine as screen identities but unreadable side by side in a chart.
 *
 * Three slots, because three is what holds up: checked with the data-viz
 * palette validator (all pairs, both themes, against the card surface) —
 * worst colour-blind ΔE 9.2 light / 9.4 dark, normal vision 24.0 / 20.9.
 * A 4th hue fails the normal-vision floor (blue vs violet, yellow vs
 * orange), so at most three trackers share the calendar at once. The
 * green is under 3:1 on white; the legend, the tap-for-details label and
 * each mark's ink outline carry it.
 */
export const SERIES_COLORS = {
  light: ['#2a78d6', '#eb6834', '#1baf7a'],
  dark: ['#3987e5', '#d95926', '#199e70'],
} as const;

export const MAX_SERIES = SERIES_COLORS.light.length;

/** Which kind sits in which colour slot; null = free. */
export type Slots<K extends string> = (K | null)[];

/**
 * Turns a kind on or off. A kind keeps its slot (so its colour) for as long
 * as it stays on — switching another one off never repaints it. Turning on
 * a 4th does nothing (`full: true`), and the last one can't be turned off.
 */
export function toggleSlot<K extends string>(slots: Slots<K>, kind: K): { slots: Slots<K>; full: boolean } {
  const index = slots.indexOf(kind);
  if (index >= 0) {
    if (slots.filter(Boolean).length === 1) return { slots, full: false };
    return { slots: slots.map((s, i) => (i === index ? null : s)), full: false };
  }
  const free = slots.indexOf(null);
  if (free < 0) return { slots, full: true };
  return { slots: slots.map((s, i) => (i === free ? kind : s)), full: false };
}
