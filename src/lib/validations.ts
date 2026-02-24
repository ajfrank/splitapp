import { z } from "zod";

// Expense form validation schema
export const expenseSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be greater than 0",
    }),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be less than 200 characters"),
  category: z.enum(["food", "transport", "lodging", "entertainment", "other"]),
  paidBy: z.string().min(1, "Payer is required"),
  expenseDate: z.string().min(1, "Date is required"),
  splitType: z.enum(["equal", "percentage", "exact", "shares"]),
  selectedMembers: z
    .array(z.string())
    .min(1, "At least one member must be selected"),
  splitValues: z.record(z.string(), z.number()),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

// Group form validation schema
export const groupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(50, "Group name must be less than 50 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  currency: z.string().min(1, "Currency is required"),
});

export type GroupFormData = z.infer<typeof groupSchema>;

// Profile form validation schema
export const profileSchema = z.object({
  venmoUsername: z
    .string()
    .max(50, "Username must be less than 50 characters")
    .optional()
    .transform((val) => val || null),
  paypalUsername: z
    .string()
    .max(50, "Username must be less than 50 characters")
    .optional()
    .transform((val) => val || null),
  cashappUsername: z
    .string()
    .max(50, "Username must be less than 50 characters")
    .optional()
    .transform((val) => val || null),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Settle form validation schema
export const settleSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be greater than 0",
    }),
  toUser: z.string().min(1, "Recipient is required"),
});

export type SettleFormData = z.infer<typeof settleSchema>;

// Search/filter schema
export const expenseFilterSchema = z.object({
  search: z.string().optional(),
  category: z.enum(["all", "food", "transport", "lodging", "entertainment", "other"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type ExpenseFilterData = z.infer<typeof expenseFilterSchema>;
