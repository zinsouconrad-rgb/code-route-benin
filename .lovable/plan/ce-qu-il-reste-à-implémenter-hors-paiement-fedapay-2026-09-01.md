# Ce qu'il reste à implémenter (hors paiement FedaPay)

Le paiement Mobile Money est mis de côté pour le moment : l'accès premium continue d'être accordé manuellement par l'admin (onglet Élèves) ou via le code LE MAGNIFICAT.

## 1. Expiration automatique de l'accès
À l'échéance, l'élève doit repasser en gratuit automatiquement, pas seulement au calcul d'affichage.
- Fonction en base qui repasse en « gratuit » les profils dont la date d'expiration est passée, exécutée chaque jour.

## 2. Branding configurable
- Nom de l'établissement et logo modifiables depuis les Réglages admin (upload du logo).
- Utilisés dans l'en-tête, la page d'accueil publique et les écrans de résultat.

## 3. Courbe de progression sur le tableau de bord
- Graphique de l'évolution du taux de réussite sur les 30 derniers jours (aujourd'hui il n'y a que des chiffres et les points faibles).

## 4. Statistiques admin complétées
- Taux de réussite moyen aux examens blancs.
- Nombre d'élèves actifs sur 7 / 30 jours.

## 5. Améliorations inspirées de la concurrence
- Refonte de la page d'accueil publique : comparatif Gratuit vs Accès complet, FAQ, réassurance.
- Bouton d'assistance WhatsApp (numéro configurable dans les réglages).
- Écran « Fiches / panneaux » : fiches pédagogiques illustrées saisies par l'auto-école (aucun contenu inventé), avec CRUD admin.

## Détails techniques
- Expiration : fonction SQL `expirer_acces()` + planification quotidienne `pg_cron`.
- Branding et WhatsApp : nouvelles clés dans `parametres` (`nom_etablissement`, `logo_url`, `whatsapp_numero`) + bucket public `branding` pour le logo ; hook de lecture partagé.
- Courbe : agrégation par jour des `sessions_examen` de l'élève, rendu avec Recharts (déjà installé).
- Fiches : nouvelle table `fiches` (titre, contenu, image, thème, ordre, statut de validation) avec RLS — lecture publique des fiches validées, écriture réservée aux admins ; route élève `/fiches` et onglet admin.

## Ordre de réalisation
1. Expiration automatique
2. Branding configurable + bouton WhatsApp
3. Courbe de progression + stats admin
4. Refonte de la page d'accueil
5. Fiches / panneaux (élève + admin)
