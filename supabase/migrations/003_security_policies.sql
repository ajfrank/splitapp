-- Security policies migration
-- Adds row-level security for authorization

-- Ensure RLS is enabled on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Groups policies
-- Users can only see groups they are members of
CREATE POLICY "groups_select" ON public.groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

-- Only authenticated users can create groups
CREATE POLICY "groups_insert" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Only group creator (admin) can update group settings
CREATE POLICY "groups_update" ON public.groups
  FOR UPDATE USING (created_by = auth.uid());

-- Only group creator can delete the group
CREATE POLICY "groups_delete" ON public.groups
  FOR DELETE USING (created_by = auth.uid());

-- Group members policies
-- Users can see members of groups they belong to
CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

-- Users can add themselves to a group (via invite)
CREATE POLICY "group_members_insert" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only admins can remove other members; users can remove themselves
CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );

-- Expenses policies
-- Users can see expenses from their groups
CREATE POLICY "expenses_select" ON public.expenses
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

-- Group members can create expenses
CREATE POLICY "expenses_insert" ON public.expenses
  FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

-- Group members can update expenses (for editing)
CREATE POLICY "expenses_update" ON public.expenses
  FOR UPDATE USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

-- Group members can delete expenses
CREATE POLICY "expenses_delete" ON public.expenses
  FOR DELETE USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

-- Expense splits policies
-- Users can see splits from their group expenses
CREATE POLICY "expense_splits_select" ON public.expense_splits
  FOR SELECT USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    )
  );

-- Group members can create splits
CREATE POLICY "expense_splits_insert" ON public.expense_splits
  FOR INSERT WITH CHECK (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    )
  );

-- Group members can delete splits
CREATE POLICY "expense_splits_delete" ON public.expense_splits
  FOR DELETE USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    )
  );

-- Settlements policies
-- Users can see settlements from their groups
CREATE POLICY "settlements_select" ON public.settlements
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

-- Group members can create settlements
CREATE POLICY "settlements_insert" ON public.settlements
  FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    AND (from_user = auth.uid() OR to_user = auth.uid())
  );

-- Comment explaining the security model
COMMENT ON POLICY "groups_delete" ON public.groups IS 'Only the group creator (admin) can delete the group';
COMMENT ON POLICY "group_members_delete" ON public.group_members IS 'Users can remove themselves; admins can remove anyone';
