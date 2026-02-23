import { describe, it, expect } from "vitest";
import { formatCurrency, getCurrencySymbol, CURRENCIES, CATEGORIES } from "../format";

describe("formatCurrency", () => {
  it("formats USD correctly", () => {
    expect(formatCurrency(10, "USD")).toBe("$10.00");
  });

  it("formats EUR correctly", () => {
    expect(formatCurrency(25.5, "EUR")).toBe("€25.50");
  });

  it("uses absolute value for negative amounts", () => {
    expect(formatCurrency(-5, "USD")).toBe("$5.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("defaults to USD when no currency given", () => {
    expect(formatCurrency(42)).toBe("$42.00");
  });

  it("falls back to currency code for unknown currencies", () => {
    expect(formatCurrency(10, "BRL")).toBe("BRL 10.00");
  });

  it("handles large amounts", () => {
    expect(formatCurrency(999999.99, "USD")).toBe("$999999.99");
  });
});

describe("getCurrencySymbol", () => {
  it("returns $ for USD", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
  });

  it("returns € for EUR", () => {
    expect(getCurrencySymbol("EUR")).toBe("€");
  });

  it("returns £ for GBP", () => {
    expect(getCurrencySymbol("GBP")).toBe("£");
  });

  it("returns ¥ for JPY", () => {
    expect(getCurrencySymbol("JPY")).toBe("¥");
  });

  it("returns currency code for unknown currency", () => {
    expect(getCurrencySymbol("BRL")).toBe("BRL");
  });
});

describe("CURRENCIES", () => {
  it("has 6 entries", () => {
    expect(CURRENCIES).toHaveLength(6);
  });

  it("includes USD", () => {
    expect(CURRENCIES.find((c) => c.value === "USD")).toBeDefined();
  });
});

describe("CATEGORIES", () => {
  it("has 5 entries", () => {
    expect(CATEGORIES).toHaveLength(5);
  });

  it("includes food, transport, lodging, entertainment, other", () => {
    const values = CATEGORIES.map((c) => c.value);
    expect(values).toEqual(["food", "transport", "lodging", "entertainment", "other"]);
  });
});
