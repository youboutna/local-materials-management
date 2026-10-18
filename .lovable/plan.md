# Cohérence métier et génération complète du planning

## Résultat attendu

Remplacer les saisies parallèles des onglets Consommations, Dépenses et Recettes par des vues traçables des circuits métier existants, puis permettre de créer le projet décrit dans le planning fourni. Chaque enregistrement conserve son rôle et sa source ; aucun changement de vocabulaire ne masque un double comptage.

Périmètre : les manquements de l’audit précédent, avec leurs migrations, formulaires, actions, calculs, traductions et tests. Les autres chantiers historiques du plan général ne seront pas déclarés terminés par ce lot.

## 1. Sources métier et rapprochement

- Réutiliser les lignes DQE/devis/contrats/factures dans `btp.boq_lines`, les décomptes dans `btp.progress_invoices`, les règlements dans `btp.payments` et les services correspondants.
- Conserver les opérations historiques : les afficher comme saisies complémentaires à rapprocher, sans les ajouter automatiquement aux coûts validés ou aux encaissements.
- Relier une déclaration à des identifiants réels : projet, phase, tâche, ressource, document et ligne selon son contexte. Remplacer la référence libre comme seul lien par une sélection avec recherche et aperçu.
- Prévoir le rapprochement, le détachement contrôlé et le diagnostic des références manquantes. Une opération déjà représentée par une facture ou un décompte n’est pas comptée deux fois.
- Distinguer les sources, leur statut et leur date métier ; ne pas confondre une date de saisie avec une date de consommation, validation ou règlement.

## 2. Consommations et circuits selon contexte

- Nouvel achat : expression de besoin → validation → devis/commande → réception → consommation constatée → facture/décompte → règlement. Réutiliser les étapes existantes sans créer un second workflow.
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
- Identifier explicitement la perspective : maître d’ouvrage ou prestataire. Ne pas déduire qu’un même contrat est une charge et un produit pour la même partie.
- Prendre en charge les corrections/avoirs liés au document d’origine et leurs affectations, sans effacer la pièce initiale ni introduire un montant négatif non contextualisé.
- Présenter HT, TVA, TTC, retenues et net à payer avec les calculateurs fiscaux existants. Conserver la devise de la source ; ne jamais sommer des devises différentes sans conversion explicite et traçable. Les historiques sans devise fiable restent signalés.
- Ajouter filtres période, phase, tâche, statut et source, avec accès aux pièces et actions autorisées. Pas de suppression silencieuse d’un document validé ou réglé.

## 4. Calculs canoniques et calendrier

- Brancher les synthèses sur `ProjectFinancialsService`, `DecompteService`, `ProjectResourceAggregatorService` et `ProjectMetricsOrchestrator` plutôt que des sommes locales dans les écrans.
- Corriger les incohérences du service financier révélées par la réconciliation : prise en compte des montants validés nuls, statuts de règlements, affectations partielles, sources historiques et erreurs de chargement. Ne pas transformer une erreur en bilan vide présenté comme réel.
- L’agrégateur de ressources distingue affectation, livraison et consommation effective et évite de compter une même ligne planifiée depuis plusieurs sources.
- Fournir des synthèses cohérentes projet/phase et jour/mois/année, avec quantités regroupées par unité compatible ; aucun total de litres et de jours-homme.
- Conserver les identifiants des entités indépendamment des événements datés du calendrier. Les vues n’enregistrent pas des copies des paiements/factures.
- Placer les règles, seuils, éligibilités et formules dans les référentiels ; les composants ne font que présenter les résultats.

## 5. Génération depuis le planning fourni

