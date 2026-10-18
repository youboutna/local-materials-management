# Calendrier projet, communications unifiées, métré et infrastructures GIS

## Résultat attendu

Des entrées de menu directes **Calendrier projets**, **Consommations**, **Métré et plans**, **Dépenses**, **Recettes** et **Infrastructures**, avec sélection recherchable du projet et accès à ses phases et actions existantes. Les pages actuelles restent disponibles et les règles métier restent dans les référentiels.

## Constats de l’audit

- Plusieurs actions contournent encore CommunicationService ou ignorent les échecs ; un identifiant utilisateur peut être transmis comme adresse email. Des actions locales annoncent un succès sans envoi.
- Un appel programmé est actuellement un rendez-vous enregistré, pas un appel téléphonique exécuté.
- Les ressources consommées sont actuellement cumulatives : elles ne permettent pas de reconstituer honnêtement une consommation par jour.
- Les imports PDF extraient des tableaux, pas toutes les mesures d’un dessin. Les six fichiers fournis serviront à vérifier le parcours plans/DQE, sans import automatique dans un projet existant.
- Le SQL electricity_network utilise d’autres schémas et une autre authentification ; ses droits ne doivent pas être copiés tels quels.

## Lot 1 — Communications fiables

- Faire passer les actions email, SMS, appel, notification, WhatsApp et liens de réunion par **CommunicationService**, en conservant NotificationService pour la persistance interne et les fournisseurs serveur pour les envois.
- Résoudre les destinataires via UserService, y compris les listes d’emails ; contrôler tous les résultats avant d’afficher un succès. Les méthodes historiques délèguent sans boucle de dépendances.
- Conserver les références et distinguer **accepté par le fournisseur**, **programmé**, **lien préparé**, **échec** et **non configuré**. Aucun succès simulé ni courrier postal prétendument envoyé.
- Email : sélection du fournisseur et de son expéditeur cohérentes ; contrôler pièces jointes et erreurs pour Resend, SendGrid et SMTP. SMS : réutiliser le port Twilio/configuration serveur ; aucun secret dans le navigateur.
- Appels : fiabiliser la programmation et les nouvelles tentatives ; ne pas la présenter comme un appel vocal automatique.
- **Décision confirmée : Google Meet et Microsoft Teams utilisent des liens existants**, validés et associés aux rendez-vous, sans création automatique ni connexion de compte imposée.
- WhatsApp : préparer un lien de conversation avec le contact réel ; ne pas annoncer un message livré. Les envois automatisés restent distincts et nécessitent un fournisseur Business configuré.
- Préserver les workflows serveur newsletter, fournisseur et réinitialisation de mot de passe : ils continuent de partager les fournisseurs serveur, pas d’appeler du code navigateur.

## Lot 2 — Calendrier projet direct

- Créer une page dédiée avec recherche par nom/référence, vues **jour / mois / année**, date sélectionnée et filtres par événement.
- Afficher tâches, phases, inspections et paiements avec leurs vraies dates ; distinguer échéance, programmation et réalisation. Les éléments sans date restent accessibles dans une liste séparée.
- Depuis un événement : ouvrir le détail, la phase ou les formulaires existants de création/modification/suppression, avec projet et date préremplis lorsque leur contrat le permet.
- Conserver projet, période et filtres dans l’adresse ; empêcher les données du projet précédent de rester affichées après changement.
- Les chefs de projet et profils délégués n’agissent que sur les projets et opérations autorisés. Le sélecteur n’accorde aucun droit : contrôler le périmètre côté serveur et utiliser les mêmes permissions dans le menu et les actions.

## Lot 3 — Consommation quotidienne, dépenses et recettes

- Réutiliser le conteneur Ressources et ses familles humaines, matériaux et équipements ; ajouter un journal daté projet/phase/tâche lorsque les données existantes ne portent pas cette information.
- Saisir et corriger les consommations quotidiennes, avec unités, quantités, coût et provenance ; comparer aux objectifs de phase via les moteurs/référentiels existants. Ne pas répartir artificiellement un cumul sur des jours.
- Relier **Dépenses** et **Recettes** au projet et au calendrier ; distinguer budget DQE, engagement, dépense constatée, paiement et encaissement réel, sans compter deux fois une même opération.
- Réutiliser les écritures existantes lorsqu’elles sont canoniques ; compléter la persistance seulement pour les notions absentes après revue du schéma.
- Afficher estimation et réalisé séparément. Calcul de bénéfice/marge uniquement à partir des catégories et bases fiscales validées, avec formule en référentiel ; aucune recette déduite d’un simple budget ou d’un paiement fournisseur.

## Lot 4 — Plans → métré → DQE

