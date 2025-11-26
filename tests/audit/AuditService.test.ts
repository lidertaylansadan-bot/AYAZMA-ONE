import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuditService } from '../../api/modules/audit/AuditService'

// Mock Supabase
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockRange = vi.fn()
const mockSingle = vi.fn()

vi.mock('../../api/config/supabase', () => ({
    supabase: {
        from: vi.fn((table) => ({
            select: mockSelect.mockReturnThis(),
            insert: mockInsert.mockReturnThis(),
            update: mockUpdate.mockReturnThis(),
            eq: mockEq.mockReturnThis(),
            gte: mockGte.mockReturnThis(),
            lte: mockLte.mockReturnThis(),
            order: mockOrder.mockReturnThis(),
            limit: mockLimit.mockReturnThis(),
            range: mockRange.mockReturnThis(),
            single: mockSingle
        }))
    }
}))

describe('AuditService', () => {
    let auditService: AuditService

    beforeEach(() => {
        vi.clearAllMocks()
        auditService = new AuditService()
    })

    it('should log an activity', async () => {
        mockSingle.mockResolvedValue({
            data: { id: 'activity-123' },
            error: null
        })

        const activityId = await auditService.logActivity(
            'project-1',
            'design_spec',
            'agent.started',
            { prompt: 'test' },
            { result: 'success' }
        )

        expect(activityId).toBe('activity-123')
        expect(mockInsert).toHaveBeenCalled()
    })

    it('should log a run start', async () => {
        mockSingle.mockResolvedValue({
            data: { id: 'run-123' },
            error: null
        })

        const runId = await auditService.logRunStart(
            'user-1',
            'project-1',
            'design_spec',
            { prompt: 'test' }
        )

        expect(runId).toBe('run-123')
        expect(mockInsert).toHaveBeenCalled()
    })

    it('should log run completion', async () => {
        mockEq.mockResolvedValue({
            data: null,
            error: null
        })

        await auditService.logRunComplete('run-123', { result: 'success' })

        expect(mockUpdate).toHaveBeenCalled()
        expect(mockEq).toHaveBeenCalledWith('id', 'run-123')
    })

    it('should query activities with filters', async () => {
        mockSingle.mockResolvedValue({
            data: [
                {
                    id: 'activity-1',
                    project_id: 'project-1',
                    agent_name: 'design_spec',
                    activity_type: 'agent.started',
                    input_payload: {},
                    output_payload: {},
                    created_at: new Date().toISOString()
                }
            ],
            error: null
        })

        const activities = await auditService.queryActivities({
            projectId: 'project-1',
            agentName: 'design_spec'
        })

        expect(Array.isArray(activities)).toBe(true)
        expect(mockEq).toHaveBeenCalled()
    })

    it('should get activity stats', async () => {
        mockSingle.mockResolvedValue({
            data: [
                {
                    id: 'activity-1',
                    project_id: 'project-1',
                    agent_name: 'design_spec',
                    activity_type: 'agent.started',
                    metadata: { duration: 1000, cost: 0.01 },
                    created_at: new Date().toISOString()
                },
                {
                    id: 'activity-2',
                    project_id: 'project-1',
                    agent_name: 'design_spec',
                    activity_type: 'agent.completed',
                    metadata: { duration: 2000, cost: 0.02 },
                    created_at: new Date().toISOString()
                }
            ],
            error: null
        })

        const stats = await auditService.getActivityStats('project-1')

        expect(stats.totalActivities).toBeGreaterThan(0)
        expect(stats.byType).toBeDefined()
        expect(stats.byAgent).toBeDefined()
    })
})