- Ajouter une entrée « Planning » à l’import projet existant : collage du texte, lecture des tableaux structurés et aperçu editable avant toute création. Signaler toute section ou ligne non interprétée ; ne jamais la perdre silencieusement.
- Demander la date de démarrage, le titre/référence, l’organisation responsable et la devise dans cet aperçu. Les tarifs et budgets restent facultatifs et non inventés.
- Préserver les phases 0 à 6 et leurs chevauchements, puis la phase 7 d’accompagnement J+1 à J+60 après livraison : sept phases d’exécution plus une phase post-livraison.
- Conserver séparément dates de phase et dates des livrables : Modélisation S3–S7 avec livrable S8 ; Développement S8–S13 avec livrable S12. Afficher ces différences pour confirmation, sans corriger arbitrairement le document.
- Générer les missions élémentaires, tâches, jalons, livrables et liens de phase avec références externes stables. Aucune répartition artificielle des jours des experts entre tâches.
- Reprendre les six experts, leurs profils et charges M1–M4 : 54, 66, 64, 58, 50 et 60 J/H ; totaux mensuels 58, 96, 108 et 90 ; total 352 J/H et 16 hommes-mois sur base 22. Persister les allocations mensuelles dans une structure dédiée, pas dans des notes ou des coûts.
- Afficher capacité et surcharge par expert : conserver les valeurs 24/26/28 J/H et avertir par rapport à la base 22, sans les réduire. La convention des périodes M1–M4 est visible et modifiable ; ne pas assimiler silencieusement 16 semaines à quatre mois calendaires.
- Gouvernance : COPIL aux fins de phase, COTEC toutes les deux semaines et synchronisation interne hebdomadaire. Conserver les participants/responsabilités connus, sans inventer d’heure de réunion ni prétendre envoyer des invitations.
- Reprendre les sept risques, leurs niveaux, responsables et mitigations, dont le délai de relecture de 10 jours.
- Reprendre le PAQ, ISO 9001:2015, ISO/TC 211, contrôles géométriques/attributaires, normes OGC, contrôle croisé d’au moins 10 % par couche et recette logicielle sous forme d’exigences et tâches vérifiables. Leur présence n’atteste pas une conformité acquise.
- Prévoir aperçu des sections, correction, validation, création, reprise et lecture du projet créé. Conserver le texte source et un rapport des éléments créés/réutilisés/rejetés.

## 6. Persistance, architecture et sécurité

- Respecter `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE_REFERENTIELS.md` et les critères de `docs/task-plan.md` : UI → Transformer → DTO → Service → domaine/port → adapter → base, puis lecture retour.
- Entités immuables avec interface et fabrique ; DTO camelCase et mapping snake_case exclusivement à la frontière adapter. Pas de Supabase dans React ni de React dans les services ; imports client dynamiques.
- Ajouter seulement les tables/liens manquants : observations/allocations réellement distinctes, encaissements/affectations et traçabilité d’import si nécessaire. Les documents et ressources existants ne sont pas dupliqués.
- Vérifier les colonnes et droits de la base réelle avant migration ; appliquer migrations explicites, grants, RLS et validation serveur des références et transitions. Garder `btp` métier et `infra` SIG séparés ; `.env` intact.
- Réutiliser `ProjectWorkflowService` pour les cas d’usage projet et les services de sous-objets. Ajouter une unité de travail transactionnelle ou une reprise persistée avec compensation contrôlée pour éviter les créations partielles et doublons sur réessai.
- Générer les UUID en base ; utiliser les références externes pour la correspondance/import idempotent. Une erreur ne déclenche pas la suppression de données préexistantes.
- Mettre à jour invalidation des caches, traductions fr/ar/en, placeholders, chargements/erreurs/vides et confirmations. Les données saisies ne sont jamais traduites.
- Documenter les décisions structurelles dans `AGENTS.md` et les preuves réelles dans la feuille de route et le plan de tâches.

## 7. Validation et critères de clôture

- Tests métier : absence de double comptage, achats vs stock, réception vs utilisation, quantités partielles, unités, monnaies, HT/TVA/TTC, règlements partiels, avoirs, rapprochement historique et permissions de références.
- Tests planning : huit phases conservées, chevauchements et dates de livrables exacts, accompagnement à 60 jours, six experts et total 352 J/H, capacités, réunions, sept risques, délai 10 jours et contrôle PAQ 10 %.
- Tests de conversion, repositories/services, transactions/reprises et réimport : un second essai ne crée pas de doublons ; une erreur est visible et récupérable.
- Exécuter les suites existantes concernées et les nouveaux tests ; vérifier la compilation automatique puis les parcours visibles sur plusieurs largeurs.
- Recette complète avec un compte autorisé : création du projet depuis l’aperçu, lecture retour des phases/charges/risques/PAQ, consommation liée, dépense validée, règlement partiel et encaissement, puis vérification des trois vues et métriques.
- Le projet utilise Supabase externe sans session injectable : tester les parties publiques et les règles disponibles ici ; ne pas contourner l’authentification. Si aucun accès autorisé au navigateur n’est disponible, la recette privée restera explicitement bloquée, pas annoncée comme réussie.
- Aucun élément n’est marqué terminé sans preuve. Le bilan final nomme chaque critère réalisé et chaque blocage externe restant ; les anciens blocages Docker/SMS ne sont pas masqués par ce lot.