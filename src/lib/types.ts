// Re-export all types from database.types.ts for backward compatibility
export type {
  SplitType,
  Category,
  GroupRole,
  RecurrenceFrequency,
  User,
  Group,
  GroupMember,
  Expense,
  ExpenseSplit,
  Settlement,
  GroupMemberWithUser,
  ExpenseSplitWithUser,
  ExpenseWithRelations,
  SettlementWithUsers,
  GroupBalance,
  DebtEdge,
  Database,
} from "./database.types";

// Alias for backward compatibility
export type { ExpenseWithRelations as ExpenseWithDetails } from "./database.types";
