import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface QuickLink {
  label: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  badge?: string | number;
  badgeVariant?: "default" | "success" | "warning" | "destructive";
}

interface QuickLinksProps {
  links: QuickLink[];
  title?: string;
  className?: string;
  variant?: "horizontal" | "vertical" | "grid";
}

const badgeStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  destructive: "bg-red-100 text-red-700",
};

export function QuickLinks({ links, title, className, variant = "horizontal" }: QuickLinksProps) {
  const containerStyles = {
    horizontal: "flex flex-wrap items-center gap-2",
    vertical: "flex flex-col gap-1",
    grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
  };

  const linkStyles = {
    horizontal: "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full bg-muted hover:bg-muted/80 transition-colors",
    vertical: "flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors group",
    grid: "flex flex-col items-center gap-2 p-4 text-sm rounded-xl bg-card border hover:shadow-md hover:border-primary/30 transition-all group",
  };

  return (
    <div className={cn("", className)}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
      )}
      <div className={containerStyles[variant]}>
        {links.map((link, index) => (
          <Link
            key={index}
            to={link.href}
            className={linkStyles[variant]}
          >
            <div className={cn(
              "flex items-center gap-2",
              variant === "grid" && "flex-col"
            )}>
              {link.icon && (
                <link.icon className={cn(
                  "h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors",
                  variant === "grid" && "h-6 w-6"
                )} />
              )}
              <span className={cn(
                variant === "grid" && "text-center font-medium"
              )}>{link.label}</span>
            </div>
            
            {variant === "vertical" && link.description && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                {link.description}
              </span>
            )}
            
            {link.badge !== undefined && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                badgeStyles[link.badgeVariant || "default"]
              )}>
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default QuickLinks;
