
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Project } from "./entities/Project";
import { Material } from "./entities/Material";
import { ProjectMaterial } from "./entities/ProjectMaterial";
import { Profile } from "./entities/Profile";

// For development purposes, we're using the same database as Supabase
// In production, you might want to use a different connection
export const AppDataSource = new DataSource({
  type: "postgres",
  host: "huttgbybeuzeikaqfvam.supabase.co",
  port: 5432,
  username: "postgres",
  password: "postgres_password", // This is a placeholder. Use environment variables in production
  database: "postgres",
  synchronize: false, // Set to false in production
  logging: true,
  entities: [Project, Material, ProjectMaterial, Profile],
  subscribers: [],
  migrations: [],
});

// Initialize the data source
export const initializeDataSource = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Data Source has been initialized!");
    }
    return AppDataSource;
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    throw error;
  }
};
