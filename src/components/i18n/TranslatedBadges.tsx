/**
 * TranslatedBadges — badges partagés dont le libellé provient exclusivement
 * des référentiels multilingues (via `useI18n`).
 *
 * Règle : aucun code technique ne doit être affiché brut dans l'UI.
 */
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface TranslatedBadgeProps {
  code?: string | null;
  className?: string;
  variant?: BadgeVariant;
  /** Texte affiché si le code est vide. */
  fallback?: string;
}

/** Rend un badge traduit, ou le fallback si aucun code n'est fourni. */
const renderBadge = (
  label: string,
  { className, variant = 'outline', fallback = '—' }: TranslatedBadgeProps
) => (
  <Badge variant={variant} className={cn('font-medium', className)}>
    {label || fallback}
  </Badge>
);

export const TypeBadge = (props: TranslatedBadgeProps) => {
  const { translateProjectType } = useI18n();
  return renderBadge(translateProjectType(props.code), props);
};

export const CategoryBadge = (props: TranslatedBadgeProps) => {
  const { translateCategory } = useI18n();
  return renderBadge(translateCategory(props.code), props);
};

export const UnitBadge = (props: TranslatedBadgeProps) => {
  const { translateUnit } = useI18n();
  return renderBadge(translateUnit(props.code), props);
};

export const RoleBadge = (props: TranslatedBadgeProps) => {
  const { translateRole } = useI18n();
  return renderBadge(translateRole(props.code), props);
};

export const PriorityBadge = (props: TranslatedBadgeProps) => {
  const { translatePriority } = useI18n();
  return renderBadge(translatePriority(props.code), props);
};

export const SeverityBadge = (props: TranslatedBadgeProps) => {
  const { translateSeverity } = useI18n();
  return renderBadge(translateSeverity(props.code), props);
};

export const PhaseStepBadge = (props: TranslatedBadgeProps) => {
  const { translateStatus } = useI18n();
  return renderBadge(translateStatus(props.code), props);
};

export const DocumentTypeBadge = (props: TranslatedBadgeProps) => {
  const { translateDocumentType } = useI18n();
  return renderBadge(translateDocumentType(props.code), props);
};

export const DepartmentBadge = (props: TranslatedBadgeProps) => {
  const { translateDepartment } = useI18n();
  return renderBadge(translateDepartment(props.code), props);
};

export const TenderStepBadge = (props: TranslatedBadgeProps) => {
  const { translateTenderStep } = useI18n();
  return renderBadge(translateTenderStep(props.code), props);
};

/** Texte traduit sans habillage badge (pour listes denses / inline). */
export const TranslatedUnit = ({ code }: { code?: string | null }) => {
  const { translateUnit } = useI18n();
  return <>{translateUnit(code)}</>;
};

export const TranslatedStatus = ({ code }: { code?: string | null }) => {
  const { translateStatus } = useI18n();
  return <>{translateStatus(code)}</>;
};
