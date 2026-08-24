/**
 * TabSaveBar — Barre d'édition/sauvegarde partielle pour un onglet (Mode 1).
 *
 * Doctrine : « Un onglet = une vue » → chaque onglet peut passer en édition
 * et enregistrer uniquement ses propres champs, sans impacter les autres.
 * Composant purement présentationnel (aucun accès données).
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import { T } from '@/components/i18n/T';

export interface TabSaveBarProps {
  /** Titre de la vue (onglet) */
  title: string;
  /** Icône optionnelle rendue avant le titre */
  icon?: React.ReactNode;
  isEditing: boolean;
  isSaving?: boolean;
  isDirty?: boolean;
  /** Désactive le passage en édition (ex: document verrouillé) */
  disabled?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  /** Contenu additionnel (résumé, badges) affiché à droite en lecture */
  children?: React.ReactNode;
}

const TabSaveBar: React.FC<TabSaveBarProps> = ({
  title,
  icon,
  isEditing,
  isSaving = false,
  isDirty = false,
  disabled = false,
  onEdit,
  onSave,
  onCancel,
  children,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
    <div className="flex items-center gap-2 min-w-0">
      {icon}
      <span className="text-sm font-medium truncate">{title}</span>
      {isEditing && isDirty && (
        <Badge variant="outline" className="text-[10px]">
          <T k="auto.tabsavebar.non_enregistre" fallback="Non enregistré" />
        </Badge>
      )}
      {children}
    </div>
    <div className="flex items-center gap-2">
      {!isEditing ? (
        <Button size="sm" variant="outline" onClick={onEdit} disabled={disabled} aria-label={`Modifier ${title}`}>
          <Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          <T k="auto.tabsavebar.modifier" fallback="Modifier" />
        </Button>
      ) : (
        <>
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving} aria-label="Annuler l'édition">
            <X className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            <T k="auto.tabsavebar.annuler" fallback="Annuler" />
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving || !isDirty} aria-label={`Enregistrer ${title}`}>
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            )}
            <T k="auto.tabsavebar.enregistrer" fallback="Enregistrer" />
          </Button>
        </>
      )}
    </div>
  </div>
);

export default TabSaveBar;
