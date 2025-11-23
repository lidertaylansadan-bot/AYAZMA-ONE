import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard } from './Dashboard'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
    useAuth: () => ({ user: { id: '1', email: 'test@example.com' } })
}))

// Mock useStore
vi.mock('../store/useStore', () => ({
    useStore: () => ({
        projects: [],
        setProjects: vi.fn(),
        setCurrentProject: vi.fn()
    })
}))

// Mock API calls
vi.mock('../api/projects', () => ({
    getProjects: vi.fn().mockResolvedValue({ success: true, data: [] }),
    createProject: vi.fn(),
    apiCall: vi.fn().mockResolvedValue({ success: true, data: [] })
}))

// Mock DashboardLayout
vi.mock('../components/layout/DashboardLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

describe('Dashboard Page', () => {
    it('renders dashboard heading', async () => {
        render(<Dashboard />)
        expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    })
})
