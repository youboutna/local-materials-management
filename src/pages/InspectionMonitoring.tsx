import React from 'react';
import RoleBasedInspectionMonitoring from '@/components/inspections/RoleBasedInspectionMonitoring';
import InspectionActions from '@/components/inspections/InspectionActions';

const InspectionMonitoringPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">🔍 Surveillance des Inspections</h1>
            <p className="text-muted-foreground mt-2">
              Système de gestion numérique des inspections avec responsabilités par rôle
            </p>
          </div>
          
          <RoleBasedInspectionMonitoring />
          <div className="mt-8">
            <InspectionActions 
              inspectionId="demo-inspection-001"
              projectId="demo-project-001"
              inspectorId="demo-inspector-001"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionMonitoringPage;