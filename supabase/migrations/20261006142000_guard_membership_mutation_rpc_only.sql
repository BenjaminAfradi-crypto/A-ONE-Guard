-- Membership role/active changes must go through guarded SECURITY DEFINER RPCs.
-- Direct table DML let an admin bypass guard_set_member_role/guard_set_member_active
-- and alter an owner account through PostgREST.

drop policy if exists guard_members_manage on public.guard_memberships;

revoke insert, update, delete on table public.guard_memberships from authenticated;

-- Read access remains governed by guard_members_select.
-- Mutations remain available through guarded SECURITY DEFINER functions such as:
-- guard_create_organization, guard_join_organization,
-- guard_set_member_role and guard_set_member_active.
