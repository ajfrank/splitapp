import { toast } from "@/hooks/use-toast";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Handle Supabase errors by showing a toast notification
 */
export function handleSupabaseError(
  error: PostgrestError | null,
  context?: string
): boolean {
  if (!error) return false;

  toast({
    title: context ? `Error: ${context}` : "Error",
    description: error.message,
    variant: "destructive",
  });

  return true;
}

/**
 * Handle generic errors with toast notification
 */
export function handleError(error: unknown, context?: string): void {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  toast({
    title: context ? `Error: ${context}` : "Error",
    description: message,
    variant: "destructive",
  });
}
