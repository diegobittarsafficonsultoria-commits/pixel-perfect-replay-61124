import type { Proposal, Settings } from "./store";
import { formatDate } from "./store";

export function proposalFileName(p: Proposal) {
  const cliente = (p.input.cliente || "cliente").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "_").replace(/^_|_$/g, "");
  const d = new Date(p.createdAt);
  const data = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `Proposta_${cliente}_${data}.pdf`;
}

export function proposalSections(p: Proposal) {
  const c = p.content;
  return [
    { title: "Apresentação", paragraphs: [c.apresentacao] },
    { title: "Entendimento do contexto", paragraphs: c.entendimento_do_contexto.split(/\n+/) },
    { title: "Objetivos", bullets: c.objetivos },
    { title: "Escopo e entregas", bullets: c.escopo_e_entregas },
    { title: "Metodologia", steps: c.metodologia.map((m) => ({ a: m.nome, b: m.descricao })) },
    { title: "Cronograma", steps: c.cronograma.map((m) => ({ a: m.etapa, b: m.prazo })) },
    { title: "Investimento", paragraphs: [c.investimento] },
    { title: "Próximos passos", bullets: c.proximos_passos },
  ] as { title: string; paragraphs?: string[]; bullets?: string[]; steps?: { a: string; b: string }[] }[];
}

export function proposalText(p: Proposal, s: Settings) {
  const lines = [s.empresa, s.slogan, "", `Proposta comercial para ${p.input.cliente}`, `Data: ${formatDate(p.createdAt)}`, ""];
  for (const sec of proposalSections(p)) {
    lines.push(sec.title.toUpperCase());
    sec.paragraphs?.forEach((t) => lines.push(t));
    sec.bullets?.forEach((t) => lines.push(`• ${t}`));
    sec.steps?.forEach((t, i) => lines.push(`${i + 1}. ${t.a} — ${t.b}`));
    lines.push("");
  }
  lines.push([s.consultor, s.email, s.telefone, s.site].filter(Boolean).join(" · "));
  return lines.join("\n");
}

export async function exportPdf(p: Proposal, s: Settings) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, H = 297, M = 20, CW = W - M * 2;
  const green: [number, number, number] = [20, 34, 25];
  const gray: [number, number, number] = [90, 90, 90];
  let y = 0;

  const footer = () => {
    doc.setDrawColor(...green);
    doc.setLineWidth(0.3);
    doc.line(M, H - 16, W - M, H - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    const contato = [s.consultor, s.email, s.telefone, s.site].filter(Boolean).join("  ·  ");
    doc.text(contato || s.empresa || "", M, H - 10);
  };
  const ensure = (h: number) => {
    if (y + h > H - 22) {
      footer();
      doc.addPage();
      y = M;
    }
  };

  // Header band
  doc.setFillColor(...green);
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(243, 240, 232);
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text(s.empresa || "Consultoria", M, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (s.slogan) doc.text(s.slogan, M, 25);
  doc.text(`Data: ${formatDate(p.createdAt)}`, W - M, 18, { align: "right" });
  if (p.input.validade) doc.text(`Validade: ${p.input.validade} dias`, W - M, 25, { align: "right" });

  y = 54;
  doc.setTextColor(...green);
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.text("Proposta comercial", M, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...gray);
  const para = [`Para: ${p.input.cliente || "[a definir]"}`, p.input.setor && `Setor: ${p.input.setor}`, p.input.contato && `A/C: ${p.input.contato}`].filter(Boolean).join("   ·   ");
  doc.text(para, M, y);
  y += 12;

  const writeLines = (text: string, x: number, width: number, size = 10.5) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text || "", width) as string[];
    for (const l of lines) {
      ensure(5.5);
      doc.text(l, x, y);
      y += 5.2;
    }
  };

  for (const sec of proposalSections(p)) {
    ensure(18);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...green);
    doc.text(sec.title, M, y);
    y += 2;
    doc.setDrawColor(...green);
    doc.setLineWidth(0.4);
    doc.line(M, y, M + 18, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    sec.paragraphs?.forEach((t) => { writeLines(t, M, CW); y += 2; });
    sec.bullets?.forEach((t) => {
      ensure(5.5);
      doc.setFillColor(...green);
      doc.circle(M + 1.2, y - 1.3, 0.8, "F");
      writeLines(t, M + 5, CW - 5);
      y += 1;
    });
    sec.steps?.forEach((t, i) => {
      ensure(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...green);
      writeLines(`${i + 1}. ${t.a}`, M, CW);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      writeLines(t.b, M + 5, CW - 5);
      y += 1.5;
    });
    y += 5;
  }
  if (p.input.observacoes) {
    ensure(18);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...green);
    doc.text("Observações", M, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    writeLines(p.input.observacoes, M, CW);
  }
  footer();
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text(`${i}/${n}`, W - M, H - 10, { align: "right" });
  }
  doc.save(proposalFileName(p));
}
