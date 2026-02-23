-- Fix: infinite recursion in group_members RLS policies.
-- Use SECURITY DEFINER functions so the membership check bypasses RLS.

CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_group_admin(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Drop all the old recursive policies
DROP POLICY IF EXISTS "Group members can view groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Group members can view members" ON public.group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Group members can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Group members can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Group members can view splits" ON public.expense_splits;
DROP POLICY IF EXISTS "Group members can create splits" ON public.expense_splits;
DROP POLICY IF EXISTS "Split owner can delete" ON public.expense_splits;
DROP POLICY IF EXISTS "Group members can view settlements" ON public.settlements;
DROP POLICY IF EXISTS "Group members can create settlements" ON public.settlements;

-- Recreate with the helper functions

-- Groups
CREATE POLICY "Group members can view groups" ON public.groups FOR SELECT
  USING (public.is_group_member(id));
CREATE POLICY "Group admins can update groups" ON public.groups FOR UPDATE
  USING (public.is_group_admin(id));

-- Group members
CREATE POLICY "Group members can view members" ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id));
CREATE POLICY "Admins can manage members" ON public.group_members FOR DELETE
  USING (public.is_group_admin(group_id));

-- Expenses
CREATE POLICY "Group members can view expenses" ON public.expenses FOR SELECT
  USING (public.is_group_member(group_id));
CREATE POLICY "Group members can create expenses" ON public.expenses FOR INSERT
  WITH CHECK (public.is_group_member(group_id));

-- Expense splits
CREATE POLICY "Group members can view splits" ON public.expense_splits FOR SELECT
  USING (expense_id IN (SELECT id FROM public.expenses WHERE public.is_group_member(group_id)));
CREATE POLICY "Group members can create splits" ON public.expense_splits FOR INSERT
  WITH CHECK (expense_id IN (SELECT id FROM public.expenses WHERE public.is_group_member(group_id)));
CREATE POLICY "Split owner can delete" ON public.expense_splits FOR DELETE
  USING (expense_id IN (SELECT id FROM public.expenses WHERE paid_by = auth.uid()));

-- Settlements
CREATE POLICY "Group members can view settlements" ON public.settlements FOR SELECT
  USING (public.is_group_member(group_id));
CREATE POLICY "Group members can create settlements" ON public.settlements FOR INSERT
  WITH CHECK (public.is_group_member(group_id));
