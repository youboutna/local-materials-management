
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectLocation {
  name: string;
  value: number;
  count?: number; // For backward compatibility
  color?: string;
}

interface ProjectDistributionChartProps {
  data: ProjectLocation[];
}

const ProjectDistributionChart: React.FC<ProjectDistributionChartProps> = ({ data }) => {
  const { t } = useLanguage();
  
  // Normalize data to use 'value' consistently
  const normalizedData = data.map(item => ({
    ...item,
    value: item.value ?? item.count ?? 0
  }));
  
  // Default colors if not provided
  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  
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
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} projets`, 'Nombre']} />
        <Legend />
        <Bar dataKey="value" name="Nombre de projets" fill="#8884d8">
          {normalizedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || defaultColors[index % defaultColors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProjectDistributionChart;
