
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectLocation {
  name: string;
  count?: number;
  value?: number;
}

interface ProjectDistributionChartProps {
  data: ProjectLocation[];
}

const ProjectDistributionChart: React.FC<ProjectDistributionChartProps> = ({ data }) => {
  const { t } = useLanguage();
  
  // Normalize data: support both 'count' and 'value' keys
  const normalizedData = data.map(item => ({
    name: item.name,
    count: item.count ?? item.value ?? 0,
  }));
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={normalizedData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} />
        <Tooltip formatter={(value) => [`${value} projets`, 'Nombre']} />
        <Legend />
        <Bar dataKey="count" name="Nombre de projets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProjectDistributionChart;
