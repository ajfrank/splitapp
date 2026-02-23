import { describe, it, expect } from "vitest";
import { cn } from "../cn";

describe("cn", () => {
  it("combines multiple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters falsy values", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("resolves Tailwind conflicts via tailwind-merge", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("keeps non-conflicting Tailwind classes", () => {
    expect(cn("p-2", "m-4")).toBe("p-2 m-4");
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
