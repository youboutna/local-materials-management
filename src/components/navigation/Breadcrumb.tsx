import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route to label mapping for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projets",
  create: "Créer",
  edit: "Modifier",
  materials: "Matériaux",
  documents: "Documents",
  tasks: "Tâches",
  employees: "Employés",
  users: "Utilisateurs",
  suppliers: "Fournisseurs",
  settings: "Paramètres",
  profile: "Profil",
  inspections: "Inspections",
  phases: "Phases",
  "tender-management": "Appels d'Offres",
  "bank-guarantee-monitor": "Garanties Bancaires",
  "inspection-monitoring": "Suivi Inspections",
  "notifications-center": "Notifications",
  "payment-control": "Contrôle Paiements",
  "insurance-management": "Gestion Assurances",
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const location = useLocation();
  const { t } = useLanguage();

  // Auto-generate breadcrumbs from current path if items not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];
    
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Check if segment is a UUID (skip adding it as label but keep path)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
      
      if (isUuid) {
        // For UUIDs, we might want to show "Detail" or similar
        crumbs.push({
          label: "Détails",
          href: index === pathSegments.length - 1 ? undefined : currentPath,
        });
      } else {
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        crumbs.push({
          label,
          href: index === pathSegments.length - 1 ? undefined : currentPath,
        });
      }
    });
    
    return crumbs;
  })();

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center space-x-1 text-sm text-muted-foreground",
        className
      )}
    >
      {/* Home link */}
      <Link
        to="/dashboard"
        className="flex items-center hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">{t("nav.home")}</span>
      </Link>

      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
          {item.href ? (
            <Link
              to={item.href}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              {item.icon && <item.icon className="h-3.5 w-3.5" />}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-1 font-medium text-foreground">
              {item.icon && <item.icon className="h-3.5 w-3.5" />}
              <span>{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

export default Breadcrumb;
