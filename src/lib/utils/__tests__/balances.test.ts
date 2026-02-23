import { describe, it, expect } from "vitest";
import { calculateBalances } from "../balances";

describe("calculateBalances", () => {
  it("returns empty map for empty inputs", () => {
    const result = calculateBalances([], []);
    expect(result.size).toBe(0);
  });

  it("calculates balance for a simple expense", () => {
    const expenses = [
      {
        paid_by: "a",
        amount: 30,
        splits: [
          { user_id: "a", amount: 10 },
          { user_id: "b", amount: 10 },
          { user_id: "c", amount: 10 },
        ],
      },
    ];
    const result = calculateBalances(expenses, []);
    // a paid 30, owes 10 → net +20
    expect(result.get("a")).toBe(20);
    // b owes 10 → net -10
    expect(result.get("b")).toBe(-10);
    // c owes 10 → net -10
    expect(result.get("c")).toBe(-10);
  });

  it("accounts for settlements", () => {
    const expenses = [
      {
        paid_by: "a",
        amount: 20,
        splits: [
          { user_id: "a", amount: 10 },
          { user_id: "b", amount: 10 },
        ],
      },
    ];
    const settlements = [
      { from_user: "b", to_user: "a", amount: 10 },
    ];
    const result = calculateBalances(expenses, settlements);
    // a: +20 (paid) - 10 (split) - 10 (received settlement) = 0
    expect(result.get("a")).toBe(0);
    // b: -10 (split) + 10 (paid settlement) = 0
    expect(result.get("b")).toBe(0);
  });

  it("handles multiple expenses from different payers", () => {
    const expenses = [
      {
        paid_by: "a",
        amount: 40,
        splits: [
          { user_id: "a", amount: 20 },
          { user_id: "b", amount: 20 },
        ],
      },
      {
        paid_by: "b",
        amount: 20,
        splits: [
          { user_id: "a", amount: 10 },
          { user_id: "b", amount: 10 },
        ],
      },
    ];
    const result = calculateBalances(expenses, []);
    // a: +40 - 20 - 10 = +10
    expect(result.get("a")).toBe(10);
    // b: -20 + 20 - 10 = -10
    expect(result.get("b")).toBe(-10);
  });

  it("handles expenses with no splits", () => {
    const expenses = [
      { paid_by: "a", amount: 50 },
    ];
    const result = calculateBalances(expenses, []);
    expect(result.get("a")).toBe(50);
  });
});
