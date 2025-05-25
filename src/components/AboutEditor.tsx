
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AboutEditor = () => {
  const { user: authUser } = useAuth();
  const { user: keycloakUser, isAuthenticated } = useKeycloakAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [aboutContent, setAboutContent] = useState(`
Notre système de gestion de construction ERP est conçu pour simplifier et optimiser tous les aspects de vos projets de construction. 

Avec une interface intuitive et des fonctionnalités avancées, nous vous aidons à :
• Gérer efficacement vos projets de A à Z
• Suivre vos matériaux et inventaires en temps réel
• Collaborer avec vos équipes de manière transparente
• Analyser les performances avec des tableaux de bord détaillés

Notre plateforme s'adapte à tous types de projets de construction, des petites rénovations aux grands chantiers d'infrastructure.
  `.trim());
  const [editedContent, setEditedContent] = useState(aboutContent);

  // Check if user is authenticated (either through AuthContext or KeycloakAuthContext)
  const isUserAuthenticated = !!authUser || isAuthenticated;

  useEffect(() => {
    // Load saved content from localStorage
    const savedContent = localStorage.getItem('aboutSystemContent');
    if (savedContent) {
      setAboutContent(savedContent);
      setEditedContent(savedContent);
    }
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(aboutContent);
  };

  const handleSave = () => {
    setAboutContent(editedContent);
    localStorage.setItem('aboutSystemContent', editedContent);
    setIsEditing(false);
    toast({
      title: "Contenu sauvegardé",
      description: "Les informations sur le système ont été mises à jour avec succès.",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(aboutContent);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl md:text-4xl font-bold text-adrar-900 flex-1">
                À Propos du Système
              </CardTitle>
              {isUserAuthenticated && !isEditing && (
                <Button 
                  onClick={handleEdit}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Modifier
                </Button>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Sauvegarder
                  </Button>
                  <Button 
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Annuler
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[300px] text-base leading-relaxed"
                  placeholder="Décrivez votre système de gestion de construction..."
                />
                <p className="text-sm text-gray-500">
                  Utilisez ce champ pour décrire les avantages et fonctionnalités de votre système.
                </p>
              </div>
            ) : (
              <div className="prose max-w-none">
                <div className="text-lg text-adrar-600 leading-relaxed whitespace-pre-line">
                  {aboutContent}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AboutEditor;
