
import { useEffect, useState } from 'react';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield } from 'lucide-react';

const UserProfile = () => {
  const { user, logout } = useKeycloakAuth();
  const [initials, setInitials] = useState('');
  
  useEffect(() => {
    if (user) {
      // Get initials from username or first/last name
      if (user.firstName && user.lastName) {
        setInitials(`${user.firstName[0]}${user.lastName[0]}`.toUpperCase());
      } else if (user.username) {
        setInitials(user.username.substring(0, 2).toUpperCase());
      } else {
        setInitials('U');
      }
    }
  }, [user]);

  if (!user) {
    return <div>Chargement du profil utilisateur...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg border-none">
            <CardHeader className="bg-gradient-to-r from-adrar-700 to-terracotta-500 text-white rounded-t-lg pb-16">
              <CardTitle className="text-2xl font-serif">Mon Profil</CardTitle>
              <CardDescription className="text-gray-100">
                Informations de votre compte utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative -mt-12 mb-8 flex justify-center">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-adrar-100 text-adrar-700 text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">
                  {(user.firstName && user.lastName) 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}
                </h2>
                {user.email && (
                  <p className="text-gray-500 mt-1">{user.email}</p>
                )}
                <div className="flex justify-center gap-2 mt-3">
                  {user.roles.map((role) => (
                    <Badge 
                      key={role}
                      variant={role === 'admin' ? 'default' : 'outline'}
                      className={role === 'admin' ? 'bg-adrar-600' : ''}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Information utilisateur
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium text-gray-500">Nom d'utilisateur</div>
                    <div className="col-span-2">{user.username}</div>
                    
                    <div className="font-medium text-gray-500">ID Keycloak</div>
                    <div className="col-span-2">
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                        {user.keycloakId.slice(0, 8)}...{user.keycloakId.slice(-8)}
                      </code>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Permissions
                  </h3>
                  <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                    {user.roles.includes('admin') && (
                      <li>Accès complet à la gestion de projets</li>
                    )}
                    {user.roles.includes('user') && (
                      <li>Accès à la visualisation des projets</li>
                    )}
                    {user.roles.includes('material-manager') && (
                      <li>Gestion des matériaux</li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="border-t mt-8 pt-6 flex justify-end">
                <Button onClick={logout} variant="destructive" className="flex items-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UserProfile;
