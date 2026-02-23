-- Users table (synced from Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  venmo_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group members
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('food', 'transport', 'lodging', 'entertainment', 'other')),
  paid_by UUID NOT NULL REFERENCES public.users(id),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'percentage', 'exact', 'shares')),
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expense splits
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2),
  shares INTEGER,
  UNIQUE(expense_id, user_id)
);

-- Settlements
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES public.users(id),
  to_user UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON public.expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group ON public.settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);

-- Materialized view for group balances
CREATE MATERIALIZED VIEW IF NOT EXISTS public.group_balances AS
SELECT
  e.group_id,
  es.user_id,
  COALESCE(SUM(
    CASE WHEN e.paid_by = es.user_id THEN e.amount ELSE 0 END
  ), 0) - COALESCE(SUM(es.amount), 0)
  + COALESCE(settled_in.total, 0)
  - COALESCE(settled_out.total, 0)
  AS net_balance
FROM public.expense_splits es
JOIN public.expenses e ON e.id = es.expense_id
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(s.amount), 0) AS total
  FROM public.settlements s
  WHERE s.group_id = e.group_id AND s.to_user = es.user_id
) settled_in ON TRUE
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(s.amount), 0) AS total
  FROM public.settlements s
  WHERE s.group_id = e.group_id AND s.from_user = es.user_id
) settled_out ON TRUE
GROUP BY e.group_id, es.user_id, settled_in.total, settled_out.total;

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_balances ON public.group_balances(group_id, user_id);

-- Function to refresh balances
CREATE OR REPLACE FUNCTION public.refresh_group_balances()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.group_balances;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-refresh balances
CREATE OR REPLACE TRIGGER refresh_balances_on_expense
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_group_balances();

CREATE OR REPLACE TRIGGER refresh_balances_on_split
  AFTER INSERT OR UPDATE OR DELETE ON public.expense_splits
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_group_balances();

CREATE OR REPLACE TRIGGER refresh_balances_on_settlement
  AFTER INSERT OR UPDATE OR DELETE ON public.settlements
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_group_balances();

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Users: can read all, update own
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups: members can read
CREATE POLICY "Group members can view groups" ON public.groups FOR SELECT
  USING (id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group admins can update groups" ON public.groups FOR UPDATE
  USING (id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Group members: members can read
CREATE POLICY "Group members can view members" ON public.group_members FOR SELECT
  USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage members" ON public.group_members FOR DELETE
  USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Expenses: group members can CRUD
CREATE POLICY "Group members can view expenses" ON public.expenses FOR SELECT
  USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));
CREATE POLICY "Group members can create expenses" ON public.expenses FOR INSERT
  WITH CHECK (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));
CREATE POLICY "Expense creator can update" ON public.expenses FOR UPDATE
  USING (paid_by = auth.uid());
CREATE POLICY "Expense creator can delete" ON public.expenses FOR DELETE
  USING (paid_by = auth.uid());

-- Expense splits
CREATE POLICY "Group members can view splits" ON public.expense_splits FOR SELECT
  USING (expense_id IN (SELECT id FROM public.expenses WHERE group_id IN
    (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())));
CREATE POLICY "Group members can create splits" ON public.expense_splits FOR INSERT
  WITH CHECK (expense_id IN (SELECT id FROM public.expenses WHERE group_id IN
    (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())));
CREATE POLICY "Split owner can delete" ON public.expense_splits FOR DELETE
  USING (expense_id IN (SELECT id FROM public.expenses WHERE paid_by = auth.uid()));

-- Settlements
CREATE POLICY "Group members can view settlements" ON public.settlements FOR SELECT
  USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));
CREATE POLICY "Group members can create settlements" ON public.settlements FOR INSERT
  WITH CHECK (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow public read of groups by invite code (for join flow)
CREATE POLICY "Anyone can read groups by invite code" ON public.groups FOR SELECT
  USING (true);
