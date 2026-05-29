'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from '@beeads/ui';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  agentEmail: string;
  personEmail: string;
};

export function GoogleShareInstructionsModal({ open, onOpenChange, agentEmail, personEmail }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Como compartilhar o calendar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>
            Pra o agente conseguir ver os horários livres de <strong>{personEmail}</strong>, essa
            pessoa precisa compartilhar o calendar dela com o email do agente:
          </p>

          <div className="rounded bg-card border border-border p-3 font-mono text-sm break-all">
            {agentEmail}
          </div>

          <ol className="list-decimal pl-5 space-y-2 text-fg">
            <li>{personEmail} abre o <strong>Google Calendar</strong> dela.</li>
            <li>Clica nos 3 pontinhos do calendar &quot;Meus calendários&quot; → <strong>Configurações</strong>.</li>
            <li>Vai em <strong>Compartilhar com pessoas específicas</strong> → <strong>Adicionar pessoas</strong>.</li>
            <li>
              Cola o email do agente: <code className="font-mono bg-card px-1 rounded">{agentEmail}</code>
            </li>
            <li>
              Permissão: <strong>Fazer alterações em eventos</strong>
              <span className="text-muted-fg"> (precisa ser esta — &quot;Ver detalhes de eventos&quot; não é suficiente pra criar reuniões).</span>
            </li>
            <li><strong>Enviar</strong>. O agente recebe um convite por email e aceita automático.</li>
          </ol>

          <p className="text-xs text-muted-fg">
            Após {personEmail} compartilhar, clica de novo em &quot;Testar acesso&quot; aqui pra
            confirmar que tudo está OK.
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>Entendi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
