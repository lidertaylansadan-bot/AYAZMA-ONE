import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'

export interface AgentHistoryEntry {
    id: string
    agentName: string
    taskType: string
    input: any
    output: any
    createdAt: string
}

export class HistoryManager {
    /**
     * Get recent history for a specific agent or task type in a project
     */
    async getProjectHistory(projectId: string, limit: number = 5): Promise<AgentHistoryEntry[]> {
        const { data, error } = await supabase
            .from('agent_activities') // Assuming this table exists based on requirements
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            logger.error({ err: error, projectId }, 'Failed to fetch project history')
            return []
        }

        return data.map(row => ({
            id: row.id,
            agentName: row.agent_name,
            taskType: row.activity_type,
            input: row.input_payload,
            output: row.output_payload,
            createdAt: row.created_at
        }))
    }

    /**
     * Save an agent activity entry
     */
    async saveActivity(projectId: string, entry: Omit<AgentHistoryEntry, 'id' | 'createdAt'>): Promise<void> {
        const { error } = await supabase
            .from('agent_activities')
            .insert({
                project_id: projectId,
                agent_name: entry.agentName,
                activity_type: entry.taskType,
                input_payload: entry.input,
                output_payload: entry.output
            })

        if (error) {
            logger.error({ err: error, projectId }, 'Failed to save agent activity')
        }
    }
}

export const historyManager = new HistoryManager()
