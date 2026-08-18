-- ENUMS
CREATE TYPE public.app_role AS ENUM ('eleve','admin');
CREATE TYPE public.type_question AS ENUM ('choix_unique','choix_multiple','vrai_faux');
CREATE TYPE public.difficulte_question AS ENUM ('facile','moyen','difficile');
CREATE TYPE public.statut_validation AS ENUM ('brouillon','a_valider','valide');
CREATE TYPE public.type_acces AS ENUM ('gratuit','premium');
CREATE TYPE public.type_offre AS ENUM ('aucune','pack_permis','mensuel','magnificat');
CREATE TYPE public.mode_session AS ENUM ('entrainement','examen_blanc');
CREATE TYPE public.statut_signalement AS ENUM ('ouvert','traite');
CREATE TYPE public.moyen_paiement AS ENUM ('mtn_momo','moov_money','celtiis_cash');
CREATE TYPE public.agregateur_paiement AS ENUM ('fedapay','paydunya');
CREATE TYPE public.statut_paiement AS ENUM ('en_attente','reussi','echoue');

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "roles_select_self" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PROFILS
CREATE TABLE public.profils (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_complet text NOT NULL DEFAULT '',
  telephone text,
  eleve_magnificat boolean NOT NULL DEFAULT false,
  acces public.type_acces NOT NULL DEFAULT 'gratuit',
  offre public.type_offre NOT NULL DEFAULT 'aucune',
  acces_debut timestamptz,
  acces_expiration timestamptz,
  date_inscription timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profils TO authenticated;
GRANT ALL ON public.profils TO service_role;
ALTER TABLE public.profils ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profils_select" ON public.profils FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profils_insert_self" ON public.profils FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profils_update" ON public.profils FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.protege_champs_profil()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    NEW.eleve_magnificat := OLD.eleve_magnificat;
    NEW.acces := OLD.acces;
    NEW.offre := OLD.offre;
    NEW.acces_debut := OLD.acces_debut;
    NEW.acces_expiration := OLD.acces_expiration;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_protege_profil BEFORE UPDATE ON public.profils FOR EACH ROW EXECUTE FUNCTION public.protege_champs_profil();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profils (id, nom_complet, telephone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nom_complet',''), NEW.raw_user_meta_data->>'telephone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'eleve') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ACCES EFFECTIF
CREATE OR REPLACE FUNCTION public.a_acces_complet(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profils p
    WHERE p.id = _user_id
      AND (p.eleve_magnificat = true
        OR (p.acces = 'premium' AND (p.acces_expiration IS NULL OR p.acces_expiration > now())))
  )
$$;

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text,
  icone text,
  ordre_affichage integer NOT NULL DEFAULT 0,
  date_creation timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_lecture" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- QUESTIONS
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  enonce text NOT NULL,
  image_url text,
  type public.type_question NOT NULL DEFAULT 'choix_unique',
  difficulte public.difficulte_question NOT NULL DEFAULT 'moyen',
  explication text,
  statut_validation public.statut_validation NOT NULL DEFAULT 'brouillon',
  source text,
  cree_par uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  valide_par uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  date_creation timestamptz NOT NULL DEFAULT now(),
  date_validation timestamptz
);
GRANT SELECT ON public.questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_valides_publiques" ON public.questions FOR SELECT USING (statut_validation = 'valide');
CREATE POLICY "questions_admin_select" ON public.questions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "questions_admin_write" ON public.questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- REPONSES
CREATE TABLE public.reponses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  texte text NOT NULL,
  image_url text,
  est_correcte boolean NOT NULL DEFAULT false,
  ordre integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.reponses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reponses TO authenticated;
GRANT ALL ON public.reponses TO service_role;
ALTER TABLE public.reponses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reponses_questions_valides" ON public.reponses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.statut_validation = 'valide')
);
CREATE POLICY "reponses_admin_select" ON public.reponses FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "reponses_admin_write" ON public.reponses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SESSIONS
CREATE TABLE public.sessions_examen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode public.mode_session NOT NULL DEFAULT 'entrainement',
  categorie_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  score integer NOT NULL DEFAULT 0,
  nombre_questions integer NOT NULL DEFAULT 0,
  duree_secondes integer NOT NULL DEFAULT 0,
  reussi boolean NOT NULL DEFAULT false,
  date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions_examen TO authenticated;
