-- Add recurring expense support
-- Migration: 002_recurring_expenses.sql

-- Add recurrence columns to expenses table
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT CHECK (recurrence_frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS next_occurrence_date DATE,
  ADD COLUMN IF NOT EXISTS parent_recurring_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL;

-- Index for finding recurring expenses that need processing
CREATE INDEX IF NOT EXISTS idx_expenses_recurring
  ON public.expenses(group_id, is_recurring, next_occurrence_date)
  WHERE is_recurring = true;

-- Index for finding child expenses of a recurring parent
CREATE INDEX IF NOT EXISTS idx_expenses_parent_recurring
  ON public.expenses(parent_recurring_id)
  WHERE parent_recurring_id IS NOT NULL;

-- Comment explaining the recurrence model
COMMENT ON COLUMN public.expenses.is_recurring IS 'Whether this expense is a recurring expense template';
COMMENT ON COLUMN public.expenses.recurrence_frequency IS 'How often the expense recurs: weekly, biweekly, monthly, or yearly';
COMMENT ON COLUMN public.expenses.recurrence_end_date IS 'Optional date when recurrence stops';
COMMENT ON COLUMN public.expenses.next_occurrence_date IS 'When the next instance should be created';
COMMENT ON COLUMN public.expenses.parent_recurring_id IS 'Links to the parent recurring expense template';
