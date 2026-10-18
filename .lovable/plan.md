# Cohérence métier et plannings génériques pilotés par référentiels

## Résultat attendu

Unifier Consommations, Dépenses et Recettes autour des circuits existants, sans double comptage, et générer/importer des plannings variés selon leurs référentiels métier, avec lecture retour.

Périmètre : tous les manquements de l’audit précédent. Les autres chantiers historiques ne seront pas déclarés terminés par ce lot.

**Principe directeur :** tout comportement métier est paramétrable par référentiels, jamais codé en dur. Le planning fourni est un cas illustratif, pas un modèle obligatoire. Phases, durées, profils, charges, circuits, seuils et obligations varient selon métier, réglementation, entité et projet.

**Réutilisation avant création :** une nouvelle page ou un nouveau parcours est d’abord une autre présentation/composition des mêmes données et actions. Aucun nouveau moteur, workflow, module ou stockage concurrent pour une capacité existante. Étendre seulement les contrats ou capacités réellement manquants, avec justification explicite.

## 1. Sources métier et rapprochement

- Réutiliser les lignes DQE/devis/contrats/factures dans `btp.boq_lines`, les décomptes dans `btp.progress_invoices`, les règlements dans `btp.payments` et les services correspondants.
- Conserver les opérations historiques : les afficher comme saisies complémentaires à rapprocher, sans les ajouter automatiquement aux coûts validés ou aux encaissements.
- Sélectionner projet, phase, tâche, ressource, document et ligne par identifiants réels, avec recherche et aperçu.
- Prévoir le rapprochement, le détachement contrôlé et le diagnostic des références manquantes. Une opération déjà représentée par une facture ou un décompte n’est pas comptée deux fois.
- Distinguer les sources, leur statut et leur date métier ; ne pas confondre une date de saisie avec une date de consommation, validation ou règlement.

## 2. Consommations et circuits selon contexte

- Résoudre le circuit applicable depuis le référentiel associé au projet : étapes, prérequis, acteurs et pièces. Exemple achat : besoin → validation → devis/commande → réception → consommation → facture/décompte → règlement ; ce n’est pas une séquence universelle imposée.
- Stock disponible : sélectionner la ressource et enregistrer l’utilisation réelle sans imposer une nouvelle expression de besoin. Distinguer réception, disponibilité et utilisation ; une quantité livrée n’est pas automatiquement consommée.
- Main-d’œuvre : sélectionner l’expert/l’affectation, saisir les jours ou heures réellement effectués, les faire valider et les relier à la prestation facturée si applicable.
- Équipement : saisir l’utilisation réelle et son unité, avec rattachement à la tâche et au contrat/location si applicable.
- Autoriser les consommations partielles et répétées avec leurs dates ; prévenir les doubles envois, vérifier les unités, les quantités restantes et les associations projet/phase/tâche côté serveur.
- Afficher planifié, réalisé, restant et écart par ressource et période. Une valorisation estimative reste distincte d’une dépense validée. L’absence de tarif donne un coût non renseigné, jamais un tarif inventé.
- Fournir ajout, modification, validation et annulation selon le statut ; une correction de consommation validée doit rester traçable.

## 3. Dépenses, règlements et recettes

- Dépenses : présenter budget DQE, engagements acceptés, décomptes validés, règlements et reste à payer sans additionner les étapes d’une même obligation.
- Réutiliser la création/modification des documents et les formulaires de paiement existants ; les boutons ouvrent le bon circuit avec le contexte projet/phase/document.
- Vérifier le lien de paiement à un décompte, les règlements partiels, les montants non affectés et les soldes ; ne pas déduire une affectation depuis un numéro de facture libre.
- Recettes : séparer produits/factures clients et encaissements. Les paiements vers les prestataires ne deviennent jamais des recettes. Prévoir une persistance dédiée aux encaissements et à leur affectation si aucune source existante ne couvre ce rôle.
- Expliciter la perspective maître d’ouvrage/prestataire ; ne pas compter le même contrat comme charge et produit pour la même partie.
- Prendre en charge les corrections/avoirs liés au document d’origine et leurs affectations, sans effacer la pièce initiale ni introduire un montant négatif non contextualisé.
- Présenter HT, TVA, TTC, retenues et net à payer avec les calculateurs fiscaux existants. Conserver la devise de la source ; ne jamais sommer des devises différentes sans conversion explicite et traçable. Les historiques sans devise fiable restent signalés.
- Ajouter filtres période, phase, tâche, statut et source, avec accès aux pièces et actions autorisées. Pas de suppression silencieuse d’un document validé ou réglé.

## 4. Calculs canoniques et calendrier

