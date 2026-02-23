import { describe, it, expect } from "vitest";
import { simplifyDebts } from "../debt-simplify";

describe("simplifyDebts", () => {
  it("returns empty array for empty input", () => {
    expect(simplifyDebts(new Map())).toEqual([]);
  });

  it("returns empty when all balances are zero", () => {
    const balances = new Map([
      ["a", 0],
      ["b", 0],
    ]);
    expect(simplifyDebts(balances)).toEqual([]);
  });

  it("handles simple 2-person debt", () => {
    const balances = new Map([
      ["a", -10], // a owes
      ["b", 10],  // b is owed
    ]);
    const result = simplifyDebts(balances);
    expect(result).toEqual([
      { from: "a", to: "b", amount: 10 },
    ]);
  });

  it("handles 3-person triangle debt", () => {
    const balances = new Map([
      ["a", -10],
      ["b", 5],
      ["c", 5],
    ]);
    const result = simplifyDebts(balances);
    const totalPaid = result.reduce((sum, e) => sum + e.amount, 0);
    expect(totalPaid).toBe(10);
    expect(result.length).toBeLessThanOrEqual(2);
    // a should pay both b and c
    expect(result.every((e) => e.from === "a")).toBe(true);
  });

  it("minimizes number of transactions for 4 people", () => {
    const balances = new Map([
      ["a", -30],
      ["b", -10],
      ["c", 20],
      ["d", 20],
    ]);
    const result = simplifyDebts(balances);
    // Maximum n-1 transactions for n participants
    expect(result.length).toBeLessThanOrEqual(3);
    // Net flow should balance
    const flows = new Map<string, number>();
    result.forEach((e) => {
      flows.set(e.from, (flows.get(e.from) ?? 0) - e.amount);
      flows.set(e.to, (flows.get(e.to) ?? 0) + e.amount);
    });
    expect(Math.round((flows.get("a") ?? 0) * 100) / 100).toBe(-30);
    expect(Math.round((flows.get("b") ?? 0) * 100) / 100).toBe(-10);
    expect(Math.round(((flows.get("c") ?? 0) + (flows.get("d") ?? 0)) * 100) / 100).toBe(40);
  });

  it("handles floating-point near-zero balances", () => {
    const balances = new Map([
      ["a", 0.001],
      ["b", -0.001],
    ]);
    // Near-zero should be rounded away
    expect(simplifyDebts(balances)).toEqual([]);
  });

  it("handles single person with balance", () => {
    const balances = new Map([["a", 10]]);
    // No debtor to match
    expect(simplifyDebts(balances)).toEqual([]);
  });
});
