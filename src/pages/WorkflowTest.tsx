import React from 'react';
import TenderWorkflowSteps from '@/components/tenders/TenderWorkflowSteps';

const WorkflowTest = () => {
  // Use a known tender ID that has workflow steps
  const tenderId = '3da4363a-2b56-44b5-a3f8-bf74e6642a60';

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Workflow Steps</h1>
      <TenderWorkflowSteps 
        tenderId={tenderId}
        projectId="test-project"
        readonly={false}
      />
    </div>
  );
};

export default WorkflowTest;