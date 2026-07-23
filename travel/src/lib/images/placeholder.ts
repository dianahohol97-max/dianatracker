/**
 * Deterministic inline SVG placeholder (data URI). Used as the fallback when a
 * content image is missing or a provider lookup fails, so layout never shifts
 * (spec §3, §9 — no CLS from images). No network, no external asset.
 */
export function placeholderDataUri(label = 'Tripify'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <rect width="1200" height="675" fill="#ccfbf1"/>
  <rect width="1200" height="675" fill="url(#g)" opacity="0.5"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#99f6e4"/>
      <stop offset="1" stop-color="#5eead4"/>
    </linearGradient>
  </defs>
  <text x="600" y="345" font-family="system-ui, sans-serif" font-size="48" font-weight="700"
    fill="#0f766e" text-anchor="middle">${escapeXml(label)}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
