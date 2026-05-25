import type { ReactNode } from 'react';

export function SectionCard({
  title,
  titleAccent,
  action,
  meta,
  children,
}: {
  title: string;
  titleAccent?: string;
  action?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card text-card-fg shadow-[0_1px_0_rgba(10,10,10,0.04),0_4px_14px_rgba(10,10,10,0.04)]">
      <header className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-3.5">
        <h3 className="font-display text-[17px] font-medium tracking-tight text-card-fg">
          {title}
          {titleAccent && <em className="italic text-honey-deep ml-1.5">{titleAccent}</em>}
        </h3>
        {action ?? (meta && <span className="text-[10px] uppercase tracking-[0.2em] text-muted-fg">{meta}</span>)}
      </header>
      {children}
    </section>
  );
}
