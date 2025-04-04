
import { Repository } from "typeorm";
import { Project } from "../entities/Project";
import { AppDataSource, initializeDataSource } from "../data-source";
import { ProjectData } from "@/components/ProjectCard";

export class ProjectRepository {
  private repository: Repository<Project>;

  constructor() {
    this.repository = AppDataSource.getRepository(Project);
  }

  static async create(): Promise<ProjectRepository | null> {
    const dataSource = await initializeDataSource();
    if (!dataSource) {
      console.error("Could not initialize data source");
      return null;
    }
    return new ProjectRepository();
  }

  async findAll(): Promise<ProjectData[]> {
    try {
      const projects = await this.repository.find({
        order: {
          createdAt: "DESC"
        }
      });
      return projects.map(project => project.toProjectData());
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<ProjectData | null> {
    try {
      const project = await this.repository.findOne({
        where: { id }
      });
      return project ? project.toProjectData() : null;
    } catch (error) {
      console.error(`Error fetching project with id ${id}:`, error);
      throw error;
    }
  }

  async create(projectData: Omit<ProjectData, "id">): Promise<ProjectData> {
    try {
      // Transform from ProjectData to Project entity
      const project = new Project();
      project.title = projectData.title;
      project.description = projectData.description;
      project.location = projectData.location;
      project.status = projectData.status;
      project.progress = projectData.progress;
      project.budget = projectData.budget;
      project.startDate = new Date(projectData.startDate);
      project.endDate = projectData.endDate ? new Date(projectData.endDate) : null;
      project.thumbnail = projectData.thumbnail || '/img/project-placeholder.jpg';
      project.teamSize = projectData.teamSize;
      project.coordinatesLatitude = projectData.coordinates?.latitude || null;
      project.coordinatesLongitude = projectData.coordinates?.longitude || null;

      // Save the project
      const savedProject = await this.repository.save(project);
      return savedProject.toProjectData();
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  async update(id: string, projectData: Partial<ProjectData>): Promise<ProjectData | null> {
    try {
      // First, check if the project exists
      const project = await this.repository.findOne({
        where: { id }
      });

      if (!project) {
        return null;
      }

      // Update the project with new data
      if (projectData.title) project.title = projectData.title;
      if (projectData.description) project.description = projectData.description;
      if (projectData.location) project.location = projectData.location;
      if (projectData.status) project.status = projectData.status;
      if (projectData.progress !== undefined) project.progress = projectData.progress;
      if (projectData.budget !== undefined) project.budget = projectData.budget;
      if (projectData.startDate) project.startDate = new Date(projectData.startDate);
      if (projectData.endDate) project.endDate = new Date(projectData.endDate);
      if (projectData.thumbnail) project.thumbnail = projectData.thumbnail;
      if (projectData.teamSize !== undefined) project.teamSize = projectData.teamSize;
      if (projectData.coordinates) {
        project.coordinatesLatitude = projectData.coordinates.latitude;
        project.coordinatesLongitude = projectData.coordinates.longitude;
      }

      // Save the updated project
      const updatedProject = await this.repository.save(project);
      return updatedProject.toProjectData();
    } catch (error) {
      console.error(`Error updating project with id ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);
      return result.affected !== undefined && result.affected > 0;
    } catch (error) {
      console.error(`Error deleting project with id ${id}:`, error);
      throw error;
    }
  }
}
