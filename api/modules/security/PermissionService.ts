import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'

export class PermissionService {
    /**
     * Check if an agent has permission to access a project
     */
    async checkAgentAccess(userId: string, projectId: string, agentName: string): Promise<boolean> {
        try {
            // First check if the user owns the project (implicit permission for now, or strict?)
            // For Data Pods, we want explicit permission even for the user's own agents if we want high security.
            // But usually, if the user triggers it, it's fine.
            // Let's check the explicit permission table.

            const { data, error } = await supabase
                .from('agent_permissions')
                .select('id')
                .eq('user_id', userId)
                .eq('project_id', projectId)
                .eq('agent_name', agentName)
                .single()

            if (error || !data) {
                logger.warn({ userId, projectId, agentName }, 'Agent permission denied')
                return false
            }

            return true
        } catch (error) {
            logger.error({ err: error, userId, projectId, agentName }, 'Permission check failed')
            return false
        }
    }

    /**
     * Grant permission to an agent
     */
    async grantPermission(userId: string, projectId: string, agentName: string, level: 'read' | 'write' = 'read'): Promise<void> {
        const { error } = await supabase
            .from('agent_permissions')
            .upsert({
                user_id: userId,
                project_id: projectId,
                agent_name: agentName,
                permission_level: level
            }, { onConflict: 'project_id, agent_name' })

        if (error) {
            logger.error({ err: error, userId, projectId, agentName }, 'Failed to grant permission')
            throw error
        }
    }
}

export const permissionService = new PermissionService()
