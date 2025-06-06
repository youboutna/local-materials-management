import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('nav.profile')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('auth.email')}</label>
              <p className="text-gray-900">{user?.email || t('materials.not_defined')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('auth.full_name')}</label>
              <p className="text-gray-900">{user?.user_metadata?.full_name || t('materials.not_defined')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('roles.user')}</label>
              <p className="text-gray-900">{user?.user_metadata?.role || t('roles.user')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
