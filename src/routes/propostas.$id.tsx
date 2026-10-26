import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProposalView } from "@/components/ProposalView";
import { getProposal, type Proposal } from "@/lib/store";

export const Route = createFileRoute("/propostas/$id")({
  head: () => ({
    meta: [
      { title: "Proposta — Proposta Rápida" },
      { name: "description", content: "Visualize, edite e exporte sua proposta comercial." },
      { property: "og:title", content: "Proposta — Proposta Rápida" },
      { property: "og:description", content: "Visualize, edite e exporte sua proposta comercial." },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const [p, setP] = useState<Proposal | null | undefined>(undefined);
  useEffect(() => setP(getProposal(id) ?? null), [id]);
  if (p === undefined) return null;
  if (p === null)
    return (
      <div className="text-center">
        <p>Proposta não encontrada.</p>
        <Link to="/propostas" className="mt-4 inline-block text-brass underline">Voltar para a lista</Link>
      </div>
    );
  return (
    <div>
      <Link to="/propostas" className="text-sm text-cream-muted hover:text-cream">← Minhas propostas</Link>
      <div className="mt-2"><ProposalView key={p.id} proposal={p} setProposal={setP} saved /></div>
    </div>
  );
}
