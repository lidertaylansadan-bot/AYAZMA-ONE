import { supabase } from '../config/supabase';
import { 
  ApiResponse, 
  AppWizardSession, 
  WorkflowWizardSession, 
  ContentWizardSession 
} from '../../shared/types';

export class WizardService {
  static async getAppWizardSessions(userId: string, projectId: string): Promise<ApiResponse<AppWizardSession[]>> {
    try {
      const { data, error } = await supabase
        .from('app_wizard_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get app wizard sessions error:', error);
      return { success: false, error: 'Failed to fetch app wizard sessions' };
    }
  }

  static async createAppWizardSession(
    userId: string, 
    projectId: string, 
    answers: any
  ): Promise<ApiResponse<AppWizardSession>> {
    try {
      const { data, error } = await supabase
        .from('app_wizard_sessions')
        .insert({
          user_id: userId,
          project_id: projectId,
          answers
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create app wizard session error:', error);
      return { success: false, error: 'Failed to create app wizard session' };
    }
  }

  static async getWorkflowWizardSessions(userId: string, projectId: string): Promise<ApiResponse<WorkflowWizardSession[]>> {
    try {
      const { data, error } = await supabase
        .from('workflow_wizard_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get workflow wizard sessions error:', error);
      return { success: false, error: 'Failed to fetch workflow wizard sessions' };
    }
  }

  static async createWorkflowWizardSession(
    userId: string, 
    projectId: string, 
    answers: any
  ): Promise<ApiResponse<WorkflowWizardSession>> {
    try {
      const { data, error } = await supabase
        .from('workflow_wizard_sessions')
        .insert({
          user_id: userId,
          project_id: projectId,
          answers
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create workflow wizard session error:', error);
      return { success: false, error: 'Failed to create workflow wizard session' };
    }
  }

  static async getContentWizardSessions(userId: string, projectId: string): Promise<ApiResponse<ContentWizardSession[]>> {
    try {
      const { data, error } = await supabase
        .from('content_wizard_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get content wizard sessions error:', error);
      return { success: false, error: 'Failed to fetch content wizard sessions' };
    }
  }

  static async createContentWizardSession(
    userId: string, 
    projectId: string, 
    answers: any
  ): Promise<ApiResponse<ContentWizardSession>> {
    try {
      const { data, error } = await supabase
        .from('content_wizard_sessions')
        .insert({
          user_id: userId,
          project_id: projectId,
          answers
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create content wizard session error:', error);
      return { success: false, error: 'Failed to create content wizard session' };
    }
  }
}