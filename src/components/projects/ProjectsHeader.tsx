
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectsHeaderProps {
  title: string;
  description?: string;
  addButton?: boolean;
}

export default function ProjectsHeader({
  title = "Projets",  // Default value added
  description,
  addButton = true,
}: ProjectsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-adrar-900">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-lg">{description}</p>
        )}
      </div>
      
    </div>
  );
}
