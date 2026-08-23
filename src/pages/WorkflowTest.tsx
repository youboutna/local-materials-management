import React from 'react';
import TenderWorkflowSteps from '@/components/tenders/TenderWorkflowSteps';
import WorkflowStepsManager from '@/components/tenders/WorkflowStepsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { T } from '@/components/i18n/T';

const WorkflowTest = () => {
  // Use a known tender ID that has workflow steps
  const tenderId = '3da4363a-2b56-44b5-a3f8-bf74e6642a60';

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6"><T k="auto.workflowtest.test_workflow_steps" fallback="Test Workflow Steps" /></h1>
      
      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-2">
          <TabsTrigger value="workflow"><T k="auto.workflowtest.workflow" fallback="Workflow" /></TabsTrigger>
          <TabsTrigger value="manage"><T k="auto.workflowtest.gestion" fallback="Gestion" /></TabsTrigger>
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