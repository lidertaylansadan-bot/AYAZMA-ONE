// SPDX-License-Identifier: MIT
/**
 * Telemetry Events Module
 * Defines and emits telemetry events for compression, OCR, and context operations
 */

import { logger } from '../logger.js';
import { supabase } from '../supabase.js';

/**
 * Compression telemetry event types
 */
export type CompressionEventType =
    | 'optical_compression_started'
    | 'optical_compression_completed'
    | 'optical_compression_failed';

/**
 * OCR telemetry event types
 */
export type OcrEventType =
    | 'ocr_started'
    | 'ocr_completed'
    | 'ocr_failed';

/**
 * Context telemetry event types
 */
export type ContextEventType =
    | 'context_built'
    | 'context_cache_hit'
    | 'context_cache_miss';

/**
 * Auto-fix telemetry event types
 */
export type AutoFixEventType = 'auto_fix_completed';

export type TelemetryEventType = CompressionEventType | OcrEventType | ContextEventType | AutoFixEventType;

/**
 * Base telemetry event payload
 */
export interface TelemetryEvent {
    eventType: TelemetryEventType;
    documentId?: string;
    projectId?: string;
    userId?: string;
    metadata: Record<string, any>;
    timestamp: Date;
}

/**
 * Compression event metadata
 */
export interface CompressionEventMetadata {
    strategy?: string;
    modelName?: string;
    rawTokens?: number;
    compressedTokens?: number;
    tokenSavingPercent?: number;
    durationMs?: number;
    estimatedCost?: number;
    error?: string;
}

/**
 * OCR event metadata
 */
export interface OcrEventMetadata {
    pageCount?: number;
    averageConfidence?: number;
    durationMs?: number;
    error?: string;
}

/**
 * Context event metadata
 */
export interface ContextEventMetadata {
    taskType?: string;
    contextStrategy?: string;
    sliceCount?: number;
    totalTokens?: number;
    sources?: Record<string, number>;
    durationMs?: number;
}

/**
 * Auto-fix event metadata
 */
export interface AutoFixEventMetadata {
    agentRunId: string;
    taskType: string;
    evalScoreBefore: number;
    improvementPercentage?: number;
    fixStrategy?: string;
}

/**
 * Emits a telemetry event
 * Logs to console and optionally stores in database
 */
export async function emitTelemetryEvent(event: TelemetryEvent): Promise<void> {
    try {
        // Log event
        logger.info({
            eventType: event.eventType,
            documentId: event.documentId,
            projectId: event.projectId,
            metadata: event.metadata
        }, `Telemetry: ${event.eventType}`);

        // Store in ai_usage_logs table (reusing existing table)
        if (event.projectId && event.userId) {
            await supabase
                .from('ai_usage_logs')
                .insert({
                    user_id: event.userId,
                    project_id: event.projectId,
                    agent_type: event.eventType, // Reuse agent_type field for event type
                    model_name: event.metadata.modelName || 'system',
                    input_tokens: event.metadata.rawTokens || 0,
                    output_tokens: event.metadata.compressedTokens || 0,
                    total_cost: event.metadata.estimatedCost || 0,
                    metadata: {
                        eventType: event.eventType,
                        documentId: event.documentId,
                        ...event.metadata
                    }
                });
        }
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : error }, 'Failed to emit telemetry event');
    }
}

/**
 * Emits a compression started event
 */
export async function emitCompressionStarted(
    documentId: string,
    projectId: string,
    userId: string,
    strategy: string
): Promise<void> {
    await emitTelemetryEvent({
        eventType: 'optical_compression_started',
        documentId,
        projectId,
        userId,
        metadata: { strategy },
        timestamp: new Date()
    });
}

/**
 * Emits a compression completed event
 */
export async function emitCompressionCompleted(
    documentId: string,
    projectId: string,
    userId: string,
    metadata: CompressionEventMetadata
): Promise<void> {
    await emitTelemetryEvent({
        eventType: 'optical_compression_completed',
        documentId,
        projectId,
        userId,
        metadata,
        timestamp: new Date()
    });
}

/**
 * Emits a compression failed event
 */
export async function emitCompressionFailed(
    documentId: string,
    projectId: string,
    userId: string,
    error: string
): Promise<void> {
    await emitTelemetryEvent({
        eventType: 'optical_compression_failed',
        documentId,
        projectId,
        userId,
        metadata: { error },
        timestamp: new Date()
    });
}

/**
 * Emits an OCR completed event
 */
export async function emitOcrCompleted(
    documentId: string,
    projectId: string,
    userId: string,
    metadata: OcrEventMetadata
): Promise<void> {
    await emitTelemetryEvent({
        eventType: 'ocr_completed',
        documentId,
        projectId,
        userId,
        metadata,
        timestamp: new Date()
    });
}

/**
 * Emits a context built event
 */
export async function emitContextBuilt(
    projectId: string,
    userId: string,
    metadata: ContextEventMetadata
): Promise<void> {
    await emitTelemetryEvent({
        eventType: 'context_built',
        projectId,
        userId,
        metadata,
        timestamp: new Date()
    });
}

/**
 * Emits an auto-fix completed event
 */
export async function emitAutoFixCompleted(
    projectId: string,
    userId: string,
    metadata: AutoFixEventMetadata
): Promise<void> {
    await emitTelemetryEvent({
        eventType: 'auto_fix_completed',
        projectId,
        userId,
        metadata,
        timestamp: new Date()
    });
}
