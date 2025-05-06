
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectLocation {
  name: string;
  count: number;
}

interface ProjectDistributionChartProps {
  data: ProjectLocation[];
}

const ProjectDistributionChart: React.FC<ProjectDistributionChartProps> = ({ data }) => {
  const { t } = useLanguage();
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} ${t('projects.projects')}`, t('projects.count')]} />
        <Legend />
        <Bar dataKey="count" name={t('projects.projectCount')} fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProjectDistributionChart;
