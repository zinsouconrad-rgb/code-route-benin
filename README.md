# Code Route Benin

CONTEXTE ET OBJECTIF

Tu es chargé de développer une application web (mobile-first) d'entraînement au Code de la route béninois, portée par l'auto-école LE MAGNIFICAT. L'application permet aux candidats au permis de conduire de s'entraîner avec des QCM illustrés d'images (panneaux, situations de conduite), de passer des examens blancs chronométrés, et de suivre leur progression.

Public : candidats béninois au permis, majoritairement sur smartphone Android, souvent en connexion limitée. Langue de l'interface : français. L'application doit être rapide, légère et fonctionner correctement en 3G.

⚠️ RÈGLE ABSOLUE SUR L'EXACTITUDE DU CONTENU — À RESPECTER STRICTEMENT

L'exactitude du contenu est vitale : une seule réponse fausse peut faire échouer un élève à l'examen. Par conséquent :

Tu ne dois JAMAIS inventer, générer ou deviner de questions, de réponses, de panneaux ou de règles du Code de la route béninois. Tu ne connais pas le contenu officiel béninois et tu ne dois pas le simuler.

Tout le contenu pédagogique réel sera saisi et validé par l'auto-école via le back-office d'administration que tu vas construire. Ton travail est de construire la plateforme et le moteur, pas d'écrire les questions.

Tu peux créer au maximum 5 à 8 questions d'EXEMPLE uniquement pour démontrer l'interface. Ces exemples doivent :

porter le statut a_valider (jamais valide),

afficher visiblement la mention « EXEMPLE DE DÉMONSTRATION — CONTENU NON OFFICIEL À REMPLACER »,

ne jamais être visibles par un élève tant qu'un administrateur ne les a pas validés.

Seules les questions au statut valide sont visibles par les élèves. Les statuts brouillon et a_valider restent invisibles côté apprenant.

