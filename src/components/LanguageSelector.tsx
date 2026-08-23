/**
 * LanguageSelector — sélecteur de langue (français par défaut, arabe, anglais).
 * Utilise LanguageContext ; les labels métier sont résolus via useI18n.
 */
import React from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';

const LANGUAGE_OPTIONS: { value: Language; flag: string; label: string }[] = [
  { value: 'fr', flag: '🇫🇷', label: 'Français' },
  { value: 'ar', flag: '🇲🇷', label: 'العربية' },
  { value: 'en', flag: '🇬🇧', label: 'English' },
];

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
      <SelectTrigger className={className ?? 'w-[150px]'} aria-label="Langue de l'interface">
        <Languages className="h-4 w-4 mr-2 shrink-0 opacity-70" aria-hidden="true" />
        <SelectValue placeholder="Langue" />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="mr-2">{option.flag}</span>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