GRANT ALL ON public.sessions_examen TO service_role;
ALTER TABLE public.sessions_examen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_self" ON public.sessions_examen FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid());

-- REPONSES UTILISATEUR
CREATE TABLE public.reponses_utilisateur (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions_examen(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  reponse_donnee uuid[] NOT NULL DEFAULT '{}',
  est_correcte boolean NOT NULL DEFAULT false,
  date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reponses_utilisateur TO authenticated;
GRANT ALL ON public.reponses_utilisateur TO service_role;
ALTER TABLE public.reponses_utilisateur ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rep_util_self" ON public.reponses_utilisateur FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.sessions_examen s WHERE s.id = session_id AND (s.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.sessions_examen s WHERE s.id = session_id AND s.user_id = auth.uid()));

-- PROGRESSION
CREATE TABLE public.progression (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categorie_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  questions_tentees integer NOT NULL DEFAULT 0,
  questions_reussies integer NOT NULL DEFAULT 0,
  taux_reussite numeric NOT NULL DEFAULT 0,
  maj timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, categorie_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progression TO authenticated;
GRANT ALL ON public.progression TO service_role;
ALTER TABLE public.progression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progression_self" ON public.progression FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid());

-- FAVORIS
CREATE TABLE public.favoris (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favoris TO authenticated;
GRANT ALL ON public.favoris TO service_role;
ALTER TABLE public.favoris ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favoris_self" ON public.favoris FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- SIGNALEMENTS
CREATE TABLE public.signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motif text NOT NULL,
  statut public.statut_signalement NOT NULL DEFAULT 'ouvert',
  date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.signalements TO authenticated;
GRANT UPDATE, DELETE ON public.signalements TO authenticated;
GRANT ALL ON public.signalements TO service_role;
ALTER TABLE public.signalements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signalements_insert_self" ON public.signalements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "signalements_select" ON public.signalements FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "signalements_admin" ON public.signalements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PARAMETRES
CREATE TABLE public.parametres (
  cle text PRIMARY KEY,
  valeur text NOT NULL,
  libelle text,
  maj timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.parametres TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parametres TO authenticated;
GRANT ALL ON public.parametres TO service_role;
ALTER TABLE public.parametres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parametres_lecture" ON public.parametres FOR SELECT USING (true);
CREATE POLICY "parametres_admin" ON public.parametres FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- TARIFS
CREATE TABLE public.tarifs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  libelle text NOT NULL,
  prix_fcfa integer NOT NULL DEFAULT 0,
  duree_jours integer NOT NULL DEFAULT 30,
  actif boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.tarifs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarifs TO authenticated;
GRANT ALL ON public.tarifs TO service_role;
ALTER TABLE public.tarifs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tarifs_lecture" ON public.tarifs FOR SELECT USING (true);
CREATE POLICY "tarifs_admin" ON public.tarifs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PAIEMENTS
CREATE TABLE public.paiements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarif_code text NOT NULL,
  montant_fcfa integer NOT NULL DEFAULT 0,
  moyen public.moyen_paiement,
  agregateur public.agregateur_paiement,
  reference_transaction text,
  statut public.statut_paiement NOT NULL DEFAULT 'en_attente',
  date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.paiements TO authenticated;
GRANT ALL ON public.paiements TO service_role;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paiements_select" ON public.paiements FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "paiements_admin" ON public.paiements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- DONNEES INITIALES
INSERT INTO public.parametres (cle, valeur, libelle) VALUES
  ('examen_nombre_questions','30','Nombre de questions de l''examen blanc'),
  ('examen_duree_minutes','30','Durée de l''examen blanc (minutes)'),
  ('examen_seuil_reussite','80','Seuil de réussite (% de bonnes réponses)'),
  ('gratuit_questions_par_theme','10','Questions gratuites par thème'),
  ('gratuit_examens_blancs','1','Examens blancs offerts en mode gratuit'),
  ('nom_etablissement','LE MAGNIFICAT','Nom de l''auto-école'),
  ('logo_url','','URL du logo de l''auto-école'),
  ('code_inscription_magnificat','MAGNIFICAT2026','Code d''inscription élève LE MAGNIFICAT');

INSERT INTO public.tarifs (code, libelle, prix_fcfa, duree_jours, actif) VALUES
  ('pack_permis','Pack Permis',2500,90,true),
  ('mensuel','Abonnement mensuel',1000,30,true);

INSERT INTO public.categories (nom, description, icone, ordre_affichage) VALUES
  ('Signalisation','Thème générique à compléter par l''auto-école','SignpostBig',1),
  ('Priorités','Thème générique à compléter par l''auto-école','TriangleAlert',2),
  ('Règles générales','Thème générique à compléter par l''auto-école','BookOpen',3);

-- QUESTIONS D'EXEMPLE (NON OFFICIELLES, STATUT a_valider)
WITH c AS (SELECT id, nom FROM public.categories),
q AS (
  INSERT INTO public.questions (categorie_id, enonce, type, difficulte, explication, statut_validation, source)
  SELECT c.id, e.enonce, e.type::public.type_question, e.diff::public.difficulte_question, e.expl, 'a_valider', 'EXEMPLE DE DÉMONSTRATION — CONTENU NON OFFICIEL À REMPLACER'
  FROM (VALUES
    ('Signalisation','[EXEMPLE — CONTENU NON OFFICIEL À REMPLACER] Question de démonstration n°1 : remplacer cet énoncé par une question officielle.','choix_unique','facile','[EXEMPLE] Remplacer cette explication par la correction officielle.'),
    ('Signalisation','[EXEMPLE — CONTENU NON OFFICIEL À REMPLACER] Question de démonstration n°2 : remplacer cet énoncé par une question officielle.','choix_multiple','moyen','[EXEMPLE] Remplacer cette explication par la correction officielle.'),
    ('Priorités','[EXEMPLE — CONTENU NON OFFICIEL À REMPLACER] Question de démonstration n°3 : remplacer cet énoncé par une question officielle.','vrai_faux','facile','[EXEMPLE] Remplacer cette explication par la correction officielle.'),
    ('Priorités','[EXEMPLE — CONTENU NON OFFICIEL À REMPLACER] Question de démonstration n°4 : remplacer cet énoncé par une question officielle.','choix_unique','moyen','[EXEMPLE] Remplacer cette explication par la correction officielle.'),
    ('Règles générales','[EXEMPLE — CONTENU NON OFFICIEL À REMPLACER] Question de démonstration n°5 : remplacer cet énoncé par une question officielle.','vrai_faux','difficile','[EXEMPLE] Remplacer cette explication par la correction officielle.'),
    ('Règles générales','[EXEMPLE — CONTENU NON OFFICIEL À REMPLACER] Question de démonstration n°6 : remplacer cet énoncé par une question officielle.','choix_unique','facile','[EXEMPLE] Remplacer cette explication par la correction officielle.')
  ) AS e(cat, enonce, type, diff, expl)
  JOIN c ON c.nom = e.cat
  RETURNING id, type
)
INSERT INTO public.reponses (question_id, texte, est_correcte, ordre)
SELECT q.id, r.texte, r.ok, r.ordre
FROM q
CROSS JOIN LATERAL (
  SELECT * FROM (VALUES
    ('[EXEMPLE] Option A à remplacer', true, 1),
    ('[EXEMPLE] Option B à remplacer', false, 2),
    ('[EXEMPLE] Option C à remplacer', false, 3),
    ('[EXEMPLE] Option D à remplacer', false, 4)
  ) AS v(texte, ok, ordre)
  WHERE q.type <> 'vrai_faux'
  UNION ALL
  SELECT * FROM (VALUES
    ('Vrai', true, 1),
    ('Faux', false, 2)
  ) AS w(texte, ok, ordre)
  WHERE q.type = 'vrai_faux'
) AS r;