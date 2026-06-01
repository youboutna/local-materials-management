## Objectif
Aligner toutes les vues détail (« vues cadres ») sur les règles de `docs/PROMPTS.md` (flux UI → DTO → Service → Adapter → DB, pas de Supabase direct dans React, hooks hexagonaux), corriger un bug bloquant sur `/payment-control`, et fiabiliser l'hydratation des données dans les rapports / PDF.

## 1. Bug fix bloquant — `/payment-control`
`src/pages/PaymentControl.tsx` ligne 192 référence `loading` qui n'est jamais déclaré (seul `useNotificationsHex()` est destructuré ligne 94 sans renommage).
- Récupérer `isLoading` depuis `useNotificationsHex()` et l'aliaser en `loading`, ou remplacer directement l'usage par `isLoading`.
- Vérifier les autres flags (`unreadCount`, etc.) et harmoniser avec le contrat du hook.

## 2. Vues détail manquantes / incohérentes
Auditer puis standardiser ces pages. Toutes doivent : utiliser `AppLayout`, un hook `useXxxHex(id)` (jamais Supabase direct), afficher un skeleton, un état d'erreur, un état vide, des liens croisés (projet, phase, inspection liée, paiement lié), et des badges de déviation via `DeviationEngine` quand pertinent.

| Page | État actuel | Action |
|---|---|---|
| `/inspections/:id` (`InspectionDetail.tsx`) | OK mais layout non `AppLayout`, pas de liens croisés payment/phase | Migrer vers `AppLayout`, ajouter Field links (projet/phase/paiement déclenché) |
| `/payments/:id` (`PaymentDetail.tsx`) | OK récent | Vérifier `paymentMethod` mapping + ajouter bloc blocages/approbations via `usePaymentControlHex` |
| `/tasks/:taskId` (`TaskDetail.tsx`) | Layout custom, pas de liens projet/phase | Ajouter liens croisés + statut via `DeviationEngine` (retard tâche) |
| `/projects/:projectId/phases/:phaseId` (`PhaseDetail.tsx`) | OK structurée mais doublon avec `PhaseDetailsPage` | Garder `PhaseDetail`, supprimer route doublon, vérifier tous les sous-composants reçoivent le DTO enrichi |
| **Tender** détail | **Aucune page** `/tenders/:id` n'existe (App.tsx) | **Créer** `src/pages/TenderDetail.tsx` + route, basée sur `useTenderHex(id)` ; afficher submissions, documents, statut évaluation |
| **Milestone** détail | Aucune page dédiée | **Créer** `src/pages/MilestoneDetail.tsx` + route `/projects/:projectId/milestones/:milestoneId`, utilise `MilestoneService.getEnriched` |
| **TaskAssignment** détail | Confondu avec `TaskDetail` | Confirmer qu'`useTaskAssignmentHex` retourne bien l'assignation enrichie (assignee, phase, due date) et compléter le DTO si nécessaire |

Côté listes (`InspectionMonitoring`, `PaymentCrud`, listes de tâches, jalons, tenders) : vérifier que chaque ligne pointe bien vers ces routes détail via `<Link>` (déjà fait pour inspections/paiements, à compléter pour tender + milestone).

## 3. Rapports & PDF
Les générateurs (`CompactProjectReportGenerator`, `ProjectReportGenerator`, `ReportManager`) consomment déjà `ReportingService.generateCompleteProjectReport`, mais certaines sections sont vides parce que :
- Les KPIs déviation ne passent pas par `DeviationEngine` (calcul inline « today - endDate »).
- Les coûts réels viennent de `project.budget_actual` (souvent null) au lieu de la somme `payment_requests.amount` via `PaymentService`.
- Les jalons listés sont les jalons « plats » sans état d'inspection/paiement associé.

Actions :
- Étendre `ReportingService` avec : `getDeviationSummary(projectId)` (utilise `DeviationEngine` + référentiels `indicator-templates`, `deviation-rules`), `getActualCosts(projectId)` (somme paiements approuvés), `getMilestoneStatusMatrix(projectId)` (joint jalons / inspections / paiements).
- Ajouter ces champs au DTO `ProjectReportDTO`.
- Mettre à jour `CompactProjectReportGenerator.tsx` et le template PDF pour rendre ces nouvelles sections (deviation badges, coûts réels vs planifiés, matrice jalons).
- Edge function `send-project-report` : vérifier qu'elle reçoit bien le DTO complet (pas un `project` brut).

## 4. Vérifications transverses (règles PROMPTS.md)
Pour chaque fichier touché :
- Aucun `import { supabase }` direct dans `src/components/**` ou `src/pages/**` (exceptions documentées : `useAuth`, URL publiques storage).
- Aucun appel React/hook dans `src/application/services/**`.
- Tous les DTOs en `camelCase`, mapping snake_case isolé dans les adapters.
- TanStack Query v5 : pas de `onError`/`onSuccess` sur `useQuery`/`useMutation`.

## Détails techniques
```text
Fix /payment-control:
  const { ..., isLoading: loading } = useNotificationsHex();

Nouvelles routes (App.tsx):
  <Route path="/tenders/:id" element={<TenderDetail />} />
  <Route path="/projects/:projectId/milestones/:milestoneId" element={<MilestoneDetail />} />

Nouveaux fichiers:
  src/pages/TenderDetail.tsx
  src/pages/MilestoneDetail.tsx
  (+ extensions ReportingService, ProjectReportDTO)
```

## Hors scope
- Refonte visuelle des pages existantes.
- Migration des modules legacy (`src/services`, `src/types`) — protégés par mémoire projet.
- Changements de schéma DB (sauf si `milestone_id` requis sur inspections, à confirmer avant).
