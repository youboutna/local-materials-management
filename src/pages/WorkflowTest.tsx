import React from 'react';
import TenderWorkflowSteps from '@/components/tenders/TenderWorkflowSteps';
import WorkflowStepsManager from '@/components/tenders/WorkflowStepsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const WorkflowTest = () => {
  // Use a known tender ID that has workflow steps
  const tenderId = '3da4363a-2b56-44b5-a3f8-bf74e6642a60';

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Workflow Steps</h1>
      
      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="manage">Gestion</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workflow">
          <TenderWorkflowSteps 
            tenderId={tenderId}
            projectId="test-project"
            readonly={false}
          />
        </TabsContent>
        
        <TabsContent value="manage">
          <WorkflowStepsManager tenderId={tenderId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowTest;