'use client';

import { useEffect, useRef } from 'react';

/**
 * Wrapper que rola pra última mensagem no mount. Recebe os bubbles renderizados
 * server-side e só anexa o comportamento de scroll — não duplica lógica.
 * `dataKey` (ex: identifier da conversa) força reset de scroll ao trocar de thread.
 */
export function ThreadScrollContainer({
  children,
  dataKey,
}: {
  children: React.ReactNode;
  dataKey: string;
}) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // scrollTop = scrollHeight rola pro final imediatamente. Sem animação pra
    // entrar já no fim sem flash, igual WhatsApp Web.
    el.scrollTop = el.scrollHeight;
  }, [dataKey]);

  return (
    <ol
      ref={ref}
      className="flex-1 min-h-0 overflow-y-auto px-5 py-6 space-y-4 bg-bg/40"
    >
      {children}
    </ol>
  );
}
