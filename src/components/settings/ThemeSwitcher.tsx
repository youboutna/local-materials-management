/**
 * ThemeSwitcher — sélecteur de thème visuel (référentiel UI_THEMES) + bascule sombre.
 * Purement présentation : délègue au UiThemeContext.
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, Moon, Palette, Sun } from 'lucide-react';
import { useUiTheme } from '@/contexts/UiThemeContext';
import { cn } from '@/lib/utils';
import { T } from '@/components/i18n/T';

interface ThemeSwitcherProps {
  className?: string;
  /** Affiche le libellé du thème courant à côté de l'icône. */
  showLabel?: boolean;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className, showLabel = false }) => {
  const { theme, themes, themeId, setThemeId, darkMode, toggleDarkMode } = useUiTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? 'sm' : 'icon'}
          className={cn('gap-2', className)}
          aria-label="Changer de thème"
        >
          <Palette className="h-4 w-4" />
          {showLabel && <span className="text-xs">{theme.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel><T k="auto.themeswitcher.theme_de_l_application" fallback="Thème de l'application" /></DropdownMenuLabel>
        {themes.map((entry) => (
          <DropdownMenuItem
            key={entry.id}
            onClick={() => setThemeId(entry.id)}
            className="flex items-start gap-3 py-2"
          >
            <span className="mt-1 flex gap-1">
              {[entry.preview.primary, entry.preview.accent, entry.preview.background].map((c) => (
                <span
                  key={c}
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ backgroundColor: `hsl(${c})` }}
                />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium">
                {entry.label}
                {entry.id === themeId && <Check className="h-3 w-3 text-primary" />}
              </span>
              <span className="block text-xs text-muted-foreground">{entry.description}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleDarkMode} className="gap-2">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="text-sm">{darkMode ? 'Mode clair' : 'Mode sombre'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;
