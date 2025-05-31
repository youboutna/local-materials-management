
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, List } from 'lucide-react';
import QuantityTakeoffForm from './QuantityTakeoffForm';
import QuantityTakeoffsList from './QuantityTakeoffsList';

interface QuantityTakeoffsProps {
  projectId: string;
}

const QuantityTakeoffs = ({ projectId }: QuantityTakeoffsProps) => {
  const [activeTab, setActiveTab] = useState('list');

  const handleFormSuccess = () => {
    // Switch to list tab after successful form submission
    setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Liste des Métrés
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Nouveau Métré
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <QuantityTakeoffsList projectId={projectId} />
        </TabsContent>

        <TabsContent value="form">
          <QuantityTakeoffForm projectId={projectId} onSubmitSuccess={handleFormSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuantityTakeoffs;
