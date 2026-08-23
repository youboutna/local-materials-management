import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useEnumLabel } from '@/hooks/useEnumLabel';

interface EnumTextProps {
    /** Nom de l'ENUM tel que déclaré dans le code (ex: `StakeholderType`). */
    enumName: string;
    /** Code technique persisté en base (ex: `principal_contractor`). */
    code: string | null | undefined;
    className?: string;
}

/**
 * Affiche le libellé multilingue d'un code ENUM (réactif au changement de langue).
 * Le code technique n'est jamais modifié : seul l'affichage est traduit.
 */
export const EnumText: React.FC<EnumTextProps> = ({ enumName, code, className }) => {
    const { label } = useEnumLabel();
    return <span className={className}>{label(enumName, code)}</span>;
};

interface EnumBadgeProps extends EnumTextProps {
    variant?: React.ComponentProps<typeof Badge>['variant'];
}

/** Variante badge du libellé d'ENUM, pour les colonnes de statut/type. */
export const EnumBadge: React.FC<EnumBadgeProps> = ({ enumName, code, className, variant = 'secondary' }) => {
    const { label } = useEnumLabel();
    if (!code) return null;
    return (
        <Badge variant={variant} className={className}>
            {label(enumName, code)}
        </Badge>
    );
};
