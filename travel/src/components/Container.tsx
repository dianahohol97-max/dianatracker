import type { ElementType, ReactNode } from 'react';

/** Centered max-width wrapper used across every section. */
export function Container({
  as: Tag = 'div',
  className = '',
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`mx-auto w-full max-w-[var(--spacing-container)] px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </Tag>
  );
}