Chaque question doit stocker un champ source (référence de l'origine officielle, ex. « Code de la route Bénin, thème X ») que l'administrateur remplit.

Prévois un mécanisme de signalement d'erreur côté élève et un écran de modération côté admin (voir plus bas). C'est un garde-fou essentiel.

En résumé : plateforme fiable + circuit de validation strict + contenu saisi par l'humain. Ne prends aucune initiative sur le contenu du code lui-même.

STACK TECHNIQUE

React + Vite + TypeScript + Tailwind CSS + shadcn/ui.

Supabase pour : base de données (PostgreSQL), authentification, stockage des images (bucket Supabase Storage), et règles de sécurité (RLS).

Design mobile-first, composants accessibles, mode clair par défaut (option sombre appréciée).

Optimisation des images (compression, lazy-loading) pour la connexion mobile.

MODÈLE DE DONNÉES (Supabase)

Crée les tables suivantes avec des politiques RLS appropriées :

profils : id (lié à auth.users), nom_complet, telephone, role (eleve | admin), eleve_magnificat (booléen — élève inscrit à l'auto-école LE MAGNIFICAT, accès complet offert), acces (gratuit | premium), offre (aucune | pack_permis | mensuel | magnificat), acces_debut, acces_expiration, date_inscription.

categories (thèmes du code) : id, nom, description, icone, ordre_affichage.

questions : id, categorie_id, enonce (texte), image_url (nullable), type (choix_unique | choix_multiple | vrai_faux), difficulte (facile | moyen | difficile), explication (correction affichée après réponse), statut_validation (brouillon | a_valider | valide), source, cree_par, valide_par, date_creation, date_validation.

reponses (options d'une question) : id, question_id, texte, image_url (nullable), est_correcte (booléen), ordre.

sessions_examen : id, user_id, mode (entrainement | examen_blanc), categorie_id (nullable), score, nombre_questions, duree_secondes, reussi (booléen), date.

reponses_utilisateur : id, session_id, question_id, reponse_donnee (ids des options choisies), est_correcte.

progression : id, user_id, categorie_id, questions_tentees, questions_reussies, taux_reussite.

favoris : id, user_id, question_id.

signalements : id, question_id, user_id, motif, statut (ouvert | traite), date.

parametres : table clé/valeur pour les réglages de l'examen blanc (nombre de questions, durée, seuil de réussite) et les quotas du mode gratuit (nombre de questions gratuites par thème, nombre d'examens blancs gratuits) — modifiables par l'admin, non codés en dur, car ils doivent correspondre au format officiel de l'examen béninois.

tarifs : id, code (pack_permis | mensuel), libelle, prix_fcfa, duree_jours, actif. Modifiable par l'admin (les prix ne sont jamais codés en dur — ils seront ajustés lors des tests).

paiements : id, user_id, tarif_code, montant_fcfa, moyen (mtn_momo | moov_money | celtiis_cash), agregateur (fedapay | paydunya), reference_transaction, statut (en_attente | reussi | echoue), date.

FONCTIONNALITÉS CÔTÉ ÉLÈVE

Inscription / connexion (email + mot de passe via Supabase Auth), avec profil (nom, téléphone).

Accueil / tableau de bord : branding LE MAGNIFICAT, bouton « Continuer l'entraînement », statistiques personnelles (taux de réussite global, thèmes faibles), accès rapide à l'examen blanc.

Entraînement par thème : l'élève choisit une catégorie et enchaîne les questions validées de ce thème.

Entraînement aléatoire : questions tirées de tous les thèmes.

Affichage d'une question : énoncé, image si présente (bien lisible sur mobile), options en QCM. Support des trois types : choix unique, choix multiple (l'élève doit cocher toutes les bonnes réponses), vrai/faux.

Correction immédiate après validation : indiquer les bonnes/mauvaises réponses et afficher l'explication. Prévoir aussi un mode « correction en fin de série » (option).

Examen blanc : X questions tirées au sort (X, durée et seuil de réussite lus depuis la table parametres), chronomètre, pas de correction pendant l'épreuve, puis écran de résultat (réussi/échoué, score, temps, révision des erreurs).

Révision des erreurs : rejouer uniquement les questions ratées.

Favoris / à revoir : marquer des questions difficiles.

Statistiques et progression : par thème, courbe de progression, points faibles mis en avant.

Signaler une erreur : sur chaque question, un bouton « Signaler » (motif libre) qui crée un enregistrement dans signalements. Essentiel pour la qualité du contenu.

Mon accès : écran indiquant l'offre en cours (gratuit / Pack Permis / mensuel / élève LE MAGNIFICAT) et la date d'expiration. Pour un utilisateur gratuit qui atteint une limite, afficher un écran d'invitation à passer premium présentant la grille tarifaire (voir « Modèle économique »).

MODÈLE ÉCONOMIQUE ET TARIFS (freemium)

L'application fonctionne en freemium : une partie gratuite pour convertir, un accès complet payant. Deux publics distincts :

A. Élèves inscrits chez LE MAGNIFICAT — accès complet offert, sans paiement. Identifiés par le champ eleve_magnificat (activé par l'admin, ou via un code d'inscription fourni par l'auto-école). C'est un avantage commercial de l'école, pas une source de revenu direct.

B. Grand public (candidats libres, élèves d'autres auto-écoles) — accès payant en mobile money. Grille tarifaire (stockée dans la table tarifs, modifiable en admin, jamais codée en dur) :

FormulePrixAccèsDécouverte (gratuit)0 FCFA10 à 15 questions par thème + 1 examen blancPack Permis (offre phare)2 500 FCFAAccès complet illimité pendant 90 jours, paiement uniqueAbonnement mensuel1 000 FCFA / moisAccès complet, renouvelable

Règles de gating à appliquer côté élève :

Utilisateur acces = gratuit : limité aux quotas Découverte (valeurs lues dans parametres). Au-delà, écran d'invitation à passer premium.

Utilisateur acces = premium non expiré OU eleve_magnificat = true : accès complet, sans restriction.

À l'échéance de acces_expiration, repasser automatiquement l'utilisateur en gratuit.

Encaissement (voir phase dédiée) : mobile money (MTN MoMo, Moov Money, Celtiis Cash) via un agrégateur (FedaPay ou PayDunya). À la confirmation du paiement, mettre à jour acces, offre, acces_debut, acces_expiration sur le profil et enregistrer une ligne dans paiements.

BACK-OFFICE ADMINISTRATEUR (accès réservé au rôle admin)

Gestion des questions (CRUD) : créer, modifier, dupliquer, supprimer. Formulaire complet : énoncé, upload d'image (vers Supabase Storage), type, catégorie, difficulté, options de réponse (ajout/suppression dynamique, case « correcte »), explication, source.

Circuit de validation : chaque question a un statut brouillon → a_valider → valide. Une vue « File de validation » liste les questions a_valider ; l'admin relit et passe en valide (en enregistrant valide_par et la date). Rappel : seules les valide sont visibles des élèves.

Import en masse (optionnel, phase 2) : import CSV de questions pour accélérer la saisie, importées au statut a_valider.

Gestion des catégories/thèmes : CRUD, ordre d'affichage, icône.

Modération des signalements : liste des questions signalées par les élèves, avec accès direct à l'édition et bouton « Marquer comme traité ».

Paramètres de l'examen blanc et du mode gratuit : nombre de questions, durée, seuil de réussite, ainsi que les quotas gratuits (questions par thème, examens blancs offerts) — modifiables ici.

Gestion des tarifs : modifier les prix et durées des formules (Pack Permis, mensuel), activer/désactiver une offre. Aucun prix n'est codé en dur.

Gestion des accès élèves : rechercher un élève, activer/désactiver le statut eleve_magnificat (accès offert), ou accorder manuellement un accès premium (utile avant la mise en place du paiement en ligne). Génération/gestion d'un code d'inscription LE MAGNIFICAT.

Suivi des paiements : liste des transactions (paiements) avec statut, moyen et agrégateur.

Statistiques d'usage : nombre d'élèves, questions les plus ratées, taux de réussite moyen aux examens blancs, revenus.

DESIGN ET IDENTITÉ

Marque LE MAGNIFICAT — Auto-École. Prévois un emplacement de logo (uploadable) et un nom d'établissement configurables.

Palette professionnelle et rassurante (bleu/vert de confiance), bon contraste, gros boutons adaptés au tactile.

Interface épurée, hiérarchie claire, feedback visuel immédiat (vert = correct, rouge = incorrect).

Français, ton pédagogique et encourageant.

CONTENU DE DÉMONSTRATION (rappel)

Insère uniquement 5 à 8 questions d'EXEMPLE, au statut a_valider, clairement étiquetées « CONTENU NON OFFICIEL À REMPLACER », réparties sur 2–3 thèmes génériques (ex. « Signalisation », « Priorités », « Règles générales ») afin de démontrer l'interface. Ne les rends jamais visibles côté élève sans validation admin. Ne complète pas ces exemples par du contenu inventé supplémentaire.

ORDRE DE CONSTRUCTION (priorités)

Phase 1 (cœur) : auth + modèle de données + affichage/réponse aux questions + entraînement par thème + correction/explication + back-office CRUD questions + circuit de validation + gating freemium (accès gratuit vs premium, statut élève LE MAGNIFICAT). À ce stade, l'admin active manuellement l'accès premium et le statut eleve_magnificat : pas encore de paiement en ligne, mais toute la logique de restriction gratuit/premium doit fonctionner.

Phase 2 : examen blanc chronométré + statistiques/progression + révision des erreurs + favoris + signalements + modération + gestion des tarifs et des accès en admin.

Phase 3 : intégration du paiement mobile money via un agrégateur (FedaPay ou PayDunya) pour automatiser le passage en premium (MTN MoMo, Moov Money, Celtiis Cash), avec mise à jour du profil et enregistrement dans paiements ; puis import CSV en masse et mode hors-ligne partiel. Construire le paiement en dernier, une fois le contenu validé et l'app éprouvée.

CE QU'IL NE FAUT PAS FAIRE

Ne pas inventer de questions, réponses, panneaux ou règles du code béninois.

Ne pas afficher aux élèves du contenu non valide.

Ne pas coder en dur le format de l'examen (nombre de questions/durée/seuil) : passe par la table parametres.

Ne pas utiliser localStorage pour des données critiques : tout passe par Supabase.

Ne pas surcharger l'interface : priorité à la rapidité sur mobile en connexion limitée.

Ne pas donner l'accès complet à un utilisateur gratuit : respecter strictement les quotas et le gating premium.

Ne pas coder les prix en dur : ils vivent dans la table tarifs, modifiables en admin.

Construis d'abord la Phase 1 de manière propre et fonctionnelle, puis arrête-toi et résume ce qui a été fait avant de continuer.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5643957e-7d10-444b-9fb3-bc5c739128b6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
