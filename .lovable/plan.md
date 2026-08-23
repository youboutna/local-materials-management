# Correction urgente du tableau de bord

## Exécution
- Corriger l’affichage des rôles avec le référentiel multilingue, y compris les états d’accès refusé.
- Aligner métriques, sévérités, filtres et état vide des alertes sur des clés `useI18n` FR/AR/EN et le référentiel central des catégories.
- Corriger les écarts connexes réellement actifs dans les composants, hooks, services et adapters du flux alertes, sans refonte hors périmètre.
- Valider par scan statique, tests ciblés, build automatisé et captures desktop FR/AR/EN si une session permet d’ouvrir le dashboard.

## Détails techniques
- Conserver le flux UI → hook → service → adapter et les DTO camelCase.
- Ne jamais afficher de code technique; résoudre rôles/sévérités/types via les référentiels existants.
- Éliminer les callbacks TanStack Query v5 interdits et les données analytiques fictives rencontrées dans le flux actif.
