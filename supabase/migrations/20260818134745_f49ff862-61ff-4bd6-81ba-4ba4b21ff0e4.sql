CREATE OR REPLACE FUNCTION public.reclamer_admin_initial()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.reclamer_admin_initial() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reclamer_admin_initial() TO authenticated;

CREATE OR REPLACE FUNCTION public.activer_code_magnificat(_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE attendu text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT valeur INTO attendu FROM public.parametres WHERE cle = 'code_inscription_magnificat';
  IF attendu IS NULL OR attendu = '' OR upper(trim(_code)) <> upper(trim(attendu)) THEN RETURN false; END IF;
  UPDATE public.profils SET eleve_magnificat = true, offre = 'magnificat' WHERE id = auth.uid();
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.activer_code_magnificat(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activer_code_magnificat(text) TO authenticated;