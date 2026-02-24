import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ExpenseCard } from "../expense-card";
import type { ExpenseWithRelations } from "@/lib/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

// Mock supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }),
}));

afterEach(() => {
  cleanup();
});

const mockExpense: ExpenseWithRelations = {
  id: "exp-1",
  group_id: "grp-1",
  description: "Pizza dinner",
  amount: 45.5,
  currency: "USD",
  category: "food",
  paid_by: "user-1",
  expense_date: "2025-06-15",
  split_type: "equal",
  receipt_url: null,
  created_at: "2025-06-15T12:00:00Z",
  paid_by_user: {
    id: "user-1",
    email: "john@test.com",
    full_name: "John Doe",
    avatar_url: null,
    venmo_username: null,
    paypal_username: null,
    cashapp_username: null,
    created_at: "2025-01-01T00:00:00Z",
  },
};

describe("ExpenseCard", () => {
  it("renders the expense description", () => {
    render(<ExpenseCard expense={mockExpense} currency="USD" />);
    expect(screen.getByText("Pizza dinner")).toBeInTheDocument();
  });

  it("renders the formatted amount", () => {
    render(<ExpenseCard expense={mockExpense} currency="USD" />);
    expect(screen.getByText("$45.50")).toBeInTheDocument();
  });

  it("renders the payer name", () => {
    render(<ExpenseCard expense={mockExpense} currency="USD" />);
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });

  it("renders a delete button", () => {
    render(<ExpenseCard expense={mockExpense} currency="USD" />);
    const deleteBtn = screen.getByRole("button");
    expect(deleteBtn).toBeInTheDocument();
  });

  it("shows category icon for food", () => {
    render(<ExpenseCard expense={mockExpense} currency="USD" />);
    expect(screen.getByText("🍔")).toBeInTheDocument();
  });
});
