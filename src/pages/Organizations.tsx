import { motion } from "framer-motion";
import OrganizationsManager from "@/components/admin/OrganizationsManager";
import { AppLayout } from "@/components/layout";
import { useLanguage } from "@/contexts/LanguageContext";

const Organizations = () => {
  const { t } = useLanguage();

  return (
    <AppLayout
      pageTitle={t("auto.organizations.organisations")}
      pageDescription={t("auto.organizations.description")}
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
};

export default Organizations;
