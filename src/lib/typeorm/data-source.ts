
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Project } from "./entities/Project";
import { Material } from "./entities/Material";
import { ProjectMaterial } from "./entities/ProjectMaterial";
import { Profile } from "./entities/Profile";

// Create a data source configuration that's compatible with browser environments
export const AppDataSource = new DataSource({
  type: "postgres",
  host: "huttgbybeuzeikaqfvam.supabase.co",
  port: 5432,
  username: "postgres",
  password: "postgres_password", // This is a placeholder. Use environment variables in production
  database: "postgres",
  synchronize: false,
  logging: false,
  entities: [Project, Material, ProjectMaterial, Profile],
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
});

// Initialize the data source with better error handling
export const initializeDataSource = async () => {
  if (AppDataSource.isInitialized) {
    console.log("Data Source is already initialized");
    return AppDataSource;
  }
  
  try {
    const dataSource = await AppDataSource.initialize();
    console.log("Data Source has been initialized successfully");
    return dataSource;
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    // Instead of throwing the error, return null to prevent app from crashing
    return null;
  }
};
