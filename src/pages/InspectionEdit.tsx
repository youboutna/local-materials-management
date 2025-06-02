
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const InspectionEdit = () => {
  const { id } = useParams();

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Modifier l'inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Modification de l'inspection avec l'ID: {id}
            </p>
            <Badge variant="secondary">En développement</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionEdit;
