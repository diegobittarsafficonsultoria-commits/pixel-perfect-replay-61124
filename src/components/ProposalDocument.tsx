import { useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import type { Proposal, ProposalContent, Settings } from "@/lib/store";
import { formatDate } from "@/lib/store";

function Edit({ value, onChange, className = "" }: { value: string; onChange: (v: string) => void; className?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`doc-editable w-full resize-none overflow-hidden bg-transparent px-1 leading-relaxed ${className}`}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="text-xl font-semibold text-primary">{title}</h3>
      <div className="mb-3 mt-1 h-0.5 w-10 bg-primary" />
      {children}
    </section>
  );
}

function List({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  return (
    <ul className="space-y-1">
      {items.map((it, i) => (
        <li key={i} className="group flex items-start gap-2">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <Edit value={it} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="mt-1 text-muted-foreground opacity-0 transition group-hover:opacity-100" aria-label="Remover item"><X className="h-4 w-4" /></button>
        </li>
      ))}
      <li><button onClick={() => onChange([...items, ""])} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><Plus className="h-3 w-3" /> Adicionar item</button></li>
    </ul>
  );
}

function Steps<T extends Record<string, string>>({ items, a, b, onChange, empty }: { items: T[]; a: keyof T; b: keyof T; onChange: (v: T[]) => void; empty: T }) {
  const set = (i: number, k: keyof T, v: string) => onChange(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <ol className="space-y-3">
      {items.map((it, i) => (
        <li key={i} className="group flex gap-3">
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
          <div className="flex-1">
            <Edit value={String(it[a] ?? "")} onChange={(v) => set(i, a, v)} className="font-semibold" />
            <Edit value={String(it[b] ?? "")} onChange={(v) => set(i, b, v)} className="text-muted-foreground" />
          </div>
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-muted-foreground opacity-0 transition group-hover:opacity-100" aria-label="Remover etapa"><X className="h-4 w-4" /></button>
        </li>
      ))}
      <li><button onClick={() => onChange([...items, { ...empty }])} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><Plus className="h-3 w-3" /> Adicionar etapa</button></li>
    </ol>
  );
}

export function ProposalDocument({ proposal, settings, onChange }: { proposal: Proposal; settings: Settings; onChange: (c: ProposalContent) => void }) {
  const c = proposal.content;
  const set = <K extends keyof ProposalContent>(k: K, v: ProposalContent[K]) => onChange({ ...c, [k]: v });
  const contato = [settings.consultor, settings.email, settings.telefone, settings.site].filter(Boolean).join("  ·  ");
  return (
    <article className="overflow-hidden rounded-lg bg-card text-card-foreground shadow-2xl">
      <header className="flex flex-col gap-3 bg-primary px-6 py-6 text-primary-foreground sm:flex-row sm:items-end sm:justify-between sm:px-10">
        <div>
          <h2 className="text-2xl font-semibold">{settings.empresa || "Sua consultoria"}</h2>
          {settings.slogan && <p className="text-sm opacity-80">{settings.slogan}</p>}
        </div>
        <div className="text-sm opacity-90 sm:text-right">
          <p>Data: {formatDate(proposal.createdAt)}</p>
          {proposal.input.validade && <p>Validade: {proposal.input.validade} dias</p>}
        </div>
      </header>
      <div className="px-6 py-8 sm:px-10">
        <h1 className="text-3xl font-semibold text-primary sm:text-4xl">Proposta comercial</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Para <strong className="text-card-foreground">{proposal.input.cliente || "[a definir]"}</strong>
          {proposal.input.setor && <> · {proposal.input.setor}</>}
          {proposal.input.contato && <> · A/C {proposal.input.contato}</>}
        </p>
        <Section title="Apresentação"><Edit value={c.apresentacao} onChange={(v) => set("apresentacao", v)} /></Section>
        <Section title="Entendimento do contexto"><Edit value={c.entendimento_do_contexto} onChange={(v) => set("entendimento_do_contexto", v)} /></Section>
        <Section title="Objetivos"><List items={c.objetivos} onChange={(v) => set("objetivos", v)} /></Section>
        <Section title="Escopo e entregas"><List items={c.escopo_e_entregas} onChange={(v) => set("escopo_e_entregas", v)} /></Section>
        <Section title="Metodologia"><Steps items={c.metodologia} a="nome" b="descricao" empty={{ nome: "", descricao: "" }} onChange={(v) => set("metodologia", v)} /></Section>
        <Section title="Cronograma"><Steps items={c.cronograma} a="etapa" b="prazo" empty={{ etapa: "", prazo: "" }} onChange={(v) => set("cronograma", v)} /></Section>
        <Section title="Investimento"><Edit value={c.investimento} onChange={(v) => set("investimento", v)} /></Section>
        <Section title="Próximos passos"><List items={c.proximos_passos} onChange={(v) => set("proximos_passos", v)} /></Section>
        {proposal.input.observacoes && <Section title="Observações"><p className="px-1 leading-relaxed">{proposal.input.observacoes}</p></Section>}
      </div>
      <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground sm:px-10">{contato || "Preencha seus contatos em Configurações."}</footer>
    </article>
  );
}
