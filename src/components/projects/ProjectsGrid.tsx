import React from "react";
import { ProjectData } from "@/dtos/entities/ProjectDTO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectsGridProps {
  projects: ProjectData[];
  isLoading?: boolean;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({ projects, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div key={project.id} className="animate-in fade-in duration-300">
          <Card className="h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-lg font-semibold line-clamp-2 flex-1 min-w-0">
                  <span className="truncate block max-w-full">
                    {project.title}
                  </span>
                </CardTitle>
                <Badge
                  variant={
                    project.status === "en cours" ? "default" : "secondary"
                  }
                  className="flex-shrink-0 whitespace-nowrap"
                >
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm line-clamp-3">
                {project.description}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{project.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {new Date(project.startDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{project.teamSize} membres</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>{project.budget.toLocaleString()} MRO</span>
                </div>
              </div>

              <div className="pt-4">
                <Link to={`/projects/${project.id}`}>
                  <Button className="w-full">Voir les détails</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default ProjectsGrid;
