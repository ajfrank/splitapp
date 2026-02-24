import { addWeeks, addMonths, addYears, parseISO, format, isBefore, isAfter } from "date-fns";
import type { RecurrenceFrequency } from "@/lib/types";

export const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

/**
 * Calculate the next occurrence date based on frequency
 */
export function calculateNextOccurrence(
  currentDate: string | Date,
  frequency: RecurrenceFrequency
): Date {
  const date = typeof currentDate === "string" ? parseISO(currentDate) : currentDate;

  switch (frequency) {
    case "weekly":
      return addWeeks(date, 1);
    case "biweekly":
      return addWeeks(date, 2);
    case "monthly":
      return addMonths(date, 1);
    case "yearly":
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

/**
 * Format next occurrence date for display
 */
export function formatNextOccurrence(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

/**
 * Check if a recurring expense should generate a new instance
 */
export function shouldGenerateInstance(
  nextOccurrenceDate: string | null,
  endDate: string | null
): boolean {
  if (!nextOccurrenceDate) return false;

  const nextDate = parseISO(nextOccurrenceDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if next occurrence is today or in the past
  if (isAfter(nextDate, today)) return false;

  // Check if end date has passed
  if (endDate) {
    const end = parseISO(endDate);
    if (isBefore(end, today)) return false;
  }

  return true;
}

/**
 * Get the frequency label for display
 */
export function getFrequencyLabel(frequency: RecurrenceFrequency | null): string {
  if (!frequency) return "";
  const option = RECURRENCE_OPTIONS.find((o) => o.value === frequency);
  return option?.label || frequency;
}
