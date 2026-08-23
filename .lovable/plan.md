# Refonte mobile-first du portail fournisseur

## Objectif
Repenser l’expérience fournisseur autour de deux vues claires — liste des appels d’offres puis détail d’un dossier — en reprenant la hiérarchie visuelle des références : actions prioritaires visibles, progression lisible, navigation mobile compacte et contenu exploitable sans zoom.

## Périmètre
- Portail fournisseur connecté et accès sécurisé invité.
- Onglet Appels d’offres et détail du dossier sélectionné.
- Responsive mobile, tablette et desktop.
- Conservation intégrale des services, requêtes, permissions, upload, visualisation proxy, DQE et soumission existants.

## Mise en œuvre

### 1. Créer une expérience Appels d’offres dédiée
- Extraire la présentation de `EnhancedSupplierTenderPortal` en composants ciblés : en-tête fournisseur, liste compacte, carte appel d’offres et vue détail.
- Sur mobile, présenter chaque appel d’offres en carte verticale avec statut, référence, date limite, localisation, résumé et CTA principal pleine largeur.
- Sur desktop, utiliser une grille maîtrisée et une largeur de lecture limitée, sans accumuler les cartes imbriquées.
- Conserver la sélection actuelle et le passage vers le dossier, les documents et le devis.

### 2. Recomposer le détail d’un appel d’offres
- Ajouter un en-tête compact avec retour, favori, référence, statut, titre, organisation et métadonnées essentielles.
- Mettre les deux actions majeures au-dessus de la ligne de flottaison : téléchargement du DAO et ouverture/continuation du dossier.
- Afficher la progression de candidature sous forme de quatre étapes stables : informations, éligibilité, documents, soumission.
- Organiser le contenu en sections non imbriquées : aperçu, documents attendus, échéance et documents partagés.
- Préserver le viewer en mode proxy afin de ne jamais exposer directement l’URL de stockage.

### 3. Simplifier la navigation fournisseur
- Remplacer la rangée de neuf onglets difficilement exploitable sur mobile par une navigation priorisée : Appels d’offres, Dossiers/Devis, Documents, Messages/Notifications.
- Déplacer les fonctions secondaires dans un menu « Plus » sur mobile, tout en conservant leur accès sur desktop.
- Ajouter une barre d’action mobile fixe pour les actions contextuelles du dossier ; aucune action décorative ou inactive.
- Conserver la navigation desktop existante mais réduire sa densité et clarifier l’état actif.

### 4. Harmoniser design, accessibilité et i18n
- Réutiliser exclusivement les tokens sémantiques, composants Button/Badge/Tabs et couleurs de la charte RIM existante.
- Assurer des cibles tactiles d’au moins 44 px, focus visible, ordre clavier logique, libellés accessibles et textes sans troncature incohérente.
- Passer tous les nouveaux libellés par `useI18n`/`T` avec clés français, arabe et anglais ; conserver le RTL.
- Respecter les dimensions stables pour badges, étapes et boutons afin d’éviter les décalages de mise en page.

### 5. Validation
- Vérifier les états : chargement, aucun appel d’offres, appel ouvert/fermé, accès secret, dossier incomplet, dossier soumis, documents absents/présents.
- Tester le parcours liste → détail → document → devis/soumission sur mobile et desktop.
- Contrôler visuellement à 390 px et 1280 px, puis corriger débordements, chevauchements et densité.
- Valider compilation, erreurs runtime/console et fonctionnement des actions existantes.

## Détails techniques
- Changements limités à la couche présentation et aux traductions ; aucun changement Supabase ni migration.
- `EnhancedSupplierTenderPortal` reste orchestrateur des données et mutations actuelles ; les nouveaux composants reçoivent des DTO/handlers, sans accès direct à Supabase.
- `UnifiedSupplierPortal` pilote la navigation responsive et l’état d’onglet ; le DQE reste le workspace unifié existant.
- Les téléchargements/aperçus existants seront conservés, avec priorité au viewer proxy pour les documents privés.
