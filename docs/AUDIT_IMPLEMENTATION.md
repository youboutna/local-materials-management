# Audit d'implémentation — méthodes factices, valeurs codées en dur, erreurs masquées

Méthode : analyse du comportement (pas de recherche de mots-clés seule) — retours constants,
données aléatoires présentées comme métier, délais simulés, destinataires fictifs,
erreurs de lecture converties en listes vides, actions qui affichent un succès sans rien faire.

## Corrigé
| Zone | Défaut | Correction |
|---|---|---|
| Processeur d'alertes (écran admin + hook) | Résultats inventés (aléatoires / constantes) après une attente simulée | `AlertsProcessorService` appelle la vraie fonction serveur et rapporte ses chiffres et sa durée réelle |
| Tendance d'avancement des phases | Variations aléatoires affichées comme tendance | Tendance neutre (0) tant qu'aucun historique n'est enregistré |
| Test de connexion Keycloak | Succès simulé si les champs sont remplis | Vérifie la configuration OpenID réellement publiée par le realm |
| Enregistrement Keycloak | « Enregistré » affiché sans rien enregistrer | Message honnête : la configuration passe par le fichier de déploiement |
| Actualisation analytique localisation | Attente simulée | Recharge réellement les données |
| Actions inspection / assurance / garantie | Notifications envoyées à un identifiant fictif `0000…` | Notifiées à l'utilisateur qui exécute l'action |
| Matériaux, documents d'AO, jalons (adaptateurs) | Erreurs de lecture transformées en « aucune donnée » | Les erreurs remontent ; seule l'absence réelle de données renvoie une liste vide |
| Administration des comptes | Création côté navigateur avec mot de passe imposé ; API admin appelée sans privilège | Fonction serveur `admin-users`, lien de confirmation e-mail/SMS |

| Paiements | Identifiant et n° de transaction inventés côté navigateur ; coordonnées bancaires écrites dans le journal | La base génère l'identifiant, renvoyé au service ; n° de transaction vide si non fourni ; journal supprimé |
| Jalons importés | Identifiant inventé | Laissé à la base |
| Notifications « lu / non lu » | Fausse notification renvoyée ; « non lu » ne faisait rien | Enregistre réellement puis relit la notification stockée |
| Validation de documents, processeur d'alertes | Notifications vers un destinataire « system » inexistant | Envoyées à l'utilisateur qui a lancé l'action |
| Import DQE (lot B) | Calcul en un seul bloc | Gros fichiers (> 500 lignes) calculés par paquets de 200 sans bloquer l'écran |
| Anciens panneaux de réglages | Fichiers inutilisés | Supprimés |

| Actions unifiées (`enhancedActionService`) | « Approuver un paiement » écrasait le paiement (montant 0, n° de transaction inventé, prestataire vidé) ; échecs avalés puis succès affiché ; notifications vers destinataire vide ; type inconnu ignoré ; toutes les actions routées vers « assurance » ; auteur « system » | Approbation via `PaymentService.processPaymentWithControls` avec l'auteur réel ; erreurs remontées ; destinataire obligatoire ; type inconnu refusé ; routage par type d'entité ; auteur = utilisateur connecté |
| Géocodage | Panne des deux sources affichée comme « aucun résultat » | Erreur remontée si toutes les sources échouent |
| 35 blocs `catch` des services applicatifs | Erreur journalisée puis `[]`/`null` renvoyé | L'erreur est relancée (affichée par l'écran via l'état d'erreur) |
| Pages de test, import « Projets 2025 » | Projets et identifiants codés en dur importables en production | Pages et onglet supprimés |

## Reste à traiter (priorisé)
1. ~145 autres blocs (hooks, adaptateurs, composants) `catch` qui renvoient `[]`/`null` sans remonter l'erreur (GeocodingService, useLocationHex, ProjectManagerProvider, MilestoneService, usePhasesHex…). Les contrôles de permission qui renvoient `false` sont volontairement conservés (refus par défaut).
2. ~300 méthodes dont le corps se limite à des journaux console (`enhancedActionService`, `SupplierPaymentService`, `StakeholderService`) : à relire une par une.
6. Tests en échec déjà présents : sélection des fournisseurs par variables d'environnement (`RepositoryFactory.providers`, 9) et libellés bruts (`I18nNoRawCodes`, 2).
