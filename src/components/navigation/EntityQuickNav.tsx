import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FolderOpen,
  FileText,
  Users,
  Package,
  ClipboardCheck,
  CreditCard,
  LucideIcon,
} from "lucide-react";

interface RelatedEntity {
  type: "project" | "phase" | "material" | "document" | "inspection" | "payment" | "supplier" | "employee";
  id: string;
  name: string;
  status?: string;
  statusVariant?: "default" | "secondary" | "destructive" | "outline";
}

interface EntityQuickNavProps {
  currentEntity: {
    type: string;
    name: string;
  };
  parentEntity?: RelatedEntity;
  relatedEntities?: RelatedEntity[];
  previousEntity?: { id: string; name: string; href: string };
  nextEntity?: { id: string; name: string; href: string };
  className?: string;
}

const entityIcons: Record<string, LucideIcon> = {
  project: FolderOpen,
  phase: ClipboardCheck,
  material: Package,
  document: FileText,
  inspection: ClipboardCheck,
  payment: CreditCard,
  supplier: Users,
  employee: Users,
};

const entityRoutes: Record<string, string> = {
  project: "/projects",
  phase: "/projects", // phases are nested
  material: "/materials",
  document: "/documents",
  inspection: "/inspections",
  payment: "/payments",
  supplier: "/suppliers",
  employee: "/employees",
};

export function EntityQuickNav({
  currentEntity,
  parentEntity,
  relatedEntities = [],
  previousEntity,
  nextEntity,
  className,
}: EntityQuickNavProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 py-2", className)}>
      {/* Previous/Next navigation */}
      {(previousEntity || nextEntity) && (
        <div className="flex items-center gap-1 border-r pr-3 mr-1">
          <TooltipProvider>
            {previousEntity && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={previousEntity.href}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Précédent: {previousEntity.name}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {nextEntity && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={nextEntity.href}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Suivant: {nextEntity.name}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )}

      {/* Parent entity link */}
      {parentEntity && (
        <Link
          to={`${entityRoutes[parentEntity.type]}/${parentEntity.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {(() => {
            const Icon = entityIcons[parentEntity.type];
            return Icon ? <Icon className="h-4 w-4" /> : null;
          })()}
          <span>{parentEntity.name}</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}

      {/* Related entities */}
      {relatedEntities.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Liés:</span>
          {relatedEntities.slice(0, 5).map((entity, index) => {
            const Icon = entityIcons[entity.type];
            return (
              <Link
                key={index}
                to={`${entityRoutes[entity.type]}/${entity.id}`}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                {Icon && <Icon className="h-3 w-3" />}
                <span className="max-w-24 truncate">{entity.name}</span>
                {entity.status && (
                  <Badge variant={entity.statusVariant || "secondary"} className="text-[10px] px-1 py-0">
                    {entity.status}
                  </Badge>
                )}
              </Link>
            );
          })}
          {relatedEntities.length > 5 && (
            <span className="text-xs text-muted-foreground">
              +{relatedEntities.length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default EntityQuickNav;