- Inventorier les outils actifs avant modification : Gantt, PERT, WBS/phases/tâches/jalons, calendrier, ressources, suivi-évaluation, PTBA/PPM/PED/TBI, rapports et circuits documentaires. Associer chaque besoin à son outil, service, DTO et source existants ; repérer les composants de compatibilité plutôt que les dupliquer.
- **Gantt :** conserver le pipeline `ProjectMetricsOrchestrator` → `GanttModel` → `ProjectGanttTimeline` ; `GanttChart` reste une enveloppe de compatibilité. L’aperçu de planning et les pages projet utilisent ce rendu et ce calcul, pas un second Gantt.
- **PERT :** conserver `PertService`, exposé par `ProjectMetricsOrchestrator`, et `UnifiedPERTAnalysis` ; `PERTDiagram` reste une enveloppe. Alimenter les dépendances et estimations dans les contrats existants ; aucun moteur PERT/chemin critique parallèle.
- Composer calendrier, Gantt, PERT, WBS, ressources et indicateurs à partir du même projet/phase/tâche et des mêmes filtres. Une action modifie l’entité d’origine puis rafraîchit toutes ses présentations, sans créer de copie propre à une vue.
- Réutiliser sélecteurs, formulaires, actions CRUD, workflows, exports et rapports existants. Ne créer une présentation ciblée que si la composition/extension de l’existant ne suffit pas ; pas de menu ni page faisant doublon.
- Brancher les synthèses sur `ProjectFinancialsService`, `DecompteService`, `ProjectResourceAggregatorService` et `ProjectMetricsOrchestrator` plutôt que des sommes locales dans les écrans.
- Corriger montants validés nuls, statuts de règlements, affectations partielles et sources historiques ; ne pas masquer les erreurs par un bilan vide.
- L’agrégateur de ressources distingue affectation, livraison et consommation effective et évite de compter une même ligne planifiée depuis plusieurs sources.
- Fournir des synthèses cohérentes projet/phase et jour/mois/année, avec quantités regroupées par unité compatible ; aucun total de litres et de jours-homme.
- Conserver les identifiants des entités indépendamment des événements datés du calendrier. Les vues n’enregistrent pas des copies des paiements/factures.
- Placer règles, seuils, éligibilités et formules dans les référentiels ; les composants présentent les résultats. Réutiliser les moteurs existants sans branches spécifiques ETER/SOMELEC ni constantes issues d’un exemple.

## 5. Génération/import de plannings génériques

- Étendre l’import et la génération existants pour le collage de texte/tableaux, la sélection du référentiel et le mapping des sections inconnues. Composer l’aperçu éditable avec les vues WBS, Gantt, PERT et ressources existantes ; pas de nouvel espace de planification autonome ni de parseur concurrent pour un format déjà supporté. Signaler l’information non interprétée.
- Couvrir un nombre variable de phases, tâches, ressources et périodes sans noms ni formats propres à l’exemple. Générer depuis un référentiel ou importer un planning existant ; ne pas remplacer les données importées par un modèle implicite.
- Demander date d’ancrage, titre/référence, organisation, devise et paramètres manquants dans l’aperçu. Tarifs/budgets non inventés ; écarts avec le référentiel signalés, jamais corrigés silencieusement.
- Résoudre dates absolues/relatives, dépendances, chevauchements, calendriers ouvrés, périodicité et étapes post-réception selon données et référentiel. Dates de phase et jalons restent distinctes.
- Générer missions, tâches, jalons, livrables et liens avec références stables ; aucune répartition artificielle de charges entre tâches.
- Réutiliser/étendre les affectations de ressources pour les allocations par période. Unités, capacité, conversions et seuils sont configurables ; informations absentes inconnues. Ajouter une structure dédiée seulement si l’existant ne représente pas ce fait métier, jamais une copie pour Gantt/calendrier.
- Gouvernance configurable via tâches/jalons, rôles et calendriers existants : instances, participants, cadences et déclencheurs ; pas de nouveau module de réunions par défaut, de COPIL/COTEC imposés ni d’invitations fictives.
- Risques et assurance qualité : importer/générer catégories, évaluations, responsables, mitigations, contrôles, preuves et délais selon le référentiel applicable. Aucune norme ou fréquence de l’exemple imposée globalement ; les exigences ne valent pas preuve de conformité.
- Conserver source, référentiel/version et rapport créé/réutilisé/rejeté. Aperçu, correction, validation, création/reprise et lecture retour couvrent toutes les sections reconnues.
- **Cas illustratif de recette uniquement :** conserver les huit phases, chevauchements, livrables S8/S12, accompagnement 60 jours, six experts/352 JH, base 22, réunions, sept risques, délai 10 jours et contrôle 10 % du document fourni. Ces valeurs restent données de test/import, jamais constantes métier.

