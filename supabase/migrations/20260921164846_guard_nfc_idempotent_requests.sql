-- Retries return the first result; the receipt and time booking commit atomically.
create table guard_private.nfc_requests (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 org_id uuid not null references public.guard_organizations(id) on delete cascade,
 token_hash text not null,
 shift_id uuid,
 result jsonb not null,
 created_at timestamptz not null default now(),
 primary key(user_id,request_id)
);
revoke all on guard_private.nfc_requests from public,anon,authenticated;
alter table guard_private.nfc_requests enable row level security;
create function guard_private.clock_nfc_once(p_token text,p_request_id uuid,p_shift uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); token text:=trim(coalesce(p_token,'')); digest text;
 receipt guard_private.nfc_requests%rowtype; result jsonb; org uuid;
begin
 if uid is null then raise exception 'authentication required'; end if;
 if p_request_id is null then raise exception 'request ID required'; end if;
 if token like 'AONE-CLOCK:%' then token:=substr(token,12); end if;
 if token='' then raise exception 'NFC token missing'; end if;
 digest:=encode(extensions.digest(token,'sha256'),'hex');
 -- Serialize retries, including requests arriving before the original commits.
 perform pg_advisory_xact_lock(hashtextextended(uid::text||':'||p_request_id::text,0));
 select * into receipt from guard_private.nfc_requests where user_id=uid and request_id=p_request_id;
 if found then
  if receipt.token_hash<>digest or receipt.shift_id is distinct from p_shift then raise exception 'request ID already used for another booking'; end if;
  if not guard_private.is_member(receipt.org_id,uid) then raise exception 'membership required'; end if;
  return receipt.result;
 end if;
 result:=public.guard_clock_nfc_auto(token,p_shift);
 select org_id into org from public.guard_sites where id=(result->>'site_id')::uuid;
 insert into guard_private.nfc_requests(user_id,request_id,org_id,token_hash,shift_id,result)
 values(uid,p_request_id,org,digest,p_shift,result);
 return result;
end $$;
revoke all on function guard_private.clock_nfc_once(text,uuid,uuid) from public,anon;
grant execute on function guard_private.clock_nfc_once(text,uuid,uuid) to authenticated;
create function public.guard_clock_nfc_once(p_token text,p_request_id uuid,p_shift uuid default null)
returns jsonb language sql security invoker set search_path='' as $$
 select guard_private.clock_nfc_once(p_token,p_request_id,p_shift);
$$;
revoke all on function public.guard_clock_nfc_once(text,uuid,uuid) from public,anon;
grant execute on function public.guard_clock_nfc_once(text,uuid,uuid) to authenticated;
