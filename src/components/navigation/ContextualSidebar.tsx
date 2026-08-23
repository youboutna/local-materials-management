import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  LucideIcon,
  LayoutDashboard,
  Briefcase,
  Package,
  FileText,
  ClipboardList,
  Users,
  Building2,
  Settings,
  Shield,
  CreditCard,
  Eye,
  Bell,
  FolderOpen,
  Compass,
  HardHat,
  ShieldCheck,
  Flag,
  Target,
  BarChart3,
  Palette,
  KeyRound,

} from "lucide-react";
import { SecretAccessManager } from "@/components/navigation/SecretAccessManager";


interface NavItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  badge?: string | number;
  children?: NavItem[];
  roles?: string[];
  /** Action spéciale rendue par un composant dédié (ex. gestionnaire de codes secrets) */
  action?: 'secretManager';
}

interface ContextualSidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

const navigationItems: NavItem[] = [
  {
    label: 'auto.contextualsidebar.dashboard',
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: 'auto.contextualsidebar.projets',
    icon: Briefcase,
    children: [
      { label: 'auto.contextualsidebar.tous_les_projets', href: "/projects" },
      { label: 'auto.contextualsidebar.creer_un_projet', href: "/projects/create" },
      { label: 'auto.contextualsidebar.importer', href: "/projects/import" },
    ],
  },
  {
    label: 'auto.contextualsidebar.cycle_de_vie_projet',
    icon: Compass,
    children: [
      { label: 'auto.contextualsidebar.planification', href: "/projects?stage=PLANIFICATION", icon: Target },
      { label: 'auto.contextualsidebar.execution', href: "/projects?stage=EXECUTION", icon: HardHat },
      { label: 'auto.contextualsidebar.controle_inspections', href: "/inspection-monitoring", icon: ShieldCheck },
      { label: 'auto.contextualsidebar.paiements_echeances', href: "/payment-control", icon: CreditCard },
      { label: 'auto.contextualsidebar.cloture', href: "/projects?stage=CLOTURE", icon: Flag },
    ],
  },
  {
    label: 'auto.contextualsidebar.materiaux',
    href: "/materials",
    icon: Package,
  },
  {
    label: 'auto.contextualsidebar.documents',
    href: "/documents",
    icon: FileText,
  },
  {
    label: 'auto.contextualsidebar.taches',
    href: "/tasks",
    icon: ClipboardList,
  },
  {
    label: 'auto.contextualsidebar.equipe',
    icon: Users,
    children: [
      { label: 'auto.contextualsidebar.employes', href: "/employees" },
      { label: 'auto.contextualsidebar.organisations', href: "/organizations", roles: ["admin", "director", "manager"] },
      { label: 'auto.contextualsidebar.utilisateurs', href: "/users", roles: ["admin", "director"] },

    ],
  },
  {
    label: 'auto.contextualsidebar.fournisseurs',
    icon: Building2,
    children: [
      { label: 'auto.contextualsidebar.liste', href: "/suppliers" },
      { label: "Appels d'offres", href: "/tender-management" },
      { label: 'auto.contextualsidebar.partage_codes', action: 'secretManager', icon: KeyRound },
    ],
  },
  {
    label: 'auto.contextualsidebar.surveillance',
    icon: Eye,
    children: [
      { label: 'auto.contextualsidebar.inspections', href: "/inspection-monitoring" },
      { label: 'auto.contextualsidebar.garanties_bancaires', href: "/bank-guarantee-monitor" },
      { label: 'auto.contextualsidebar.controle_paiements', href: "/payment-control" },
      { label: 'auto.contextualsidebar.assurances', href: "/insurance-management" },
    ],
  },
  {
    label: 'auto.contextualsidebar.reporting_suivi',
    icon: BarChart3,
    children: [
      { label: 'auto.contextualsidebar.suivi_global', href: "/comprehensive-monitoring" },
      { label: 'auto.contextualsidebar.documents', href: "/documents" },
      { label: 'auto.contextualsidebar.taches', href: "/tasks" },
      { label: 'auto.contextualsidebar.notifications', href: "/notifications-center" },
      { label: 'auto.contextualsidebar.messagerie', href: "/inbox", roles: ["admin", "director", "manager"] },
    ],
  },
  {
    label: 'auto.contextualsidebar.parametres',
    icon: Settings,
    roles: ["admin", "director"],
    children: [
      { label: 'auto.contextualsidebar.general', href: "/settings" },
      { label: 'auto.contextualsidebar.apparence_themes', href: "/settings?tab=appearance", icon: Palette },
    ],
  },
];


function NavItemComponent({
  item,
  collapsed,
  depth = 0,
}: {
  item: NavItem;
  collapsed?: boolean;
  depth?: number;
}) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => {
    // Auto-open if current path is within this section
    if (item.children) {
      return item.children.some((child) => 
        child.href && location.pathname.startsWith(child.href)
      );
    }
    return false;
  });

  const isActive = item.href && location.pathname === item.href;
  const hasActiveChild = item.children?.some(
    (child) => child.href && location.pathname.startsWith(child.href)
  );

  const IconComponent = item.icon;

  // Action item (dialogue) — ex. partage & codes secrets fournisseurs
  if (item.action === 'secretManager') {
    return (
      <SecretAccessManager
        className={cn(
          "w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
          depth > 0 && "pl-10",
          collapsed && "justify-center px-2",
        )}
        hideLabel={collapsed}
      />
    );
  }

  // Simple link item
  if (!item.children) {
    return (
      <Link
        to={item.href || "#"}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
          "hover:bg-muted hover:text-foreground",
          isActive
            ? "bg-primary/10 text-primary border-l-2 border-primary"
            : "text-muted-foreground",
          depth > 0 && "pl-10",
          collapsed && "justify-center px-2"
        )}
      >
        {IconComponent && (
          <IconComponent className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary")} />
        )}
        {!collapsed && <span className="truncate">{t(item.label)}</span>}
        {item.badge && !collapsed && (
          <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
            {item.badge}
          </span>
        )}
      </Link>
    );
  }

  // Collapsible group
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full",
            "hover:bg-muted hover:text-foreground",
            hasActiveChild
              ? "text-foreground"
              : "text-muted-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          {IconComponent && (
            <IconComponent className={cn("h-4 w-4 flex-shrink-0", hasActiveChild && "text-primary")} />
          )}
          {!collapsed && (
            <>
              <span className="truncate flex-1 text-left">{t(item.label)}</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
            </>
          )}
        </button>
      </CollapsibleTrigger>
      {!collapsed && (
        <CollapsibleContent className="mt-1 space-y-1">
          {item.children.map((child, index) => (
            <NavItemComponent key={index} item={child} depth={depth + 1} />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export function ContextualSidebar({ className, collapsed = false, onToggle }: ContextualSidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card h-full transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navigationItems.map((item, index) => (
            <NavItemComponent key={index} item={item} collapsed={collapsed} />
          ))}
        </nav>
      </ScrollArea>

      {/* Partage sécurisé & codes secrets — accessible depuis toutes les pages */}
      <div className={cn("border-t p-2", collapsed && "px-1")}>
        <SecretAccessManager
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
          hideLabel={collapsed}
        />
      </div>
    </aside>

  );
}

export default ContextualSidebar;
