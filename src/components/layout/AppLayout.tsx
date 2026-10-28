/**src/components/layout/AppLayout.tsx
 *
 * ✅ Corrigé :
 * - Support ARIA / skip-link
 * - Sidebar repliable avec focus visible
 * - Header sticky cohérent avec pt-16 du main App.tsx
 * - Responsive : pas de sidebar sur mobile (déjà le cas)
 * - Ajout d'un lien "Aller au contenu" (accessibilité)
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ContextualSidebar } from "@/components/navigation/ContextualSidebar";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { BrandBandsBackground } from "@/components/branding/BrandIdentity";

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

// Bornes de largeur de la sidebar étirable (px)
const SIDEBAR_MIN_WIDTH = 208;
const SIDEBAR_DEFAULT_WIDTH = 256;
const SIDEBAR_MAX_WIDTH = 480;

// Routes où la sidebar est masquée (pages publiques plein écran)
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  // Largeur étirable de la sidebar (persistée), bornée pour garder la place du contenu
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = Number(localStorage.getItem("sidebar-width"));
      if (Number.isFinite(stored) && stored >= SIDEBAR_MIN_WIDTH && stored <= SIDEBAR_MAX_WIDTH) {
        return stored;
      }
    }
    return SIDEBAR_DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const shouldShowSidebar =
    forceShowSidebar !== undefined
      ? forceShowSidebar
      : !noSidebarRoutes.includes(location.pathname);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("sidebar-width", String(sidebarWidth));
  }, [sidebarWidth]);

  // Glisser pour étirer la sidebar ; le suivi se fait sur window pour rester fluide
  const startResize = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = sidebarWidth;
      setIsResizing(true);
      const onMove = (moveEvent: PointerEvent) => {
        const next = startWidth + (moveEvent.clientX - startX);
        setSidebarWidth(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, next)));
      };
      const onUp = () => {
        setIsResizing(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [sidebarWidth],
  );

  const resetSidebarWidth = useCallback(
    () => setSidebarWidth(SIDEBAR_DEFAULT_WIDTH),
    [],
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = useCallback(
    () => setSidebarCollapsed((v) => !v),
    [],
  );

  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      {/* Skip link pour accessibilité clavier */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-terracotta-700 focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-terracotta-500"
      >
        Aller au contenu principal
      </a>

      {/* Sidebar (desktop uniquement) */}
      {shouldShowSidebar && !isMobile && (
        <ContextualSidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          className="fixed left-0 top-16 bottom-0 z-30"
        />
      )}

      {/* Contenu principal */}
      <main
        id="main-content"
        className={cn(
          "flex-1 min-w-0 transition-all duration-300",
          shouldShowSidebar && !isMobile && (sidebarCollapsed ? "ml-16" : "ml-64"),
          contentClassName,
        )}
        role="main"
      >
        {/* En-tête de page */}
        {(showBreadcrumb || pageTitle || actions) && (
          <div className="relative isolate sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b">
            <BrandBandsBackground />

            <div className="container-responsive py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {shouldShowSidebar && !isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSidebar}
                      className="flex-shrink-0 h-8 w-8 focus-visible:ring-2 focus-visible:ring-terracotta-500"
                      aria-label={
                        sidebarCollapsed
                          ? "Déployer la barre latérale"
                          : "Replier la barre latérale"
                      }
                      aria-expanded={!sidebarCollapsed}
                      aria-controls="contextual-sidebar"
                    >
                      {sidebarCollapsed ? (
                        <PanelLeft className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  )}

                  <div className="min-w-0">
                    {showBreadcrumb && <Breadcrumb className="mb-1" />}
                    {pageTitle && (
                      <div className="flex items-baseline gap-3 flex-wrap">
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

                {actions && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contenu de la page */}
        <div className="container-responsive py-4">{children}</div>
      </main>
    </div>
  );
}

export default AppLayout;