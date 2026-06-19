'use client';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { TurnRow } from '@/lib/memory-shape';

export function TranscriptView({ turns }: { turns: TurnRow[] }) {
  const sp = useSearchParams();
  const raw = sp.get('turn') ?? '';
  const parts = raw.split('-').map(Number);
  const [from, to] =
    parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])
      ? parts
      : [-1, -1];
  const firstRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    firstRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <div className="space-y-1.5 p-4">
      {turns.map((t) => {
        const hot = t.turn_index >= from && t.turn_index <= to;
        return (
          <div
            key={t.turn_index}
            ref={hot && t.turn_index === from ? firstRef : undefined}
            className={`rounded px-2 py-1 ${hot ? 'bg-honey/15' : ''}`}
          >
            <span className="text-xs font-medium text-muted-fg mr-2">
              {t.speaker_name ?? t.speaker_label ?? '—'}
            </span>
            <span className="text-sm">{t.text}</span>
          </div>
        );
      })}
    </div>
  );
}
