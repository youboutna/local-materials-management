import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TaskAssignments from '@/components/documents/TaskAssignments';
import { useLanguage } from '@/contexts/LanguageContext';

const Tasks = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-serif text-adrar-800 mb-2">{t('task.title')}</h1>
              <p className="text-gray-600">
                {t('task.subtitle') || 'Assignez et suivez les tâches de votre équipe'}
              </p>
            </div>
            
            <TaskAssignments />
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Tasks;
