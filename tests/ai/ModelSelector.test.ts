import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ModelSelector } from '../../api/modules/ai/ModelSelector'
import type { TaskType } from '../../api/modules/ai/ModelSelector'

describe('ModelSelector', () => {
    let selector: ModelSelector

    beforeEach(() => {
        selector = new ModelSelector()
    })

    it('should select appropriate model for design spec task', () => {
        const selection = selector.selectModel({
            taskType: 'design_spec',
            requiresQuality: true
        })

        expect(selection.provider).toBeDefined()
        expect(selection.model).toBeDefined()
        expect(selection.reason).toContain('high quality')
    })

    it('should select cost-effective model when max cost is specified', () => {
        const selection = selector.selectModel({
            taskType: 'general',
            maxCost: 0.5
        })

        expect(selection).toBeDefined()
        // Should select a model with cost <= 0.5 per 1M tokens
    })

    it('should select fast model when speed is required', () => {
        const selection = selector.selectModel({
            taskType: 'summarization',
            requiresSpeed: true
        })

        expect(selection.provider).toBeDefined()
        expect(selection.reason).toContain('fast')
    })

    it('should exclude local models when not allowed', () => {
        const selection = selector.selectModel({
            taskType: 'code_generation',
            allowLocal: false
        })

        expect(selection.provider).not.toBe('ollama')
    })

    it('should prefer local models when cost is zero', () => {
        const selection = selector.selectModel({
            taskType: 'general',
            maxCost: 0
        })

        expect(selection.provider).toBe('ollama')
    })

    it('should provide multiple recommendations', () => {
        const recommendations = selector.getRecommendations('design_spec', 3)

        expect(recommendations.length).toBeGreaterThan(0)
        expect(recommendations.length).toBeLessThanOrEqual(3)

        // Should have different models
        const uniqueModels = new Set(recommendations.map(r => `${r.provider}/${r.model}`))
        expect(uniqueModels.size).toBe(recommendations.length)
    })

    it('should handle all task types', () => {
        const taskTypes: TaskType[] = [
            'design_spec',
            'workflow_design',
            'content_strategy',
            'code_generation',
            'summarization',
            'general'
        ]

        taskTypes.forEach(taskType => {
            const selection = selector.selectModel({ taskType })
            expect(selection).toBeDefined()
            expect(selection.provider).toBeDefined()
            expect(selection.model).toBeDefined()
        })
    })
})
