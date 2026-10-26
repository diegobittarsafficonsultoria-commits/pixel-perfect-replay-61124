import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptySettings, getSettings, saveSettings, useHydratedValue, type Settings } from "@/lib/store";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Proposta Rápida" },
      { name: "description", content: "Dados da sua consultoria que aparecem em todas as propostas." },
      { property: "og:title", content: "Configurações — Proposta Rápida" },
      { property: "og:description", content: "Dados da sua consultoria que aparecem em todas as propostas." },
    ],
  }),
  component: Page,
});

const fields: { k: keyof Settings; label: string; type?: string }[] = [
  { k: "empresa", label: "Nome da empresa" },
  { k: "slogan", label: "Slogan" },
  { k: "consultor", label: "Nome do consultor" },
  { k: "email", label: "E-mail", type: "email" },
  { k: "telefone", label: "Telefone", type: "tel" },
  { k: "site", label: "Site" },
];

function Page() {
  const [s, setS] = useHydratedValue(getSettings, emptySettings);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold sm:text-4xl">Configurações</h1>
      <p className="mt-2 text-cream-muted">Estes dados aparecem no cabeçalho e no rodapé de todas as propostas.</p>
      <form
        className="mt-6 grid gap-4 rounded-lg bg-card p-6 text-card-foreground sm:grid-cols-2"
        onSubmit={(e) => { e.preventDefault(); saveSettings(s); toast.success("Configurações salvas"); }}
      >
        {fields.map((f) => (
          <div key={f.k} className="space-y-1.5">
            <Label htmlFor={f.k}>{f.label}</Label>
            <Input id={f.k} type={f.type ?? "text"} value={s[f.k]} onChange={(e) => setS({ ...s, [f.k]: e.target.value })} />
          </div>
        ))}
        <div className="sm:col-span-2"><Button type="submit">Salvar configurações</Button></div>
      </form>
    </div>
  );
}
