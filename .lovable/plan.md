# Extension du cycle de vie DQE → Devis → Contrat → Décompte → Facture

Objectif : étendre l'existant (Stepper, Factur-X, parties, parser) sans rien casser. Aucun composant du cycle n'est réécrit ; on ajoute des états, des permissions, une modale d'en-tête et on nettoie l'UI.

## Sprint 1 — UI & Stepper (P0)

1. **Stepper étendu et cliquable** (`BoqWorkflowStepper.tsx`, conservé)
   - Étapes : `DQE → PUBLICATION AO → DEVIS → CONTRAT → DÉCOMPTE → VALIDATION TECHNIQUE → FACTURE FINALE`.
   - Étape courante déduite du statut du document (logique existante conservée) ; libellés via i18n.
   - Clic sur une étape antérieure = demande de retour arrière (`REOPEN`, `UNPUBLISH`, retour `UNDER_REVIEW`), visible seulement si la permission et la transition inverse existent.
   - Verrouillé (non cliquable) dès `SIGNED`, `INVOICED`, `PAID`.

2. **Suppression des doublons** : la ligne « Statut : Brouillon » et le second rang de badges sont retirés ; le statut n'apparaît que dans le Stepper.

3. **Refonte 4 zones** (`DqeWorkspace.tsx` / `BoqWorkspace.tsx`)
   - Zone 1 Header : titre unique + ligne d'identité (Réf. projet, N° DQE, Émetteur, Destinataire) + `Enregistrer` / `Soumettre`.
   - Zone 2 : Stepper + une seule barre d'actions secondaires (PDF, Envoyer, Signer, Workflow, Réouvrir, Annuler publication).
   - Zone 3 : carte compacte Référentiel (Phase, Jalon, Tâche, Profil fiscal, Responsable).
   - Zone 4 : `+ Ajouter`, `Importer`, `Calcul métré` visibles uniquement en `DRAFT`/`REOPEN` ; totaux en bas ; onglets Comparaison & Suivi budget.

4. **Stabilité** : audit `TooltipProvider` (déjà monté dans `App.tsx`) sur les portails/modales qui montent hors arbre ; accès `/dqe/new`, `/dqe/:id`, `/dqe/list` depuis l'onglet DQE (déjà en place, vérifié).

## Sprint 2 — Workflow inverse, en-tête, TVA, parser (P0)

5. **Workflow inverse** (`BoqWorkflowService.ts`, extension du graphe)
   - Ajout des actions `PUBLISH`, `UNPUBLISH`, `REOPEN`, `REVIEW`, `TECH_VALIDATE`, `CANCEL`.
   - Transitions inverses : `REJECTED → UNDER_REVIEW/RECEIVED`, `PUBLISHED → VALIDATED`, `SUBMITTED → DRAFT`.
   - Déverrouillage des lignes uniquement en `DRAFT`/`REOPEN` (contrôle service, pas UI).

6. **Modale « Modifier l'en-tête »** avant PDF / signature / soumission
   - Champs : Réf. DQE, Devise (MRU), Validité (30 j), TypeCode (310), Date d'émission.
   - Émetteur auto depuis le contexte (organisation/projet), lecture seule par défaut.
   - Destinataires multi-select avec autocomplete sur Organisations / Fournisseurs / Équipe, pré-remplissage NIF + Adresse.
   - Blocage PDF/signature si destinataire, devise ou taux TVA manquant (validation dans le service, message i18n).

7. **PDF Factur-X** (`BoqPdfRenderer.ts`) : correction de la superposition d'en-tête (grille à colonnes fixes, hauteur calculée), liste complète des destinataires. EN 16931 / TypeCode inchangés.

8. **TVA à 3 niveaux** : globale (en-tête) → par catégorie/lot (Travaux, Fourniture, RH) → par ligne. Résolution en cascade dans `BoqCalculatorService`, détection du régime fiscal par le parser.

9. **Parser — logique RH** : détection de postes (Consultant, Technicien, Ouvrier…) → `Nature = RH/prestation`, unités `HJ`, `MOIS`, `FORFAIT` (Qté = 1). Recherche référentiels Matériaux / Équipe / Fournisseurs.

10. **Modale d'import responsive** : défilement interne X/Y, en-têtes sticky, bouton `Importer X lignes` actif seulement si unités + TVA valides, `Annuler` qui vide l'état local sans remonter/recharger la page projet.

## Sprint 3 — Portails & cohérence (P1)

11. **Création de Devis par Prestataire/Consultant** : depuis `/supplier-portal` et `/consultant-portal`, création d'un document type `DEVIS` toujours rattaché au DQE parent + projet, avec génération, signature et soumission.
12. **Validation technique Consultant** sur décomptes et factures, tracée dans le workflow.
13. **Cohérence** : totaux DQE ↔ Suivi budget ↔ doctrine financière ; vérification des transitions du Stepper de bout en bout.

## Notes techniques

- Codes techniques anglais MAJUSCULES sans suffixe (`DRAFT`, `SUBMITTED`, `VALIDATED`, `PUBLISHED`, `UNDER_REVIEW`, `ACCEPTED`, `REJECTED`, `REOPEN`, `UNPUBLISH`, `CANCELLED`) ; libellés FR/EN/AR via `useI18n` uniquement.
- Statuts et actions ajoutés au référentiel de statuts, pas en dur dans l'UI.
- Architecture respectée : règles de transition et validations dans `src/application/services/boq`, persistance via adapters, UI → DTO camelCase, aucun accès Supabase dans les composants.
- Aucun composant existant supprimé : Stepper, Factur-X, `DocumentPartiesDialog`, parser sont étendus.
