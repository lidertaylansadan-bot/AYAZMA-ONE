import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PermissionService } from '../../api/modules/security/PermissionService'

// Mock Supabase
const { mockFrom, mockSelect, mockInsert, mockEq, mockSingle } = vi.hoisted(() => {
    return {
        mockFrom: vi.fn(),
        mockSelect: vi.fn(),
        mockInsert: vi.fn(),
        mockEq: vi.fn(),
        mockSingle: vi.fn()
    }
})

vi.mock('../../api/config/supabase', () => ({
    supabase: {
        from: mockFrom
    }
}))

describe('PermissionService', () => {
    let permissionService: PermissionService

    beforeEach(() => {
        permissionService = new PermissionService()
        vi.clearAllMocks()

        // Setup chain
        mockFrom.mockReturnValue({
            select: mockSelect,
            upsert: mockInsert
        })
        mockSelect.mockReturnValue({
            eq: mockEq
        })
        mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle
        })
        mockEq.mockReturnValue({ // Handle multiple .eq calls
            eq: mockEq,
            single: mockSingle
        })
    })

    it('should return true if permission exists', async () => {
        mockSingle.mockResolvedValue({ data: { id: '123' }, error: null })

        const result = await permissionService.checkAgentAccess('user-1', 'proj-1', 'agent-1')
        expect(result).toBe(true)
        expect(mockFrom).toHaveBeenCalledWith('agent_permissions')
    })

    it('should return false if permission does not exist', async () => {
        mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

        const result = await permissionService.checkAgentAccess('user-1', 'proj-1', 'agent-1')
        expect(result).toBe(false)
    })

    it('should return false on error', async () => {
        mockSingle.mockRejectedValue(new Error('DB Error'))

        const result = await permissionService.checkAgentAccess('user-1', 'proj-1', 'agent-1')
        expect(result).toBe(false)
    })
})
