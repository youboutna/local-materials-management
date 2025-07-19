// Re-export types from the main types file
export type { ProjectData, ProjectStatus, ProjectWithPayments, Payment, Inspection } from '@/types/project';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, Eye } from 'lucide-react';
import { ProjectData } from '@/types/project';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import StatusBadge from './StatusBadge';

interface ProjectCardProps {
  project: ProjectData;
  index?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index = 0 }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleViewDetails = () => {
    navigate(`/projects/${project.id}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("projects.unknown_date");
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="h-full hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-white border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-lg font-serif text-adrar-800 line-clamp-2 flex-1 mr-3">
              {project.title}
            </CardTitle>
            <StatusBadge status={project.status} />
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-terracotta-500" />
              <span className="truncate">{project.location}</span>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-terracotta-500" />
              <span>{formatDate(project.startDate)}</span>
              {project.endDate && (
                <>
                  <span className="mx-2">-</span>
                  <span>{formatDate(project.endDate)}</span>
                </>
              )}
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2 text-terracotta-500" />
              <span>{project.teamSize} {t("projects.team_members")}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">{t("projects.progress")}</span>
              <span className="text-sm font-semibold text-adrar-700">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">{t("projects.budget")}</p>
              <p className="font-semibold text-adrar-800">{formatCurrency(project.budget)}</p>
            </div>
            
            <Button
              onClick={handleViewDetails}
              size="sm"
              className="bg-terracotta-500 hover:bg-terracotta-600 text-white"
            >
              <Eye className="w-4 h-4 mr-1" />
              {t("projects.view_details")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;