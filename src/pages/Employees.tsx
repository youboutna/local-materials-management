import { motion } from "framer-motion";
import EmployeeManagement from "@/components/documents/EmployeeManagement";
import { useLanguage } from "@/contexts/LanguageContext";

const Employees = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-adrar-900 font-serif mb-2">
              {t("nav.employees") || "Employés"}
            </h1>
            <p className="text-gray-600">
              {t("employee.subtitle") ||
                "Gérer les employés et leur hiérarchie organisationnelle"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <EmployeeManagement />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Employees;
