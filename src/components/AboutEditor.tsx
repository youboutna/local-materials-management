import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/use-auth';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AboutEditor = () => {
  const { user: authUser } = useAuth();
  const { user: keycloakUser, isAuthenticated } = useKeycloakAuth();
  const { t } = useLanguage(); // Add translation hook
  const [isEditing, setIsEditing] = useState(false);
  const [aboutContent, setAboutContent] = useState(`
Notre système de gestion de construction/Infrastructure  ERP,HadraTech-GPI , est conçu pour simplifier et optimiser tous les aspects de vos projets de construction. 

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

  console.log('🔍 AboutEditor - authUser:', !!authUser, 'keycloakUser:', !!keycloakUser, 'isAuthenticated:', isAuthenticated, 'final:', isUserAuthenticated);

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
      title: t('toast.saved_title'),
      description: t('toast.saved_description'),
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
                {t('footer.about')}
              </CardTitle>
              {/* Only show edit button for authenticated users */}
              {isUserAuthenticated && !isEditing && (
                <Button 
                  onClick={handleEdit}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  {t('project.edit')}
                </Button>
              )}
              {/* Only show save/cancel buttons for authenticated users when editing */}
              {isUserAuthenticated && isEditing && (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {t('project.save')}
                  </Button>
                  <Button 
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    {t('project.cancel')}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Only allow editing for authenticated users */}
            {isUserAuthenticated && isEditing ? (
              <div className="space-y-4">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[300px] text-base leading-relaxed"
                  placeholder={t('footer.about_desc')}
                />
                <p className="text-sm text-gray-500">
                  {t('footer.about_desc')}
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
