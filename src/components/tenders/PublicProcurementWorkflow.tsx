
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Megaphone, 
  FileText, 
  Award, 
  Shield,
  ChevronRight
} from 'lucide-react';

const PublicProcurementWorkflow = () => {
  const workflowSteps = [
    {
      id: 1,
      title: "Planification des achats",
      icon: Calendar,
      description: "Élaboration du Plan Annuel d'Achats (PAA) et du Plan de Passation des Marchés (PPM)",
      details: [
        "Estimation des ressources financières nécessaires",
        "Planification des achats par catégorie (personnel, locations, assurances, etc.)",
        "Définition des modalités de planification"
      ],
      color: "bg-blue-100 border-blue-300"
    },
    {
      id: 2,
      title: "Publicité et appel d'offres",
      icon: Megaphone,
      description: "Publication des avis selon les procédures formalisées ou adaptées",
      details: [
        "Publication via le Portail National des Marchés Publics",
        "Diffusion dans les journaux d'annonces légales",
        "Inscription des candidats potentiels sur le portail",
        "Notifications d'opportunités aux candidats"
      ],
      color: "bg-green-100 border-green-300"
    },
    {
      id: 3,
      title: "Réception et analyse des offres",
      icon: FileText,
      description: "Analyse des offres par la Commission de Passation des Marchés Publics (CPMP)",
      details: [
        "Soumission des dossiers techniques par les candidats",
        "Analyse par la CPMP présidée par la PRMP",
        "Assistance de la sous-commission d'analyse des offres",
        "Évaluation de la conformité des offres"
      ],
      color: "bg-yellow-100 border-yellow-300"
    },
    {
      id: 4,
      title: "Attribution du marché",
      icon: Award,
      description: "Attribution au soumissionnaire présentant l'offre économiquement la plus avantageuse",
      details: [
        "Sélection basée sur le critère du prix ou du coût",
        "Choix de l'offre économiquement la plus avantageuse",
        "Publication de l'avis d'attribution dans les 30 jours",
        "Signature du marché avec l'attributaire"
      ],
      color: "bg-purple-100 border-purple-300"
    },
    {
      id: 5,
      title: "Contrôle et régulation",
      icon: Shield,
      description: "Contrôle par la CNCMP et régulation par l'ARMP",
      details: [
        "Contrôle a priori et a posteriori par la CNCMP",
        "Vérification de la régularité des procédures",
        "Régulation par l'ARMP (Conseil de Régulation, Commission de Règlement des Différends)",
        "Commission Disciplinaire pour les sanctions"
      ],
      color: "bg-red-100 border-red-300"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Workflow des Marchés Publics en Mauritanie
        </CardTitle>
        <p className="text-sm text-gray-600">
          Étapes générales de la procédure des marchés publics utilisée par les entreprises publiques
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workflowSteps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={step.id} className="relative">
                <div className={`border-2 rounded-lg p-4 ${step.color}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <IconComponent className="h-5 w-5 text-gray-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Étape {step.id}
                        </Badge>
                        <h3 className="font-semibold text-lg">{step.title}</h3>
                      </div>
                      <p className="text-gray-700 mb-3">{step.description}</p>
                      <ul className="space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {index < workflowSteps.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ChevronRight className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicProcurementWorkflow;
