import { supabase } from '@/integrations/supabase/client';
import { MaterialDTO as MaterialEntity } from '@/dtos/entities/MaterialDTO';

// Local type for project_materials table rows
interface ProjectMaterialEntity {
  id: string;
  project_id: string;
  material_id: string;
  quantity: number;
  [key: string]: unknown;
}
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class MaterialRepository {
  static async getAllMaterials(): Promise<MaterialEntity[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch materials', error);
      return (data || []) as MaterialEntity[];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch materials', error);
    }
  }

  static async getProjectMaterials(projectId: string): Promise<(ProjectMaterialEntity & { materials: MaterialEntity })[]> {
    try {
      const { data, error } = await supabase
        .from('project_materials')
        .select('*, materials(*)')
        .eq('project_id', projectId);

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch project materials', error);
      return (data || []) as (ProjectMaterialEntity & { materials: MaterialEntity })[];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch project materials', error);
    }
  }

  static async addMaterialToProject(
    projectId: string,
    materialId: string,
    quantity: number
  ): Promise<ProjectMaterialEntity> {
    try {
      const { data, error } = await supabase
        .from('project_materials')
        .insert({
          project_id: projectId,
          material_id: materialId,
          quantity
        })
        .select()
        .single();

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to add material to project', error);
      if (!data) throw new AppError(ErrorCode.NOT_FOUND, 'Material not added');
      
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to add material to project', error);
    }
  }

  static async updateProjectMaterial(
    id: string,
    updates: Partial<ProjectMaterialEntity>
  ): Promise<ProjectMaterialEntity> {
    try {
      const { data, error } = await supabase
        .from('project_materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update project material', error);
      if (!data) throw new AppError(ErrorCode.NOT_FOUND, 'Project material not found');
      
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update project material', error);
    }
  }

  static async removeMaterialFromProject(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_materials')
        .delete()
        .eq('id', id);

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to remove material from project', error);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to remove material from project', error);
    }
  }
}
