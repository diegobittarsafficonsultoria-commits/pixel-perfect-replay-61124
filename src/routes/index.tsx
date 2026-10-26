import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProposalView } from "@/components/ProposalView";
import { generateProposal } from "@/lib/proposal.functions";
import { getPending, getSettings, newId, setPending, type Proposal, type ProposalInput } from "@/lib/store";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { nova?: number } => (s["nova"] ? { nova: Number(s["nova"]) } : {}),
  head: () => ({
    meta: [
      { title: "Nova proposta — Proposta Rápida" },
      { name: "description", content: "Preencha os dados do cliente e gere uma proposta comercial profissional com IA." },
      { property: "og:title", content: "Proposta Rápida — propostas comerciais com IA" },
      { property: "og:description", content: "Preencha os dados do cliente e gere uma proposta comercial profissional com IA." },
    ],
  }),
  component: Page,
});

const empty: ProposalInput = { cliente: "", setor: "", contato: "", necessidade: "", objetivos: "", escopo: "", prazo: "", valor: "", pagamento: "", validade: "15", observacoes: "" };

type F = { k: keyof ProposalInput; label: string; big?: boolean; full?: boolean; type?: string; ph?: string };
const fields: F[] = [
  { k: "cliente", label: "Nome do cliente" },
  { k: "setor", label: "Setor do cliente" },
  { k: "contato", label: "Nome do contato" },
  { k: "prazo", label: "Prazo do projeto", ph: "Ex.: 8 semanas" },
  { k: "necessidade", label: "Necessidade ou problema do cliente", big: true, full: true },
  { k: "objetivos", label: "Objetivos esperados", big: true, full: true },
  { k: "escopo", label: "Escopo e entregas", big: true, full: true },
  { k: "valor", label: "Valor do investimento", ph: "Ex.: R$ 18.000,00" },
  { k: "pagamento", label: "Forma de pagamento", ph: "Ex.: 50% na assinatura, 50% na entrega" },
  { k: "validade", label: "Validade da proposta (dias)", type: "number" },
  { k: "observacoes", label: "Observações", big: true, full: true },
];

function Page() {
  const { nova } = Route.useSearch();
  const gen = useServerFn(generateProposal);
  const [input, setInput] = useState<ProposalInput>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    if (nova) { setProposal(null); setInput(empty); setError(null); return; }
    const p = getPending();
    if (p) setProposal(p);
  }, [nova]);

  const update = (p: Proposal) => { setProposal(p); setPending(p); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!input.cliente.trim()) { setError("Informe o nome do cliente."); return; }
    setLoading(true);
    try {
      const r = await gen({ data: { input, empresa: getSettings().empresa } });
      if (!r.ok) { setError(r.error); return; }
      update({ id: newId(), createdAt: new Date().toISOString(), status: "Rascunho", input, content: r.content });
      window.scrollTo({ top: 0 });
    } catch {
      setError("Não foi possível conectar ao serviço de IA. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (proposal) return <ProposalView proposal={proposal} setProposal={update} />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold sm:text-4xl">Nova proposta</h1>
      <p className="mt-2 text-cream-muted">Preencha os dados do cliente. A IA redige a proposta e você revisa antes de salvar.</p>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-lg bg-card p-5 text-card-foreground sm:grid-cols-2 sm:p-8">
        {fields.map((f) => (
          <div key={f.k} className={`space-y-1.5 ${f.full ? "sm:col-span-2" : ""}`}>
            <Label htmlFor={f.k}>{f.label}</Label>
            {f.big ? (
              <Textarea id={f.k} rows={f.k === "necessidade" ? 5 : 3} value={input[f.k]} onChange={(e) => setInput({ ...input, [f.k]: e.target.value })} />
            ) : (
              <Input id={f.k} type={f.type ?? "text"} min={f.type === "number" ? 1 : undefined} placeholder={f.ph} value={input[f.k]} onChange={(e) => setInput({ ...input, [f.k]: e.target.value })} />
            )}
          </div>
        ))}
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
            {loading ? <><Loader2 className="animate-spin" /> Gerando proposta… isso leva alguns segundos</> : <><Sparkles /> Gerar proposta</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
