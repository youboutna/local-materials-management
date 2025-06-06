import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ProgressIndicatorProps {
  value: number;
}

const ProgressIndicator = ({ value }: ProgressIndicatorProps) => {
  const { t } = useLanguage();
  const percentage = Math.max(0, Math.min(100, value)); // Ensure value is within 0-100 range

  return (
    <div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div 
          className="bg-terracotta-500 h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="text-xs text-right mt-1 text-gray-600">
        {t('progress.percentage', { value: percentage }) || `${percentage}%`}
      </div>
    </div>
  );
};

export default ProgressIndicator;
