/**
 * Recommandations structurées par type d'élément.
 * Mirroir textuel de `getRecommendations()` du calculateur avancé.
 * Utilisé pour créer 1 ligne article par recommandation lors d'un calcul.
 */
export interface RecommendationItem {
  label: string;
  /** Optionnel: unité suggérée (surcharge celle du matériau si présente). */
  unit?: string;
  /** Optionnel: quantité par défaut (défaut = 1). */
  quantity?: number;
}

const CATALOG: Record<string, RecommendationItem[]> = {
  concrete_slab: [
    { label: 'Épaisseur recommandée 15 cm (dalle courante)' },
    { label: 'Béton C25/30' },
    { label: 'Dosage ciment 350 kg/m³' },
    { label: 'Ferraillage ST25C (ou équivalent)' },
  ],
  lean_concrete: [
    { label: 'Épaisseur 5 à 10 cm' },
    { label: 'Béton C12/15 (propreté)' },
    { label: 'Dosage ciment 200–250 kg/m³' },
  ],
  foundation: [
    { label: 'Profondeur selon étude de sol (≥ 0,8 m)' },
    { label: 'Largeur minimale 40 cm' },
    { label: 'Béton de propreté en fond de fouille' },
  ],
  foundation_masonry: [
    { label: 'Blocs / pierres de fondation' },
    { label: 'Épaisseur minimale 30 cm' },
    { label: 'Mortier dosé à 400 kg/m³' },
  ],
  foundation_chape: [
    { label: 'Chape de propreté sur fondation' },
    { label: 'Épaisseur 2 à 3 cm' },
    { label: 'Dosage ciment 300 kg/m³' },
  ],
  roof_insulation: [
    { label: 'Panneaux isolants (laine de roche / PSE)' },
    { label: 'Épaisseur 5 à 10 cm' },
    { label: 'Résistance thermique R ≥ 3 m².K/W' },
  ],
  cement_block_masonry: [
    { label: 'Blocs creux 20×20×40 cm' },
    { label: '13 blocs / m² environ' },
    { label: 'Mortier dosé à 400 kg/m³' },
  ],
  reinforced_concrete: [
    { label: 'Béton C25/30 minimum' },
    { label: 'Ferraillage selon plans d’exécution' },
    { label: 'Vibrage du béton' },
  ],
  wooden_roof_structure: [
    { label: 'Bois sec et traité insectes' },
    { label: 'Chevrons 6×12 cm mini' },
    { label: 'Entraxe 60 cm' },
  ],
  metal_gutter: [
    { label: 'Acier galvanisé ou PVC' },
    { label: 'Pente minimale 5 mm/m' },
    { label: 'Fixation tous les 50 cm' },
  ],
  roof_covering: [
    { label: 'Pente minimale 10 %' },
    { label: 'Écran sous toiture' },
    { label: 'Fixation selon DTU' },
  ],
  tiling: [
    { label: 'Prévoir 5 % de pertes' },
    { label: 'Joint 2 à 5 mm' },
    { label: 'Colle adaptée au support' },
  ],
  wooden_ceiling: [
    { label: 'Bois sec et traité' },
    { label: 'Épaisseur 15 à 20 mm' },
    { label: 'Fixation sur ossature bois' },
  ],
  balustrade: [
    { label: 'Hauteur ≥ 1 m' },
    { label: 'Espacement barreaux ≤ 11 cm' },
    { label: 'Acier / bois / alu' },
  ],
  electrical_installation: [
    { label: 'Conforme NFC 15-100' },
    { label: 'Câbles de section adaptée' },
    { label: 'Protection différentielle' },
  ],
  plumbing_installation: [
    { label: 'Tubes PER ou multicouche' },
    { label: 'Essai à 6 bars' },
    { label: 'Vannes d’arrêt accessibles' },
  ],
  septic_tank: [
    { label: 'Volume selon nombre d’usagers' },
    { label: 'Étanchéité parfaite' },
    { label: 'Ventilation obligatoire' },
  ],
  site_preparation: [
    { label: 'Débroussaillage complet' },
    { label: 'Évacuation déchets / gravats' },
    { label: 'Nivellement' },
  ],
  excavation: [
    { label: 'Profondeur selon étude de sol' },
    { label: 'Talutage ou blindage' },
    { label: 'Évacuation des terres' },
  ],
  masonry_wall: [
    { label: 'Épaisseur standard 20 cm' },
    { label: 'Brique creuse ou bloc ciment' },
    { label: 'Mortier 400 kg/m³' },
    { label: 'Joint vertical décalé' },
    { label: 'Chaînage horizontal tous les 1,20 m' },
    { label: 'Humidification des blocs avant pose' },
  ],
  painting: [
    { label: 'Préparation des supports' },
    { label: 'Sous-couche adaptée' },
    { label: 'Temps de séchage' },
  ],
  fence: [
    { label: 'Hauteur selon PLU' },
    { label: 'Fondations adaptées au sol' },
    { label: 'Traitement anticorrosion' },
  ],
  gate: [
    { label: 'Ouverture sécurisée' },
    { label: 'Matériau adapté (acier / alu / bois)' },
    { label: 'Alignement et fixation' },
  ],
  landscaping: [
    { label: 'Drainage efficace' },
    { label: 'Plantes adaptées au climat' },
    { label: 'Stabilisation des allées' },
  ],
  architectural_plan: [
    { label: 'Conformité règles d’urbanisme' },
    { label: 'Plans, coupes, élévations' },
    { label: 'Plan de masse + détails' },
  ],
};

export function getRecommendationItems(elementType: string): RecommendationItem[] {
  return CATALOG[elementType] ?? [];
}
