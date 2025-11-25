/**
 * Health Monitoring Service
 * Tracks AI system performance trends and health metrics
 */

import { supabase } from '../../config/supabase.js';
import { logger } from '../../core/logger.js';

export interface HealthTrends {
    period: '7d' | '30d';
    avgQualityScore: number;
    avgCost: number;
    avgLatency: number;
    autoFixCount: number;
    regressionFailureCount: number;
    selfRepairSuccessRate: number;
    dailyMetrics: DailyMetric[];
}

export interface DailyMetric {
    date: string;
    avgScore: number;
    runCount: number;
    fixCount: number;
    failureCount: number;
}

export class HealthService {
    /**
     * Get health trends for a given period
     */
    async getTrends(period: '7d' | '30d' = '7d'): Promise<HealthTrends> {
        const days = period === '7d' ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        logger.info({ period, startDate }, 'Fetching health trends');

        // Fetch evaluations
        const { data: evaluations } = await supabase
            .from('agent_evaluations')
            .select('created_at, score_factuality, score_coherence, score_safety, score_helpfulness')
            .gte('created_at', startDate.toISOString());

        // Fetch auto-fixes
        const { data: fixes } = await supabase
            .from('agent_fixes')
            .select('created_at, eval_score_before, eval_score_after')
            .gte('created_at', startDate.toISOString());

        // Fetch regression results
        const { data: regressionResults } = await supabase
            .from('regression_results')
            .select('created_at, passed')
            .gte('created_at', startDate.toISOString());

        // Calculate metrics
        const avgQualityScore = this.calculateAvgQuality(evaluations || []);
        const autoFixCount = fixes?.length || 0;
        const regressionFailureCount = regressionResults?.filter(r => !r.passed).length || 0;
        const selfRepairSuccessRate = this.calculateRepairSuccessRate(fixes || []);

        // Group by day
        const dailyMetrics = this.groupByDay(evaluations || [], fixes || [], regressionResults || [], days);

        return {
            period,
            avgQualityScore,
            avgCost: 0, // TODO: Calculate from AI usage
            avgLatency: 0, // TODO: Calculate from run metadata
            autoFixCount,
            regressionFailureCount,
            selfRepairSuccessRate,
            dailyMetrics
        };
    }

    /**
     * Calculate average quality score
     */
    private calculateAvgQuality(evaluations: any[]): number {
        if (evaluations.length === 0) return 0;

        const scores = evaluations.map(e =>
            (e.score_factuality + e.score_coherence + e.score_safety + (e.score_helpfulness / 100)) / 4
        );

        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    /**
     * Calculate self-repair success rate
     */
    private calculateRepairSuccessRate(fixes: any[]): number {
        if (fixes.length === 0) return 0;

        const successful = fixes.filter(f =>
            f.eval_score_after && f.eval_score_before && f.eval_score_after > f.eval_score_before
        ).length;

        return successful / fixes.length;
    }

    /**
     * Group metrics by day
     */
    private groupByDay(evaluations: any[], fixes: any[], regressions: any[], days: number): DailyMetric[] {
        const dailyMap = new Map<string, DailyMetric>();

        // Initialize all days
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyMap.set(dateStr, {
                date: dateStr,
                avgScore: 0,
                runCount: 0,
                fixCount: 0,
                failureCount: 0
            });
        }

        // Aggregate evaluations
        for (const eval of evaluations) {
            const dateStr = new Date(eval.created_at).toISOString().split('T')[0];
            const metric = dailyMap.get(dateStr);
            if (metric) {
                const score = (eval.score_factuality + eval.score_coherence + eval.score_safety + (eval.score_helpfulness / 100)) / 4;
                metric.avgScore = (metric.avgScore * metric.runCount + score) / (metric.runCount + 1);
                metric.runCount++;
            }
        }

        // Aggregate fixes
        for (const fix of fixes) {
            const dateStr = new Date(fix.created_at).toISOString().split('T')[0];
            const metric = dailyMap.get(dateStr);
            if (metric) {
                metric.fixCount++;
            }
        }

        // Aggregate regression failures
        for (const result of regressions) {
            if (!result.passed) {
                const dateStr = new Date(result.created_at).toISOString().split('T')[0];
                const metric = dailyMap.get(dateStr);
                if (metric) {
                    metric.failureCount++;
                }
            }
        }

        return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
}

// Singleton instance
export const healthService = new HealthService();
