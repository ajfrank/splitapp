import { describe, it, expect } from "vitest";
import { calculateSplits } from "../splits";

describe("calculateSplits", () => {
  describe("equal split", () => {
    it("splits evenly among 2 people", () => {
      const result = calculateSplits(10, "equal", ["a", "b"]);
      expect(result).toEqual([
        { userId: "a", amount: 5 },
        { userId: "b", amount: 5 },
      ]);
    });

    it("handles remainder by giving extra to the first person", () => {
      const result = calculateSplits(100, "equal", ["a", "b", "c"]);
      // 100 / 3 = 33.33 per person, remainder 0.01 to first
      expect(result).toHaveLength(3);
      expect(result[0]?.amount).toBeCloseTo(33.34, 2);
      expect(result[1]?.amount).toBeCloseTo(33.33, 2);
      expect(result[2]?.amount).toBeCloseTo(33.33, 2);
      // Sum should equal total
      const total = result.reduce((sum, r) => sum + r.amount, 0);
      expect(total).toBeCloseTo(100, 2);
    });

    it("returns empty array for no members", () => {
      expect(calculateSplits(100, "equal", [])).toEqual([]);
    });

    it("gives full amount to a single member", () => {
      const result = calculateSplits(42.5, "equal", ["solo"]);
      expect(result).toEqual([{ userId: "solo", amount: 42.5 }]);
    });
  });

  describe("percentage split", () => {
    it("splits by given percentages", () => {
      const result = calculateSplits(100, "percentage", ["a", "b", "c"], [
        { userId: "a", value: 50 },
        { userId: "b", value: 30 },
        { userId: "c", value: 20 },
      ]);
      expect(result).toEqual([
        { userId: "a", amount: 50 },
        { userId: "b", amount: 30 },
        { userId: "c", amount: 20 },
      ]);
    });

    it("rounds to 2 decimal places", () => {
      const result = calculateSplits(100, "percentage", ["a", "b", "c"], [
        { userId: "a", value: 33.33 },
        { userId: "b", value: 33.33 },
        { userId: "c", value: 33.34 },
      ]);
      expect(result).toHaveLength(3);
      expect(result[0]?.amount).toBeCloseTo(33.33, 2);
      expect(result[1]?.amount).toBeCloseTo(33.33, 2);
      expect(result[2]?.amount).toBeCloseTo(33.34, 2);
    });

    it("returns empty when no inputs provided", () => {
      expect(calculateSplits(100, "percentage", ["a"])).toEqual([]);
    });
  });

  describe("exact split", () => {
    it("uses exact amounts from inputs", () => {
      const result = calculateSplits(100, "exact", ["a", "b"], [
        { userId: "a", value: 60 },
        { userId: "b", value: 40 },
      ]);
      expect(result).toEqual([
        { userId: "a", amount: 60 },
        { userId: "b", amount: 40 },
      ]);
    });

    it("returns empty when no inputs", () => {
      expect(calculateSplits(100, "exact", ["a"])).toEqual([]);
    });
  });

  describe("shares split", () => {
    it("splits proportionally by shares", () => {
      const result = calculateSplits(90, "shares", ["a", "b"], [
        { userId: "a", value: 2 },
        { userId: "b", value: 1 },
      ]);
      expect(result).toEqual([
        { userId: "a", amount: 60 },
        { userId: "b", amount: 30 },
      ]);
    });

    it("returns empty when total shares is zero", () => {
      const result = calculateSplits(100, "shares", ["a"], [
        { userId: "a", value: 0 },
      ]);
      expect(result).toEqual([]);
    });

    it("handles equal shares", () => {
      const result = calculateSplits(100, "shares", ["a", "b", "c", "d"], [
        { userId: "a", value: 1 },
        { userId: "b", value: 1 },
        { userId: "c", value: 1 },
        { userId: "d", value: 1 },
      ]);
      expect(result.every((r) => r.amount === 25)).toBe(true);
    });
  });
});
