/**
 * One place for the popover's surface values.
 *
 * The panel is a single elevated surface. Every section inside it is
 * separated by a hairline rather than given its own card: the old nesting
 * (card inside card inside paper) is what made boxes appear to stack behind
 * the menu.
 */
export const t = {
  surface: '#ffffff',
  border: '#dfe6e8',
  hairline: '#eef2f3',
  rowHover: '#f6f9f9',
  text: '#1f2a30',
  textMuted: '#64757e',
  accent: '#00897b',
  accentSoft: '#e6f2f0',
  danger: '#c62828',
  dangerSoft: '#fdecea',
  radius: '12px',
  // Offset and blur, not a zero-offset halo.
  shadow: '0 10px 28px rgba(16, 24, 32, 0.16), 0 2px 6px rgba(16, 24, 32, 0.08)',
  font: '13px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif',
  fontMeta: '11px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif',
} as const
