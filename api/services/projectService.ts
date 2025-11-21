import { supabase } from '../config/supabase';
import { ApiResponse, Project, SectorBlueprint } from '../../shared/types';

export class ProjectService {
  static async getProjects(userId: string): Promise<ApiResponse<Project[]>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get projects error:', error);
      return { success: false, error: 'Failed to fetch projects' };
    }
  }

  static async getProject(userId: string, projectId: string): Promise<ApiResponse<Project>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('owner_id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get project error:', error);
      return { success: false, error: 'Failed to fetch project' };
    }
  }

  static async createProject(
    userId: string, 
    name: string, 
    description: string, 
    sector: string, 
    projectType: string
  ): Promise<ApiResponse<Project>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner_id: userId,
          name,
          description,
          sector,
          project_type: projectType
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create project error:', error);
      return { success: false, error: 'Failed to create project' };
    }
  }

  static async updateProject(
    userId: string, 
    projectId: string, 
    updates: Partial<Project>
  ): Promise<ApiResponse<Project>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update project error:', error);
      return { success: false, error: 'Failed to update project' };
    }
  }

  static async deleteProject(userId: string, projectId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'archived' })
        .eq('id', projectId)
        .eq('owner_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete project error:', error);
      return { success: false, error: 'Failed to archive project' };
    }
  }

  static async getSectorBlueprints(): Promise<ApiResponse<Pick<SectorBlueprint, 'id' | 'sector_code' | 'name' | 'short_description' | 'created_at'>[]>> {
    try {
      const { data, error } = await supabase
        .from('sector_blueprints')
        .select('id, sector_code, name, short_description, created_at')
        .order('name');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get sector blueprints error:', error);
      return { success: false, error: 'Failed to fetch sector blueprints' };
    }
  }

  static async getSectorBlueprint(sectorCode: string): Promise<ApiResponse<SectorBlueprint>> {
    try {
      const { data, error } = await supabase
        .from('sector_blueprints')
        .select('*')
        .eq('sector_code', sectorCode)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get sector blueprint error:', error);
      return { success: false, error: 'Failed to fetch sector blueprint' };
    }
  }
}