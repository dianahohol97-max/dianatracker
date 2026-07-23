/**
 * Reserved ad placeholder (spec §5/§7 — the ad network comes later). It always
 * reserves a fixed height so inserting a real ad later causes zero layout shift
 * (CLS budget < 0.05). Renders nothing visible in production until a network is
 * configured; in development it shows a labelled box.
 */
export function AdSlot({
  slot,
  minHeight = 280,
}: {
  slot: string;
  minHeight?: number;
}) {
  const isDev = process.env.NODE_ENV !== 'production';
  return (
    <div
      data-ad-slot={slot}
      aria-hidden
      style={{ minHeight }}
      className="my-8 flex w-full items-center justify-center rounded-lg border border-dashed border-line text-xs text-ink-soft"
    >
      {isDev ? `ad slot: ${slot}` : null}
    </div>
  );
}
