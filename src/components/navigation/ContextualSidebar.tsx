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
} from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  badge?: string | number;
  children?: NavItem[];
  roles?: string[];
}

interface ContextualSidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projets",
    icon: Briefcase,
    children: [
      { label: "Tous les projets", href: "/projects" },
      { label: "Créer un projet", href: "/projects/create" },
      { label: "Importer", href: "/projects/import" },
    ],
  },
  {
    label: "Cycle de vie projet",
    icon: Compass,
    children: [
      { label: "Planification", href: "/projects?stage=PLANIFICATION", icon: Target },
      { label: "Exécution", href: "/projects?stage=EXECUTION", icon: HardHat },
      { label: "Contrôle & Inspections", href: "/inspection-monitoring", icon: ShieldCheck },
      { label: "Paiements & échéances", href: "/payment-control", icon: CreditCard },
      { label: "Clôture", href: "/projects?stage=CLOTURE", icon: Flag },
    ],
  },
  {
    label: "Matériaux",
    href: "/materials",
    icon: Package,
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    label: "Tâches",
    href: "/tasks",
    icon: ClipboardList,
  },
  {
    label: "Équipe",
    icon: Users,
    children: [
      { label: "Employés", href: "/employees" },
      { label: "Utilisateurs", href: "/users", roles: ["admin", "director"] },
    ],
  },
  {
    label: "Fournisseurs",
    icon: Building2,
    children: [
      { label: "Liste", href: "/suppliers" },
      { label: "Appels d'offres", href: "/tender-management" },
    ],
  },
  {
    label: "Surveillance",
    icon: Eye,
    children: [
      { label: "Inspections", href: "/inspection-monitoring" },
      { label: "Garanties bancaires", href: "/bank-guarantee-monitor" },
      { label: "Contrôle paiements", href: "/payment-control" },
      { label: "Assurances", href: "/insurance-management" },
    ],
  },
  {
    label: "Notifications",
    href: "/notifications-center",
    icon: Bell,
  },
  {
    label: "Paramètres",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "director"],
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
        {!collapsed && <span className="truncate">{item.label}</span>}
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
              <span className="truncate flex-1 text-left">{item.label}</span>
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
    </aside>
  );
}

export default ContextualSidebar;
