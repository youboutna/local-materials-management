
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profil utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{user?.email || 'Non renseigné'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nom complet</label>
              <p className="text-gray-900">{user?.user_metadata?.full_name || 'Non renseigné'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Rôle</label>
              <p className="text-gray-900">{user?.user_metadata?.role || 'Utilisateur'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
