/**
 * WorkspaceTabsList — barre d'onglets harmonisée (détail projet / détail phase).
 * Deux registres visuels :
 *  - `segmented` (défaut) : onglets pleine largeur, responsive (wrap mobile / grille desktop)
 *  - `underline` : sous-onglets discrets, défilables horizontalement sur mobile
 * Purement présentationnel : aucune logique métier, tokens de thème uniquement.
 */
import React from 'react';
import { TabsList } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface WorkspaceTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsList> {
  variant?: 'segmented' | 'underline';
}

export const WorkspaceTabsList: React.FC<WorkspaceTabsListProps> = ({
  variant = 'segmented',
  className,
  children,
  ...props
}) => (
  <TabsList
    {...props}
    className={cn(
      variant === 'segmented'
        ? 'flex h-auto w-full flex-wrap justify-start gap-1'
        : 'flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0',
      className,
    )}
  >
    {children}
  </TabsList>
);

export default WorkspaceTabsList;
