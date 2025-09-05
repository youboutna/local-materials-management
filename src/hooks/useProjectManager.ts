// useProjectManager.ts
import { useContext } from "react";
import { ProjectManagerContext } from "@Contexts/ProjectManagerContext";

export const useProjectManager = () => {
  const ctx = useContext(ProjectManagerContext);
  if (!ctx) {
    throw new Error(
      "useProjectManager doit être utilisé dans un ProjectManagerProvider"
    );
  }
  return ctx;
};