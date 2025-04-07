import React from 'react';

export interface ProgressIndicatorProps {
  value: number;
}

const ProgressIndicator = ({ value }: ProgressIndicatorProps) => {
  const percentage = Math.max(0, Math.min(100, value)); // Ensure value is within 0-100 range

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div 
        className="bg-terracotta-500 h-2.5 rounded-full" 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default ProgressIndicator;
