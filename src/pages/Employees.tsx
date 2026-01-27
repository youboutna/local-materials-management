import { motion } from "framer-motion";
import EmployeeManagement from "@/components/documents/EmployeeManagement";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout";

const Employees = () => {
  const { t } = useLanguage();

  return (
    <AppLayout
      pageTitle={t("nav.employees") || "Employés"}
      pageDescription={t("employee.subtitle") || "Gérer les employés et leur hiérarchie organisationnelle"}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <EmployeeManagement />
      </motion.div>
    </AppLayout>
  );
};

export default Employees;
