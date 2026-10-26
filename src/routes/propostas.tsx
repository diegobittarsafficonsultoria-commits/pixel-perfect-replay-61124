import { createFileRoute, Outlet, useMatchRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatBRL, formatDate, getProposals, parseBRL, STATUSES, summarize, upsertProposal, useHydratedValue, type Proposal, type Status } from "@/lib/store";

export const Route = createFileRoute("/propostas")({
  head: () => ({
    meta: [
      { title: "Minhas propostas — Proposta Rápida" },
      { name: "description", content: "Acompanhe suas propostas comerciais por status e valor aprovado." },
      { property: "og:title", content: "Minhas propostas — Proposta Rápida" },
      { property: "og:description", content: "Acompanhe suas propostas comerciais por status e valor aprovado." },
    ],
  }),
  component: Layout,
});

function Layout() {
  const match = useMatchRoute();
  return match({ to: "/propostas/$id" }) ? <Outlet /> : <List />;
}

const statusColor: Record<Status, string> = {
  Rascunho: "bg-status-draft",
  Enviada: "bg-status-sent",
  Aprovada: "bg-status-approved",
  Recusada: "bg-status-rejected",
};

function List() {
  const navigate = useNavigate();
  const [list, setList] = useHydratedValue<Proposal[]>(getProposals, []);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Status | "Todas">("Todas");
  const { counts, aprovadas } = summarize(list);

  const shown = useMemo(
    () => list.filter((p) => (filter === "Todas" || p.status === filter) && p.input.cliente.toLowerCase().includes(q.toLowerCase())),
    [list, q, filter],
  );

  const changeStatus = (p: Proposal, status: Status) => {
    const upd = { ...p, status };
    upsertProposal(upd);
    setList(list.map((x) => (x.id === p.id ? upd : x)));
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold sm:text-4xl">Minhas propostas</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(filter === s ? "Todas" : s)} className={`rounded-lg border p-4 text-left transition ${filter === s ? "border-cream bg-cream/10" : "border-cream/15 hover:border-cream/40"}`}>
            <div className="flex items-center gap-2 text-xs text-cream-muted"><span className={`h-2 w-2 rounded-full ${statusColor[s]}`} />{s}</div>
            <div className="mt-1 font-serif text-3xl">{counts[s]}</div>
          </button>
        ))}
        <div className="col-span-2 rounded-lg bg-cream p-4 text-forest sm:col-span-1">
          <div className="text-xs opacity-70">Total aprovado</div>
          <div className="mt-1 font-serif text-2xl font-semibold">{formatBRL(aprovadas)}</div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por cliente" value={q} onChange={(e) => setQ(e.target.value)} className="bg-card pl-9 text-card-foreground" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Status | "Todas")} className="h-9 rounded-md border border-input bg-card px-3 text-sm text-card-foreground">
          <option value="Todas">Todos os status</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg bg-card text-card-foreground">
        {shown.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">{list.length === 0 ? "Nenhuma proposta salva ainda." : "Nenhuma proposta encontrada."}</p>
        ) : (
          <ul className="divide-y divide-border">
            {shown.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 p-4 transition hover:bg-muted sm:flex-row sm:items-center">
                <button className="flex-1 text-left" onClick={() => navigate({ to: "/propostas/$id", params: { id: p.id } })}>
                  <div className="font-serif text-lg font-semibold">{p.input.cliente || "Sem nome"}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(p.createdAt)} · {parseBRL(p.input.valor) ? formatBRL(parseBRL(p.input.valor)) : p.input.valor || "Valor a definir"}</div>
                </button>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${statusColor[p.status]}`} />
                  <select aria-label="Status" value={p.status} onChange={(e) => changeStatus(p, e.target.value as Status)} className="h-8 rounded-md border border-input bg-card px-2 text-sm">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
