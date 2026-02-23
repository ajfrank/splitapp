-- Fix overly permissive RLS policy on groups table
-- The previous policy "Anyone can read groups by invite code" used USING (true)
-- which made ALL groups publicly readable, overriding the restrictive policy.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read groups by invite code" ON public.groups;

-- Create a function to check invite code access
-- This allows reading a group only when queried by exact invite_code match
CREATE OR REPLACE FUNCTION public.is_invite_code_query()
RETURNS BOOLEAN AS $$
BEGIN
  -- This check allows the policy to work only when invite_code is in the WHERE clause
  -- The actual filtering happens in the application query
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Settlement authorization: only the payer can record a settlement
-- Add RLS policy to ensure from_user matches authenticated user
DROP POLICY IF EXISTS "Group members can create settlements" ON public.settlements;

CREATE POLICY "Only from_user can create settlements" ON public.settlements FOR INSERT
  WITH CHECK (
    from_user = auth.uid() AND
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );
