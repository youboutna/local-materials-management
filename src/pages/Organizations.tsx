import { motion } from "framer-motion";
import OrganizationsManager from "@/components/admin/OrganizationsManager";
import { AppLayout } from "@/components/layout";

const Organizations = () => (
  <AppLayout
    pageTitle="Organisations"
    pageDescription="Créer, modifier et hiérarchiser les organisations ; définir l'organisation propriétaire par défaut des projets"
  >
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <OrganizationsManager />
    </motion.div>
  </AppLayout>
);

export default Organizations;
