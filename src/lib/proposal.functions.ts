import { createServerFn } from "@tanstack/react-start";
import type { ProposalContent, ProposalInput } from "./store";

const SYSTEM = `Você é um consultor empresarial experiente. A partir dos dados informados, escreva uma proposta comercial em português do Brasil, com tom profissional e direto. Responda apenas em JSON com os campos: apresentacao (1 parágrafo), entendimento_do_contexto (1 a 2 parágrafos), objetivos (lista), escopo_e_entregas (lista), metodologia (lista de etapas, cada uma com nome e descricao), cronograma (lista de etapas com prazo), investimento (texto), proximos_passos (lista). Use exatamente o valor, a forma de pagamento e o prazo informados. Nunca invente números, valores, datas ou nomes. Se uma informação não foi fornecida, escreva '[a definir]'.`;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["apresentacao", "entendimento_do_contexto", "objetivos", "escopo_e_entregas", "metodologia", "cronograma", "investimento", "proximos_passos"],
  properties: {
    apresentacao: { type: "string" },
    entendimento_do_contexto: { type: "string" },
    objetivos: { type: "array", items: { type: "string" } },
    escopo_e_entregas: { type: "array", items: { type: "string" } },
    metodologia: { type: "array", items: { type: "object", additionalProperties: false, required: ["nome", "descricao"], properties: { nome: { type: "string" }, descricao: { type: "string" } } } },
    cronograma: { type: "array", items: { type: "object", additionalProperties: false, required: ["etapa", "prazo"], properties: { etapa: { type: "string" }, prazo: { type: "string" } } } },
    investimento: { type: "string" },
    proximos_passos: { type: "array", items: { type: "string" } },
  },
};

const f = (v: string) => (v?.trim() ? v.trim() : "[não informado]");

export const generateProposal = createServerFn({ method: "POST" })
  .inputValidator((d: { input: ProposalInput; empresa: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true; content: ProposalContent } | { ok: false; error: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false, error: "Serviço de IA não configurado." };
    const i = data.input;
    const user = `Consultoria: ${f(data.empresa)}
Cliente: ${f(i.cliente)}
Setor do cliente: ${f(i.setor)}
Nome do contato: ${f(i.contato)}
Necessidade ou problema: ${f(i.necessidade)}
Objetivos esperados: ${f(i.objetivos)}
Escopo e entregas: ${f(i.escopo)}
Prazo do projeto: ${f(i.prazo)}
Valor do investimento: ${f(i.valor)}
Forma de pagamento: ${f(i.pagamento)}
Validade da proposta: ${i.validade ? i.validade + " dias" : "[não informado]"}
Observações: ${f(i.observacoes)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
        response_format: { type: "json_schema", json_schema: { name: "proposta", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) return { ok: false, error: "Muitas solicitações no momento. Aguarde alguns segundos e tente de novo." };
      if (res.status === 402) return { ok: false, error: "Os créditos de IA acabaram. Adicione créditos ao workspace para continuar." };
      let msg = "";
      try { msg = (await res.json())?.error?.message ?? ""; } catch { /* ignore */ }
      return { ok: false, error: msg || `Não foi possível gerar a proposta (erro ${res.status}).` };
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const j = JSON.parse(payload);
          text += j.choices?.[0]?.delta?.content ?? "";
        } catch { /* partial */ }
      }
    }
    try {
      const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      const c = JSON.parse(cleaned) as ProposalContent;
      return {
        ok: true,
        content: {
          apresentacao: c.apresentacao ?? "",
          entendimento_do_contexto: c.entendimento_do_contexto ?? "",
          objetivos: c.objetivos ?? [],
          escopo_e_entregas: c.escopo_e_entregas ?? [],
          metodologia: c.metodologia ?? [],
          cronograma: c.cronograma ?? [],
          investimento: c.investimento ?? "",
          proximos_passos: c.proximos_passos ?? [],
        },
      };
    } catch {
      return { ok: false, error: "A IA retornou uma resposta inválida. Tente gerar novamente." };
    }
  });
