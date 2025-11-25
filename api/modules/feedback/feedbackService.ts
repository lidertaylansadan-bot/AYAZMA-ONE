import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'

export interface UserFeedback {
    id: string
    agentRunId: string
    userId: string
    rating: number // 1-5
    comment?: string
    createdAt: Date
}

export interface FeedbackInput {
    agentRunId: string
    userId: string
    rating: number
    comment?: string
}

import { evalService } from '../eval/evalService.js'

export class FeedbackService {
    /**
     * Submit user feedback for an agent run
     */
    async submitFeedback(input: FeedbackInput): Promise<UserFeedback> {
        try {
            // Validate rating
            if (input.rating < 1 || input.rating > 5) {
                throw new Error('Rating must be between 1 and 5')
            }

            const { data, error } = await supabase
                .from('user_feedback')
                .insert({
                    agent_run_id: input.agentRunId,
                    user_id: input.userId,
                    rating: input.rating,
                    comment: input.comment
                })
                .select()
                .single()

            if (error) {
                logger.error({ err: error, input }, 'Failed to submit feedback')
                throw new Error('Failed to submit feedback')
            }

            logger.info({ feedbackId: data.id, agentRunId: input.agentRunId }, 'Feedback submitted')

            // Trigger evaluation update asynchronously
            evalService.incorporateUserFeedback(input.agentRunId).catch(err => {
                logger.error({ err, agentRunId: input.agentRunId }, 'Failed to trigger evaluation update from feedback')
            })

            return {
                id: data.id,
                agentRunId: data.agent_run_id,
                userId: data.user_id,
                rating: data.rating,
                comment: data.comment,
                createdAt: new Date(data.created_at)
            }
        } catch (error) {
            logger.error({ err: error }, 'Error in submitFeedback')
            throw error
        }
    }

    /**
     * Get feedback for a specific agent run
     */
    async getFeedbackForRun(agentRunId: string): Promise<UserFeedback | null> {
        try {
            const { data, error } = await supabase
                .from('user_feedback')
                .select('*')
                .eq('agent_run_id', agentRunId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') { // Not found
                    return null
                }
                logger.error({ err: error, agentRunId }, 'Failed to fetch feedback')
                throw new Error('Failed to fetch feedback')
            }

            return {
                id: data.id,
                agentRunId: data.agent_run_id,
                userId: data.user_id,
                rating: data.rating,
                comment: data.comment,
                createdAt: new Date(data.created_at)
            }
        } catch (error) {
            logger.error({ err: error }, 'Error in getFeedbackForRun')
            throw error
        }
    }
}

export const feedbackService = new FeedbackService()
