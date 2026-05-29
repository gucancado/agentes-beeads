'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@beeads/ui';
import { AgendaForm } from './agenda-form';
import type { SchedulingAgenda } from '@/lib/worker-admin-client';

export function AgendaFormModal({
  agent,
  slug,
  mode,
  agenda,
  googleConnected,
  open,
  onOpenChange,
}: {
  agent: string;
  slug: string;
  mode: 'create' | 'edit';
  agenda?: SchedulingAgenda;
  googleConnected: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nova agenda' : 'Editar agenda'}</DialogTitle>
        </DialogHeader>
        <AgendaForm
          agent={agent}
          slug={slug}
          mode={mode}
          agenda={agenda}
          googleConnected={googleConnected}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
