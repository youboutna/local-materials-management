
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ProjectsHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-serif text-adrar-800 mb-2">Projets</h1>
        <p className="text-gray-600">
          Gérez et suivez tous vos projets de construction
        </p>
      </div>
      <Link to="/projects/create">
        <Button className="bg-terracotta-500 hover:bg-terracotta-600 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un projet
        </Button>
      </Link>
    </div>
  );
};

export default ProjectsHeader;
