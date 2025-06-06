import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const ProjectsHeader = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-serif text-adrar-800 mb-2">{t("projects.header.title")}</h1>
        <p className="text-gray-600">
          {t("projects.header.subtitle")}
        </p>
      </div>
      <Link to="/projects/create">
        <Button className="bg-terracotta-500 hover:bg-terracotta-600 text-white">
          <Plus className="mr-2 h-4 w-4" />
          {t("projects.header.add")}
        </Button>
      </Link>
    </div>
  );
};

export default ProjectsHeader;
