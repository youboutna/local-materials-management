
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowUpRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import ProgressIndicator from './ProgressIndicator';
import { ProjectStatus } from '@/types/project';

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  location: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  endDate?: string;
  thumbnail: string;
  teamSize: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface ProjectCardProps {
  project: ProjectData;
  index: number;
}

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format budget to locale string
  const formattedBudget = new Intl.NumberFormat('fr-MR', {
    style: 'currency',
    currency: 'MRU',
    maximumFractionDigits: 0,
  }).format(project.budget);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <Link 
        to={`/projects/${project.id}`}
        className="block h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="bg-white rounded-xl overflow-hidden shadow-elegant h-full transition-all duration-300 hover:shadow-soft transform hover:-translate-y-1">
          <div className="relative h-48 overflow-hidden">
            <img 
              src={project.thumbnail} 
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out"
              style={{ 
                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
              }}
            />
            <div className="absolute top-4 right-4">
              <StatusBadge status={project.status as any} />
            </div>
          </div>
          
          <div className="p-5">
            <h3 className="text-xl font-serif font-semibold text-adrar-800 mb-2 line-clamp-1">
              {project.title}
            </h3>
            
            <p className="text-adrar-600 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-adrar-600">
                <MapPin className="h-4 w-4 mr-2 text-terracotta-500" />
                <span>{project.location}</span>
                {project.coordinates && (
                  <span className="ml-1 text-xs text-adrar-500">
                    ({project.coordinates.latitude.toFixed(2)}, {project.coordinates.longitude.toFixed(2)})
                  </span>
                )}
              </div>
              
              <div className="flex items-center text-sm text-adrar-600">
                <Calendar className="h-4 w-4 mr-2 text-terracotta-500" />
                <span>{new Date(project.startDate).toLocaleDateString('fr-FR')}</span>
              </div>
              
              <div className="flex items-center text-sm text-adrar-600">
                <Users className="h-4 w-4 mr-2 text-terracotta-500" />
                <span>{project.teamSize} personnes</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-xs text-adrar-500">Budget</span>
                <p className="text-lg font-semibold text-adrar-800">{formattedBudget}</p>
              </div>
              <div className="inline-flex items-center text-terracotta-500 font-medium text-sm">
                Voir détails
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </div>
            </div>
            
            <ProgressIndicator value={project.progress} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProjectCard;
