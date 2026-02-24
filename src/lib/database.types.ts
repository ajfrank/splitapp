// Database types for Supabase
// These types match the database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SplitType = "equal" | "percentage" | "exact" | "shares";
export type Category = "food" | "transport" | "lodging" | "entertainment" | "other";
export type GroupRole = "admin" | "member";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          venmo_username: string | null;
          paypal_username: string | null;
          cashapp_username: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          venmo_username?: string | null;
          paypal_username?: string | null;
          cashapp_username?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          venmo_username?: string | null;
          paypal_username?: string | null;
          cashapp_username?: string | null;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          currency: string;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          currency: string;
          invite_code?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          currency?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: GroupRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: GroupRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: GroupRole;
          joined_at?: string;
        };
      };
      expenses: {
        Row: {
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
        };
        Insert: {
          id?: string;
          group_id: string;
          description: string;
          amount: number;
          currency: string;
          category: Category;
          paid_by: string;
          expense_date: string;
          split_type: SplitType;
          receipt_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          description?: string;
          amount?: number;
          currency?: string;
          category?: Category;
          paid_by?: string;
          expense_date?: string;
          split_type?: SplitType;
          receipt_url?: string | null;
          created_at?: string;
        };
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          amount: number;
          percentage: number | null;
          shares: number | null;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          amount: number;
          percentage?: number | null;
          shares?: number | null;
        };
        Update: {
          id?: string;
          expense_id?: string;
          user_id?: string;
          amount?: number;
          percentage?: number | null;
          shares?: number | null;
        };
      };
      settlements: {
        Row: {
          id: string;
          group_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          currency: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          from_user?: string;
          to_user?: string;
          amount?: number;
          currency?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      split_type: SplitType;
      category: Category;
      group_role: GroupRole;
    };
  };
}

// Convenience type aliases
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseSplit = Database["public"]["Tables"]["expense_splits"]["Row"];
export type Settlement = Database["public"]["Tables"]["settlements"]["Row"];

// Extended types with relations
export interface GroupMemberWithUser extends GroupMember {
  user?: User;
}

export interface ExpenseSplitWithUser extends ExpenseSplit {
  user?: User;
}

export interface ExpenseWithRelations extends Expense {
  paid_by_user?: User;
  splits?: ExpenseSplitWithUser[];
}

export interface SettlementWithUsers extends Settlement {
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
