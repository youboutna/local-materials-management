
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const EmptyProjectsState = () => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-16"
    >
      <h3 className="text-xl font-serif text-adrar-700 mb-2">
        {t("projects.empty_state.title")}
      </h3>
      <p className="text-adrar-500 mb-6">
        {t("projects.empty_state.description")}
      </p>
      <Link to="/projects/new">
        <Button className="bg-terracotta-500 hover:bg-terracotta-600">
          <Plus className="mr-2 h-4 w-4" />
          {t("projects.empty_state.create_button")}
        </Button>
      </Link>
    </motion.div>
  );
};

export default EmptyProjectsState;
