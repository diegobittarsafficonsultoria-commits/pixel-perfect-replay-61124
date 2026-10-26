import { useNavigate } from "@tanstack/react-router";
import { Copy, FileDown, FilePlus2, Save, CopyPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProposalDocument } from "./ProposalDocument";
import { exportPdf, proposalText } from "@/lib/pdf";
import { getSettings, newId, setPending, upsertProposal, type Proposal } from "@/lib/store";

export function ProposalView({ proposal, setProposal, saved, onSaved }: { proposal: Proposal; setProposal: (p: Proposal) => void; saved?: boolean; onSaved?: () => void }) {
  const navigate = useNavigate();
  const settings = getSettings();

  const save = () => {
    upsertProposal(proposal);
    setPending(null);
    toast.success("Proposta salva");
    onSaved?.();
  };
  const copy = async () => {
    await navigator.clipboard.writeText(proposalText(proposal, settings));
    toast.success("Texto copiado");
  };
  const pdf = async () => {
    try { await exportPdf(proposal, settings); } catch { toast.error("Não foi possível gerar o PDF"); }
  };
  const duplicate = () => {
    const copyP: Proposal = { ...structuredClone(proposal), id: newId(), createdAt: new Date().toISOString(), status: "Rascunho" };
    upsertProposal(copyP);
    toast.success("Proposta duplicada");
    navigate({ to: "/propostas/$id", params: { id: copyP.id } });
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap gap-2 bg-background/95 px-4 py-3 backdrop-blur">
        <Button onClick={save} variant="cream"><Save /> Salvar</Button>
        <Button onClick={copy} variant="ghostCream"><Copy /> Copiar texto</Button>
        <Button onClick={pdf} variant="ghostCream"><FileDown /> Exportar PDF</Button>
        {saved && <Button onClick={duplicate} variant="ghostCream"><CopyPlus /> Duplicar</Button>}
        <Button onClick={() => { setPending(null); navigate({ to: "/", search: { nova: Date.now() } }); }} variant="ghostCream"><FilePlus2 /> Nova proposta</Button>
      </div>
      <p className="text-xs text-cream-muted">Clique em qualquer texto da proposta para editar.</p>
      <ProposalDocument proposal={proposal} settings={settings} onChange={(content) => setProposal({ ...proposal, content })} />
    </div>
  );
}
