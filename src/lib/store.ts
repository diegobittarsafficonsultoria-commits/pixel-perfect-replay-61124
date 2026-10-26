import { useEffect, useState } from "react";

export type Status = "Rascunho" | "Enviada" | "Aprovada" | "Recusada";
export const STATUSES: Status[] = ["Rascunho", "Enviada", "Aprovada", "Recusada"];

export interface Settings {
  empresa: string;
  slogan: string;
  consultor: string;
  email: string;
  telefone: string;
  site: string;
}

export interface ProposalInput {
  cliente: string;
  setor: string;
  contato: string;
  necessidade: string;
  objetivos: string;
  escopo: string;
  prazo: string;
  valor: string;
  pagamento: string;
  validade: string;
  observacoes: string;
}

export interface ProposalContent {
  apresentacao: string;
  entendimento_do_contexto: string;
  objetivos: string[];
  escopo_e_entregas: string[];
  metodologia: { nome: string; descricao: string }[];
  cronograma: { etapa: string; prazo: string }[];
  investimento: string;
  proximos_passos: string[];
}

export interface Proposal {
  id: string;
  createdAt: string;
  status: Status;
  input: ProposalInput;
  content: ProposalContent;
}

export const emptySettings: Settings = { empresa: "", slogan: "", consultor: "", email: "", telefone: "", site: "" };

const SETTINGS_KEY = "pr_settings";
const PROPOSALS_KEY = "pr_proposals";
const PENDING_KEY = "pr_pending";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

export const getSettings = () => ({ ...emptySettings, ...read<Settings>(SETTINGS_KEY, emptySettings) });
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s);
export const getProposals = () => read<Proposal[]>(PROPOSALS_KEY, []);
export const getProposal = (id: string) => getProposals().find((p) => p.id === id);
export function upsertProposal(p: Proposal) {
  const all = getProposals();
  const i = all.findIndex((x) => x.id === p.id);
  if (i >= 0) all[i] = p;
  else all.unshift(p);
  write(PROPOSALS_KEY, all);
}
export const getPending = () => read<Proposal | null>(PENDING_KEY, null);
export const setPending = (p: Proposal | null) =>
  p ? write(PENDING_KEY, p) : localStorage.removeItem(PENDING_KEY);

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Converte "R$ 12.500,50" / "12500" em número. Retorna 0 se não houver número. */
export function parseBRL(v: string): number {
  const cleaned = (v || "").replace(/[^\d,.-]/g, "");
  if (!cleaned) return 0;
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/\.(?=\d{3}(\D|$))/g, "");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

export const formatBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export function summarize(list: Proposal[]) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  let aprovadas = 0;
  for (const p of list) {
    counts[p.status]++;
    if (p.status === "Aprovada") aprovadas += parseBRL(p.input.valor);
  }
  return { counts, aprovadas };
}

export function useHydratedValue<T>(get: () => T, fallback: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(fallback);
  useEffect(() => setV(get()), []); // eslint-disable-line react-hooks/exhaustive-deps
  return [v, setV];
}
