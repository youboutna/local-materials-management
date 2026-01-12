import React from "react";
import { motion } from "framer-motion";
import TaskAssignments from "@/components/documents/TaskAssignments";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout";

const Tasks = () => {
  const { t } = useLanguage();

  return (
    <AppLayout
      pageTitle={t("task.title")}
      pageDescription={t("task.subtitle") || "Assignez et suivez les tâches de votre équipe"}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <TaskAssignments />
      </motion.div>
    </AppLayout>
  );
};

export default Tasks;
