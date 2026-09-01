-- 1. Expiration automatique des accès premium
CREATE OR REPLACE FUNCTION public.expirer_acces()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  UPDATE public.profils
  SET acces = 'gratuit', offre = 'aucune'
  WHERE eleve_magnificat = false
    AND acces = 'premium'
    AND acces_expiration IS NOT NULL
    AND acces_expiration < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.schedule('expirer-acces-quotidien', '0 2 * * *', $$SELECT public.expirer_acces();$$)
WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expirer-acces-quotidien');

-- 2. Fiches pédagogiques
CREATE TABLE public.fiches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  titre text NOT NULL,
  contenu text NOT NULL DEFAULT '',
  image_url text,
  source text,
  ordre_affichage integer NOT NULL DEFAULT 0,
  statut_validation statut_validation NOT NULL DEFAULT 'brouillon',
  cree_par uuid REFERENCES auth.users(id),
  date_creation timestamptz NOT NULL DEFAULT now(),
  maj timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.fiches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiches TO authenticated;
GRANT ALL ON public.fiches TO service_role;

ALTER TABLE public.fiches ENABLE ROW LEVEL SECURITY;

CREATE POLICY fiches_publiques ON public.fiches
  FOR SELECT USING (statut_validation = 'valide');

CREATE POLICY fiches_admin_select ON public.fiches
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY fiches_admin_write ON public.fiches
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.maj_fiches()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.maj = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_maj_fiches BEFORE UPDATE ON public.fiches
FOR EACH ROW EXECUTE FUNCTION public.maj_fiches();