import { describe, it, expect } from "vitest";
import { generateVenmoDeepLink, generateVenmoWebLink } from "../venmo";

describe("generateVenmoDeepLink", () => {
  it("returns a venmo:// deep link", () => {
    const url = generateVenmoDeepLink({
      username: "johndoe",
      amount: 25.5,
      note: "Dinner",
    });
    expect(url).toMatch(/^venmo:\/\/paycharge\?/);
  });

  it("includes correct parameters", () => {
    const url = generateVenmoDeepLink({
      username: "johndoe",
      amount: 25.5,
      note: "Dinner",
    });
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("txn")).toBe("pay");
    expect(params.get("recipients")).toBe("johndoe");
    expect(params.get("amount")).toBe("25.50");
    expect(params.get("note")).toBe("Dinner");
  });

  it("formats amount to 2 decimal places", () => {
    const url = generateVenmoDeepLink({
      username: "test",
      amount: 10,
      note: "Test",
    });
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("amount")).toBe("10.00");
  });

  it("URL-encodes special characters in note", () => {
    const url = generateVenmoDeepLink({
      username: "test",
      amount: 5,
      note: "Lunch & coffee for 2",
    });
    expect(url).toContain("Lunch");
    // URLSearchParams handles encoding
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("note")).toBe("Lunch & coffee for 2");
  });
});

describe("generateVenmoWebLink", () => {
  it("returns an https://venmo.com link", () => {
    const url = generateVenmoWebLink({
      username: "johndoe",
      amount: 25,
      note: "Test",
    });
    expect(url).toMatch(/^https:\/\/venmo\.com\/\?/);
  });

  it("includes the same parameters as deep link", () => {
    const opts = { username: "johndoe", amount: 15.75, note: "Taxi" };
    const deepParams = new URLSearchParams(generateVenmoDeepLink(opts).split("?")[1]);
    const webParams = new URLSearchParams(generateVenmoWebLink(opts).split("?")[1]);

    expect(webParams.get("txn")).toBe(deepParams.get("txn"));
    expect(webParams.get("recipients")).toBe(deepParams.get("recipients"));
    expect(webParams.get("amount")).toBe(deepParams.get("amount"));
    expect(webParams.get("note")).toBe(deepParams.get("note"));
  });
});
