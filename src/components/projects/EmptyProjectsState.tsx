
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const EmptyProjectsState = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-16"
    >
      <h3 className="text-xl font-serif text-adrar-700 mb-2">Aucun projet trouvé</h3>
      <p className="text-adrar-500 mb-6">Modifiez vos critères de recherche ou créez un nouveau projet.</p>
      <Link to="/projects/new">
        <Button className="bg-terracotta-500 hover:bg-terracotta-600">
          <Plus className="mr-2 h-4 w-4" />
          Créer un nouveau projet
        </Button>
      </Link>
    </motion.div>
  );
};

export default EmptyProjectsState;
