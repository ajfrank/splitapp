export type SplitType = "equal" | "percentage" | "exact" | "shares";
export type Category = "food" | "transport" | "lodging" | "entertainment" | "other";
export type GroupRole = "admin" | "member";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  venmo_username: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  user?: User;
}

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency: string;
  category: Category;
  paid_by: string;
  expense_date: string;
  split_type: SplitType;
  receipt_url: string | null;
  created_at: string;
  paid_by_user?: User;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  percentage: number | null;
  shares: number | null;
  user?: User;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  currency: string;
  created_at: string;
  from_user_data?: User;
  to_user_data?: User;
}

export interface GroupBalance {
  user_id: string;
  net_balance: number;
  user?: User;
}

export interface DebtEdge {
  from: string;
  to: string;
  amount: number;
}

export interface GroupMemberWithUser {
  user_id: string;
  group_id: string;
  role: GroupRole;
  user?: User;
}