- Ajouter une page projet combinant document source, aperçu du plan, relevés, recommandations et transfert vers le DQE, en réutilisant GED, MeterService et l’import BOQ.
- PDF et images de plans : mesures assistées après calibration sur une cote connue, sélection de page et confirmation des dimensions/unités par l’ingénieur ; déductions d’ouvertures via le moteur existant.
- Tableaux PDF/Excel/CSV/JSON : réutiliser les parseurs existants et leur aperçu de validation. Ne pas annoncer DWG/IFC ou reconnaissance géométrique automatique comme supportés sans adaptateur vérifié.
- Conserver document, page et provenance des mesures ; éviter les doublons lors des transferts et respecter le nettoyage/rollback GED.
- Recette avec les plans toiture, menuiserie, masse, structure et le DQE fournis ; contrôler les zones à échelles différentes et les arrondis des montants source.

## Lot 5 — Infrastructures GIS liées aux zones

- Ajouter un inventaire et une carte projet pour créer, consulter, modifier et supprimer des ouvrages et segments de réseau, avec leurs liens aux zones d’intervention et phases.
- **Décision confirmée : un schéma dédié `infra` (nom SQL minuscule)** contient les infrastructures, couches cartographiques et analyses SIG ; le métier projet reste dans `btp`, l’identité et les services transverses restent partagés. Aucun déplacement des tables BTP existantes.
- Réutiliser la carte GIS et **GeocodingService** pour la recherche d’adresse et le géocodage ; garder les emprises projet distinctes des équipements/ouvrages persistés. Le géocodage ne remplace pas les calculs spatiaux fiables.
- Adapter les modèles utiles du dépôt electricity_network dans **infra**, sans importer sa seconde authentification, ses sessions ou ses autorisations permissives.
- Couplage faible : ports/DTOs et associations explicites infrastructure–projet–phase, sans recopier les projets dans infra ni faire lire les tables BTP directement par les composants cartographiques. Les emprises sont fournies au moteur spatial par le service projet, avec provenance/version.
- Prévoir conversion GeoJSON/PostGIS, ordre des coordonnées, géométries valides, trous et multipolygones, gestion des cercles et rattachement projet ; conserver les zones projet existantes.
- Fournir buffers en mètres, recherche de proximité, intersection et couverture de zone, avec filtres de couche/type/statut. Calculs métriques via PostGIS et unités explicites, jamais en degrés ni à partir d’une wilaya approximative.
- Afficher deux résultats séparés : **ouvrages présents dans la zone** et **ouvrages réalisés dans le cadre du projet**, puis permettre l’ouverture de leur liste et détail. Dédupliquer les ouvrages touchant plusieurs zones ; pour les lignes, montrer aussi la longueur effectivement intersectée.
- La présence est déterminée par la géométrie selon une relation spatiale explicite ; la réalisation exige une association au projet et une preuve de réalisation validée selon le référentiel. Une association ou un statut planifié ne suffit pas. Distinguer réalisation totale/partielle sans compter une portion comme ouvrage entièrement achevé.
- Types d’ouvrage, statuts et validations définis dans les référentiels ; droits de lecture/écriture par projet vérifiés côté serveur avant activation du CRUD.
- Déployer migrations, index spatiaux et fonctions de requête autorisées ; configurer explicitement l’exposition du schéma infra avec grants USAGE/table/fonction adaptés et RLS. Le comptage respecte les mêmes droits que les listes et ne révèle pas des ouvrages inaccessibles.

## Détails techniques et garde-fous

- Flux obligatoire : UI → Transformer → DTO camelCase → Service → domaine → port/adapter → DB snake_case ; aucune requête métier Supabase dans React.
- Nouveaux services d’agrégation composés des services existants ; DTOs canoniques, entités immuables avec factory, dépendances injectables.
- Navigation et permissions issues des référentiels, libellés fr/ar/en via i18n, données saisies jamais traduites.
- Lire le schéma réel avant toute migration ; migrations ciblées et explicites, avec contraintes, grants et RLS. Ne pas exécuter le SQL externe brut.
- Ne modifier ni .env ni l’infrastructure Docker existante ; conserver la configuration externe publique et les secrets serveur.
- Documenter les décisions structurelles dans AGENTS.md et suivre chaque lot dans roadmap.md.

## Validation et limites

- Exécuter les tests ciblés existants et ajouter des tests pour résultats de communication, résolution des contacts, périodes calendaires, isolation projet, consommation datée, non-double-comptage financier, unités/calibration et géométries ; tester buffers métriques, frontières/trous/multipolygones, déduplication interzones et séparation présence/réalisation avec preuve et autorisation.
- Vérifier les formulaires, erreurs, nouvelles tentatives, lecture retour des données enregistrées et navigation ; contrôler le rendu ordinateur/mobile et la compilation automatique.
- Les lots sont livrés progressivement, sans déclarer l’ensemble terminé à partir d’un écran vide ou d’un test simulé.
- **Blocages externes connus :** expéditeur Twilio absent, réception/livraison réelle non vérifiée, Supabase externe sans session de test injectable et Docker absent ici. Les permissions et parcours privés nécessiteront une recette sur l’environnement cible ; ces limites ne sont pas contournées par le filtrage visuel.
