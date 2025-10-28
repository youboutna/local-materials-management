import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const ProjectsHeader = () => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("projects.header.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("projects.header.subtitle")}
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link to="/projects/import">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t("projects.header.import_export")}
          </Link>
        </Button>
        <Button asChild>
          <Link to="/projects/create">
            <Plus className="h-4 w-4 mr-2" />
            {t("projects.header.new_project")}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ProjectsHeader;
