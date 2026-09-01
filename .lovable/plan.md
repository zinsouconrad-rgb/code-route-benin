# Ce qu'il reste à implémenter

## Déjà en place
Auth (inscription, connexion, mot de passe oublié), tableau de bord avec flamme et objectif quotidien, thèmes, entraînement, examen blanc chronométré, révision des erreurs, favoris, signalements, mode hors-ligne, et le back-office complet (questions, validation, signalements, thèmes, import CSV, élèves, réglages/tarifs, stats).

## Reste à faire

### 1. Paiement Mobile Money (FedaPay) — Phase 3, le gros morceau manquant
Aujourd'hui l'accès premium ne peut être accordé que manuellement par l'admin.
- Écran de paiement depuis « Mon accès » : choix de l'offre (lue dans `tarifs`) et du moyen (MTN MoMo, Moov Money, Celtiis Cash).
- Création de la transaction FedaPay côté serveur, redirection vers la page de paiement.
- Webhook public de confirmation : vérification de la signature, écriture dans `paiements`, passage du profil en premium avec `acces_debut` / `acces_expiration` selon `duree_jours`.
- Écran de retour (succès / échec / en attente) et historique des paiements de l'élève.
- Onglet admin « Paiements » : liste des transactions avec statut, moyen, agrégateur.
- Nécessite vos clés marchandes FedaPay (clé publique + clé secrète + secret du webhook).

### 2. Expiration automatique de l'accès
À l'échéance, l'élève doit repasser en gratuit automatiquement (tâche planifiée côté base), pas seulement au calcul côté écran.

### 3. Branding configurable
Nom de l'établissement et logo uploadable, stockés en base et modifiables dans les réglages admin, utilisés dans l'en-tête, la landing page et l'écran de résultat.

### 4. Statistiques et pédagogie
- Courbe de progression dans le temps sur le tableau de bord (aujourd'hui : chiffres et points faibles, pas de graphique).
- Admin : taux de réussite moyen aux examens blancs et revenus (à ajouter une fois les paiements branchés).

### 5. Inspirations du site concurrent (optionnel, à arbitrer)
- Fiches / leçons illustrées sur les panneaux (contenu saisi par l'auto-école, jamais généré).
- Bouton d'assistance WhatsApp.
- Refonte de la landing page : preuve sociale, FAQ, comparatif Gratuit vs Premium.

## Détails techniques
- FedaPay : appel API depuis un `createServerFn`, webhook sous `src/routes/api/public/fedapay.ts` avec vérification HMAC avant toute écriture ; mise à jour du profil via le client admin (le trigger `protege_champs_profil` bloque les écritures non-admin sur `acces`).
- Expiration : fonction SQL + `pg_cron` quotidien qui repasse en `gratuit` les profils dont `acces_expiration < now()`.
- Branding : lignes dans `parametres` (`nom_etablissement`, `logo_url`) + bucket public dédié pour le logo.
- Courbe : agrégation par jour de `sessions_examen`, rendu avec Recharts (déjà disponible).

## Ordre proposé
1. Paiement FedaPay + expiration automatique + onglet admin Paiements
2. Branding configurable
3. Courbe de progression et stats admin
4. Landing page / WhatsApp / fiches panneaux
