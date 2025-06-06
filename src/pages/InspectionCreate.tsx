
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
const InspectionCreate = () => {
  const { t } = useLanguage();
  const { projectId } = useParams();

  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Créer une inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
             {t('inspection.create.description')}  { projectId }
            </p>
            <Badge variant="secondary">{t('inspection.create.in_development')}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionCreate;
