
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet } from "lucide-react";
import { Link } from "react-router-dom";

const ProjectsHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
        <p className="text-muted-foreground">
          Gérez et suivez tous vos projets de construction
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link to="/projects/import">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Import/Export
          </Link>
        </Button>
        <Button asChild>
          <Link to="/projects/create">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Projet
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ProjectsHeader;