### Référentiels métier, réglementaires et d’entité

- Réutiliser/compléter le catalogue existant : création, import, édition, validation, versionnement et association aux projets. Référentiels configurables stockés par code et labels fr/ar/en ; données projet non traduites.
- Définir les règles comme données exécutables par moteurs génériques : champs requis, transitions, acteurs autorisés, obligations, délais, calendriers, unités, plafonds, formules et indicateurs. Les permissions restent validées côté serveur.
- Composer socle métier, réglementation, entité et paramètres projet avec priorité explicite ; détecter conflits, cycles, codes inconnus et configurations incomplètes. Ne jamais désactiver une obligation réglementaire par simple surcharge projet.
- Préparer l’adaptation Stratégie Nationale, Code Travaux, Code de l’électricité, guides de suivi-évaluation, ETER/SOMELEC sans réécrire le moteur. Charger uniquement des règles sourcées et validées ; ne pas inventer de dispositions légales.
- Figer la version appliquée et sa provenance pour l’audit ; une mise à jour du catalogue ne modifie pas silencieusement les projets existants. Changement de version avec aperçu d’impact et validation.
- Démontrer qu’ajouter/modifier un référentiel change le comportement sans ajouter de logique spécifique à l’interface ou au moteur.

## 6. Persistance, architecture et sécurité

- Respecter `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE_REFERENTIELS.md` et les critères de `docs/task-plan.md` : UI → Transformer → DTO → Service → domaine/port → adapter → base, puis lecture retour.
- Entités immuables avec interface/fabrique ; DTO camelCase, mapping snake_case dans l’adapter, imports client dynamiques ; aucun Supabase dans React ni React dans les services.
- Pour chaque besoin, documenter « réutiliser », « étendre » ou « absent » avec preuve. Ajouter un port/service/table uniquement pour un fait métier absent ; jamais pour matérialiser une nouvelle vue. Évaluer observations, allocations, encaissements/affectations et traçabilité d’import sans présumer de nouvelles tables.
- Vérifier les colonnes et droits de la base réelle avant migration ; appliquer migrations explicites, grants, RLS et validation serveur des références et transitions. Garder `btp` métier et `infra` SIG séparés ; `.env` intact.
- Réutiliser `ProjectWorkflowService` pour les cas d’usage projet et les services de sous-objets. Ajouter une unité de travail transactionnelle ou une reprise persistée avec compensation contrôlée pour éviter les créations partielles et doublons sur réessai.
- Générer les UUID en base ; utiliser les références externes pour la correspondance/import idempotent. Une erreur ne déclenche pas la suppression de données préexistantes.
- Mettre à jour invalidation des caches, traductions fr/ar/en, placeholders, chargements/erreurs/vides et confirmations. Les données saisies ne sont jamais traduites.
- Documenter les décisions structurelles dans `AGENTS.md` et les preuves réelles dans la feuille de route et le plan de tâches.

## 7. Validation et critères de clôture

- Tests métier : absence de double comptage, achats vs stock, réception vs utilisation, quantités partielles, unités, monnaies, HT/TVA/TTC, règlements partiels, avoirs, rapprochement historique et permissions de références.
- Tests génériques : plusieurs métiers/configurations avec phases, durées, unités, capacités et cadences différentes ; versionnement, composition, conflits, obligations et changement de référentiel sans modification du moteur. Le document fourni est un cas de recette avec ses valeurs exactes, pas le seul modèle testé.
- Tests de conversion, repositories/services, transactions/reprises et réimport : un second essai ne crée pas de doublons ; une erreur est visible et récupérable.
- Tests de composition/régression : une modification de tâche, phase, date, dépendance ou montant se retrouve dans calendrier, Gantt, PERT, ressources, indicateurs et rapports concernés. Vérifier mêmes identifiants/sources et calculs canoniques ; aucune écriture supplémentaire provoquée par l’ouverture d’une vue.
- Exécuter les suites existantes concernées et les nouveaux tests ; vérifier la compilation automatique puis les parcours visibles sur plusieurs largeurs.
- Recette autorisée sur plusieurs référentiels : génération/import, lecture retour des phases/allocations/risques/qualité, consommation liée, dépense validée, règlement partiel et encaissement ; vérifier vues et métriques. Tester volumes et pagination sans limite arbitraire issue de l’exemple.
- Supabase externe sans session injectable : tester ce qui est accessible sans contourner l’authentification ; la recette privée restera bloquée sans accès autorisé.
- Clôture uniquement sur preuves ; nommer chaque blocage restant, y compris les anciens blocages Docker/SMS.