import React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: "fr", name: t("language.french") || "Français", flag: "🇫🇷" },
    { code: "ar", name: t("language.arabic") || "العربية", flag: "🇲🇷" },
    { code: "en", name: t("language.english") || "English", flag: "🇬🇧" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="text-white hover:text-gray-200"
        >
          <Globe className="h-4 w-4 mr-2" />
          {language === "fr"
            ? t("language.french") || "Français"
            : language === "en"
            ? t("language.english") || "English"
            : t("language.arabic") || "العربية"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="cursor-pointer"
          >
            <div className="flex justify-between w-full items-center">
              <span>
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </span>
              {language === lang.code && <Check className="h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
