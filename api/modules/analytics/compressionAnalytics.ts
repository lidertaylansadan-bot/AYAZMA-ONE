// SPDX-License-Identifier: MIT
/**
 * Compression Analytics Module
 * Provides analytics queries for compression operations
 */

import { supabase } from '../../core/supabase.js';
import { logger } from '../../core/logger.js';

/**
 * Compression statistics for a project
 */
export interface CompressionStats {
    totalDocuments: number;
    compressedDocuments: number;
    totalRawTokens: number;
    totalCompressedTokens: number;
    averageTokenSaving: number;
    compressionStrategies: Record<string, number>;
}

/**
 * Cost savings analysis
 */
export interface CostSavings {
    tokensSaved: number;
    estimatedCostSaved: number; // USD
    period: {
        start: Date;
        end: Date;
    };
}

/**
 * Processing metrics
 */
export interface ProcessingMetrics {
    averageProcessingTime: number; // ms
    successRate: number; // 0-1
    totalCompressions: number;
    failedCompressions: number;
}

/**
 * Gets compression statistics for a project
 */
export async function getCompressionStats(projectId: string): Promise<CompressionStats> {
    try {
        const { data, error } = await supabase
            .rpc('get_project_compression_stats', { project_id_input: projectId });

        if (error) {
            logger.error({ error }, 'Failed to get compression stats');
            throw error;
        }

        if (!data || data.length === 0) {
            return {
                totalDocuments: 0,
                compressedDocuments: 0,
                totalRawTokens: 0,
                totalCompressedTokens: 0,
                averageTokenSaving: 0,
                compressionStrategies: {}
            };
        }

        const stats = data[0];
        return {
            totalDocuments: stats.total_documents || 0,
            compressedDocuments: stats.compressed_documents || 0,
            totalRawTokens: stats.total_raw_tokens || 0,
            totalCompressedTokens: stats.total_compressed_tokens || 0,
            averageTokenSaving: stats.avg_token_saving || 0,
            compressionStrategies: stats.compression_strategies || {}
        };
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : error }, 'Error getting compression stats');
        throw error;
    }
}

/**
 * Gets cost savings for a project within a date range
 */
export async function getCostSavings(
    projectId: string,
    startDate: Date,
    endDate: Date
): Promise<CostSavings> {
    try {
        // Query compression views created in date range
        const { data, error } = await supabase
            .from('document_compressed_views')
            .select(`
                raw_token_count,
                compressed_token_count,
                created_at,
                project_documents!inner(project_id)
            `)
            .eq('project_documents.project_id', projectId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (error) {
            logger.error({ error }, 'Failed to get cost savings');
            throw error;
        }

        if (!data || data.length === 0) {
            return {
                tokensSaved: 0,
                estimatedCostSaved: 0,
                period: { start: startDate, end: endDate }
            };
        }

        // Calculate total tokens saved
        const tokensSaved = data.reduce((sum, view) => {
            const saved = (view.raw_token_count || 0) - (view.compressed_token_count || 0);
            return sum + Math.max(0, saved);
        }, 0);

        // Estimate cost saved (assuming $0.001 per 1K tokens as baseline)
        const estimatedCostSaved = (tokensSaved / 1000) * 0.001;

        return {
            tokensSaved,
            estimatedCostSaved,
            period: { start: startDate, end: endDate }
        };
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : error }, 'Error getting cost savings');
        throw error;
    }
}

/**
 * Gets processing metrics for a project
 */
export async function getProcessingMetrics(projectId: string): Promise<ProcessingMetrics> {
    try {
        // Query telemetry events from ai_usage_logs
        const { data: completedEvents, error: completedError } = await supabase
            .from('ai_usage_logs')
            .select('metadata')
            .eq('project_id', projectId)
            .eq('agent_type', 'optical_compression_completed');

        const { data: failedEvents, error: failedError } = await supabase
            .from('ai_usage_logs')
            .select('metadata')
            .eq('project_id', projectId)
            .eq('agent_type', 'optical_compression_failed');

        if (completedError || failedError) {
            logger.error({ completedError, failedError }, 'Failed to get processing metrics');
            throw completedError || failedError;
        }

        const completed = completedEvents || [];
        const failed = failedEvents || [];
        const total = completed.length + failed.length;

        if (total === 0) {
            return {
                averageProcessingTime: 0,
                successRate: 0,
                totalCompressions: 0,
                failedCompressions: 0
            };
        }

        // Calculate average processing time from completed events
        const totalProcessingTime = completed.reduce((sum, event) => {
            const durationMs = event.metadata?.durationMs || 0;
            return sum + durationMs;
        }, 0);

        const averageProcessingTime = completed.length > 0
            ? totalProcessingTime / completed.length
            : 0;

        const successRate = total > 0 ? completed.length / total : 0;

        return {
            averageProcessingTime,
            successRate,
            totalCompressions: total,
            failedCompressions: failed.length
        };
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : error }, 'Error getting processing metrics');
        throw error;
    }
}
