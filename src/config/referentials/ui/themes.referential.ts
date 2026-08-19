/**
 * Référentiel « thèmes UI ».
 *
 * Chaque thème = une classe CSS appliquée sur <html> qui surcharge les tokens
 * sémantiques définis dans `src/index.css`. Aucune couleur n'est codée en dur
 * dans les composants : ils consomment uniquement les tokens.
 *
 * Ajouter un thème = ajouter une entrée ici + le bloc `.theme-xxx` dans index.css.
 */

export interface UiThemeDefinition {
  /** Identifiant persisté (localStorage / settings). */
  id: string;
  /** Libellé affiché dans le sélecteur. */
  label: string;
  /** Courte description métier / éditoriale. */
  description: string;
  /**
   * Classe CSS à appliquer sur <html>. Vide pour le thème par défaut
   * (les tokens de base de index.css font foi).
   */
  className: string;
  /** Aperçu de la palette (tokens HSL) pour la vignette du sélecteur. */
  preview: { primary: string; accent: string; background: string };
}

export const UI_THEMES: UiThemeDefinition[] = [
  {
    id: "adrar-stone",
    label: "Adrar Stone",
    description: "Thème historique Hadratech-GPI : bleu institutionnel, sable et terracotta.",
    className: "",
    preview: { primary: "218 90% 35%", accent: "25 95% 53%", background: "0 0% 100%" },
  },
  {
    id: "rim",
    label: "RIM Énergie",
    description: "Charte graphique officielle RIM : vert #00A95C, or #FFD700, rouge #D01C1F, police Louguiya.",
    className: "theme-rim",
    preview: { primary: "153 100% 26%", accent: "51 100% 50%", background: "45 15% 98%" },
  },
];

//export const DEFAULT_UI_THEME_ID = 'adrar-stone';
export const DEFAULT_UI_THEME_ID = "rim";
export const UI_THEME_STORAGE_KEY = "hadratech.ui-theme";

export const getUiTheme = (id?: string | null): UiThemeDefinition =>
  UI_THEMES.find((theme) => theme.id === id) ?? UI_THEMES.find((theme) => theme.id === DEFAULT_UI_THEME_ID)!;

/** Toutes les classes de thème (utile pour nettoyer <html> avant application). */
export const UI_THEME_CLASSNAMES = UI_THEMES.map((t) => t.className).filter(Boolean);
