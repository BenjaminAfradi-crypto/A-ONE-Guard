CREATE OR REPLACE FUNCTION public.guard_create_site_nfc_tag(p_site uuid, p_label text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
  v_raw text;
  v_hash text;
  v_id uuid;
begin
  select org_id into v_org from public.guard_sites where id=p_site;
  if v_org is null or not guard_private.can_hr(v_org,v_uid) then raise exception 'not allowed'; end if;
  v_raw := encode(extensions.gen_random_bytes(24),'hex');
  v_hash := encode(extensions.digest(v_raw,'sha256'),'hex');
  insert into public.guard_site_nfc_tags(org_id,site_id,token_hash,label,created_by)
  values(v_org,p_site,v_hash,nullif(trim(coalesce(p_label,'')),''),v_uid)
  returning id into v_id;
  return jsonb_build_object(
    'id',v_id,
    'token',v_raw,
    'payload','AONE-CLOCK:'||v_raw,
    'path','/nfc.html?t='||v_raw
  );
end
$function$
;
