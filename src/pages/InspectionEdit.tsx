import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

const InspectionEdit = () => {
  const { t } = useLanguage();
  const { id } = useParams();

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('inspection.edit.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              {t('inspection.edit.description')} : { id }
            </p>
            <Badge variant="secondary">{t('inspection.edit.in_development')}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionEdit;
