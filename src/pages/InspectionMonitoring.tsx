import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DigitalInspectionForm from '@/components/inspections/DigitalInspectionForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const InspectionMonitoringPage = () => {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🔍 Monitoring Inspections</h1>
            <p className="text-gray-600 mt-2">
              Système de gestion numérique des inspections et surveillance de conformité
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="create">Nouvelle Inspection</TabsTrigger>
              <TabsTrigger value="scheduled">Programmées</TabsTrigger>
              <TabsTrigger value="overdue">En Retard</TabsTrigger>
              <TabsTrigger value="compliance">Conformité</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Créer une Inspection Numérique</CardTitle>
                  <CardDescription>
                    Programmez une nouvelle inspection avec géolocalisation et checklists obligatoires
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DigitalInspectionForm 
                    projectId="demo-project-id" 
                    inspectorId="demo-inspector-id" 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-6">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Inspection Sécurité - Projet Axe Idini
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <MapPin className="h-4 w-4" />
                          Latitude: 18.0863, Longitude: -15.9692
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        18/08/2025 14:00
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <strong>Inspecteur:</strong> Ahmed Ben Ali
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Type:</strong> Inspection de sécurité
                        </p>
                      </div>
                      <Button size="sm">Démarrer</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Inspection Qualité - Structure R+2
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <MapPin className="h-4 w-4" />
                          Latitude: 18.0901, Longitude: -15.9756
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        19/08/2025 09:00
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <strong>Inspecteur:</strong> Fatou Sall
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Type:</strong> Inspection qualité
                        </p>
                      </div>
                      <Button size="sm" variant="outline">Programmer</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="overdue" className="space-y-6">
              <div className="grid gap-4">
                <Card className="border-red-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                          <AlertTriangle className="h-5 w-5" />
                          Inspection Milestone - Pôle Halterique
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <MapPin className="h-4 w-4" />
                          Latitude: 18.0823, Longitude: -15.9635
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">
                        Retard: 3 jours
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <strong>Inspecteur:</strong> Mohamed Ould Cheikh
                        </p>
                        <p className="text-sm text-red-600">
                          <strong>Échéance dépassée:</strong> 15/08/2025
                        </p>
                      </div>
                      <div className="space-x-2">
                        <Button size="sm" variant="destructive">Relancer</Button>
                        <Button size="sm" variant="outline">Réassigner</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <div className="grid gap-4">
                <Card className="border-green-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-5 w-5" />
                          Conformité Excellente - Fouilles Tani
                        </CardTitle>
                        <CardDescription>
                          Toutes les vérifications passées avec succès
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        100% Conforme
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Date:</strong> 16/08/2025
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Inspecteur:</strong> Aicha Mint Vall
                      </p>
                      <p className="text-sm text-green-600">
                        ✅ Équipements de sécurité | ✅ Qualité matériaux | ✅ Respect normes
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                          <AlertTriangle className="h-5 w-5" />
                          Non-conformité Détectée - Électrification Rurale
                        </CardTitle>
                        <CardDescription>
                          Défauts mineurs nécessitant correction
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        2 Défauts
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Date:</strong> 17/08/2025
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Inspecteur:</strong> Omar Ba
                      </p>
                      <p className="text-sm text-orange-600">
                        ⚠️ Câblage non conforme | ⚠️ Documentation manquante
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Délai correction:</strong> 20/08/2025
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InspectionMonitoringPage;