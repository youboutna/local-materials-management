import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MaterialSource {
  id: string;
  name: string;
  type: string;
  location: string;
  availability: number;
  lastUpdated: string;
}

const MaterialSources = ({
  sources = [],
  className
}: {
  sources?: MaterialSource[];
  className?: string;
}) => {
  const { t, language } = useLanguage();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center text-adrar-800 font-serif">
          <Building className="mr-2 h-5 w-5 text-terracotta-500" />
          {t('materials.sources_title') || 'Sources de matériaux'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sources.length > 0 ? (
          <div className="space-y-4">
            {sources.map(source => (
              <div key={source.id} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-adrar-700">{source.name}</h3>
                    <p className="text-sm text-adrar-600">{source.type}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${source.availability > 50 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {source.availability}% {t('materials.available') || 'disponible'}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-adrar-500 flex items-center">
                    <MapPin className="mr-1 h-3 w-3" /> {source.location}
                  </p>
                  <p className="text-xs text-adrar-400 mt-1">
                    {t('materials.last_updated') || 'Dernière mise à jour'}: {new Date(source.lastUpdated).toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-adrar-600">{t('materials.no_sources') || 'Aucune source de matériaux disponible'}</p>
            <p className="text-sm text-adrar-500 mt-1">{t('materials.add_sources_hint') || 'Ajoutez des sources de matériaux pour les voir ici'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialSources;
