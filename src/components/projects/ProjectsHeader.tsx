
import { motion } from 'framer-motion';

const ProjectsHeader = () => {
  return (
    <div className="mb-8">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-serif font-bold text-adrar-800"
      >
        Projets
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-adrar-600"
      >
        Découvrez nos projets de construction utilisant les matériaux locaux
      </motion.p>
    </div>
  );
};

export default ProjectsHeader;
