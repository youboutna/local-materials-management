import React, { useMemo } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useEnumLabel } from '@/hooks/useEnumLabel';

interface EnumSelectProps {
    /** Nom de l'ENUM tel qu'enregistré dans le référentiel de libellés (ex: `StakeholderType`). */
    enumName: string;
    /** Code technique sélectionné (jamais traduit). */
    value: string | null | undefined;
    /** Retourne toujours le code technique. */
    onChange: (value: string) => void;
    /** Placeholder déjà traduit par l'appelant. */
    placeholder?: string;
    /** Restreindre / ordonner les codes proposés (sinon tous ceux du référentiel). */
    codes?: readonly string[];
    disabled?: boolean;
    className?: string;
    id?: string;
    'aria-label'?: string;
}

/**
 * Sélecteur générique d'ENUM : affiche le libellé dans la langue active
 * (fr / ar / en) et conserve le code technique comme valeur d'option.
 *
 * Doctrine i18n : la base et les codes ne sont jamais traduits ; seul l'affichage l'est.
 */
export const EnumSelect: React.FC<EnumSelectProps> = ({
    enumName,
    value,
    onChange,
    placeholder,
    codes,
    disabled,
    className,
    id,
    'aria-label': ariaLabel,
}) => {
    const { options, label } = useEnumLabel();

    const items = useMemo(() => {
        if (codes && codes.length > 0) {
            return codes.map((code) => ({ value: code, label: label(enumName, code) }));
        }
        return options(enumName);
    }, [codes, enumName, label, options]);

    return (
        <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={className} id={id} aria-label={ariaLabel}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                        {item.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default EnumSelect;
