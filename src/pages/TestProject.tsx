import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestProject = () => {
  const navigate = useNavigate();

  const testProjects = [
    { id: '7ed833f2-2e16-4154-a8e4-a626b245be7c', title: 'Restauration du Fort d\'Atar' },
    { id: '5d0240f7-4ef9-44f9-a814-1fc62c1cb006', title: 'Centre Culturel en Argile' },
    { id: 'a5b81484-7f7c-4858-abcf-fdb2aaf0fd03', title: 'École Communautaire Durable' },
  ];

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test des projets - Diagnostic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Cliquez sur un projet pour tester le chargement des données :</p>
          {testProjects.map((project) => (
            <Button
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              variant="outline"
              className="w-full justify-start"
            >
              {project.title}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestProject;