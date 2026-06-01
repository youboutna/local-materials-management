import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ContextualSidebar } from "@/components/navigation/ContextualSidebar";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { PanelLeftClose, PanelLeft } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showBreadcrumb?: boolean;
  className?: string;
  contentClassName?: string;
  pageTitle?: string;
  pageDescription?: string;
  actions?: React.ReactNode;
}

// Routes where sidebar should be hidden
const noSidebarRoutes = [
  "/",
  "/auth",
  "/contact",
  "/terms",
  "/policy",
  "/reset-password",
  "/supplier-portal",
  "/supplier-tender",
  "/supplier-access",
  "/evaluation-access",
  "/supplier-password-reset",
];

export function AppLayout({
  children,
  showSidebar: forceShowSidebar,
  showBreadcrumb = true,
  className,
  contentClassName,
  pageTitle,
  pageDescription,
  actions,
}: AppLayoutProps) {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Check localStorage for preference
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  // Determine if sidebar should be shown based on route
  const shouldShowSidebar =
    forceShowSidebar !== undefined
      ? forceShowSidebar
      : !noSidebarRoutes.includes(location.pathname);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // On mobile, always collapse sidebar
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      {/* Sidebar */}
      {shouldShowSidebar && !isMobile && (
        <ContextualSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="fixed left-0 top-16 bottom-0 z-30"
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 min-w-0 transition-all duration-300",
          shouldShowSidebar && !isMobile && (sidebarCollapsed ? "ml-16" : "ml-64"),
          contentClassName
        )}
      >
        {/* Page Header with Breadcrumb */}
        {(showBreadcrumb || pageTitle || actions) && (
          <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b">
            <div className="container-responsive py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Sidebar Toggle (Desktop) */}
                  {shouldShowSidebar && !isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="flex-shrink-0 h-8 w-8"
                    >
                      {sidebarCollapsed ? (
                        <PanelLeft className="h-4 w-4" />
                      ) : (
                        <PanelLeftClose className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  <div className="min-w-0">
                    {/* Breadcrumb */}
                    {showBreadcrumb && <Breadcrumb className="mb-1" />}

                    {/* Page Title */}
                    {pageTitle && (
                      <div className="flex items-baseline gap-3">
                        <h1 className="text-lg font-semibold text-foreground truncate">
                          {pageTitle}
                        </h1>
                        {pageDescription && (
                          <span className="text-sm text-muted-foreground hidden md:block">
                            {pageDescription}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Page Actions */}
                {actions && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="container-responsive py-4">{children}</div>
      </main>
    </div>
  );
}

export default AppLayout;
