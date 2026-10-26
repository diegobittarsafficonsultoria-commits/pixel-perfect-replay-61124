import { describe, expect, it } from "vitest";
import { parseBRL, summarize, type Proposal } from "./store";

const p = (status: Proposal["status"], valor: string) =>
  ({ status, input: { valor } }) as unknown as Proposal;

describe("valores", () => {
  it("interpreta valores em reais", () => {
    expect(parseBRL("R$ 12.500,50")).toBe(12500.5);
    expect(parseBRL("15000")).toBe(15000);
    expect(parseBRL("R$ 8.000")).toBe(8000);
  });
  it("soma apenas propostas aprovadas", () => {
    const s = summarize([p("Aprovada", "R$ 1.000,00"), p("Aprovada", "2000"), p("Enviada", "5000")]);
    expect(s.aprovadas).toBe(3000);
    expect(s.counts.Enviada).toBe(1);
  });
});
