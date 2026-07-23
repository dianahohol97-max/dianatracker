import type { ReactNode } from 'react';

type CalloutType = 'tip' | 'warning' | 'note';

const styles: Record<CalloutType, { box: string; label: string; icon: string }> = {
  tip: { box: 'border-brand bg-brand-soft/40', label: 'text-brand-dark', icon: '💡' },
  warning: { box: 'border-amber-400 bg-amber-50', label: 'text-amber-700', icon: '⚠️' },
  note: { box: 'border-line bg-paper-muted', label: 'text-ink-soft', icon: 'ℹ️' },
};

/** Inline MDX callout: `<Callout type="tip">…</Callout>`. */
export function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const s = styles[type];
  return (
    <aside className={`my-6 rounded-lg border-l-4 p-4 ${s.box}`} role="note">
      <p className={`flex items-center gap-2 text-sm font-semibold ${s.label}`}>
        <span aria-hidden>{s.icon}</span>
        {title ?? type.charAt(0).toUpperCase() + type.slice(1)}
      </p>
      <div className="mt-1 text-sm text-ink [&>p]:mt-1">{children}</div>
    </aside>
  );
}
