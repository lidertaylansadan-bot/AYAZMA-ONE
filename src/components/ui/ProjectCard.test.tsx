import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProjectCard from './ProjectCard'

describe('ProjectCard Component', () => {
    it('renders project title and status', () => {
        const project = { id: '1', name: 'Test Project', status: 'draft' }
        render(<ProjectCard project={project} />)
        expect(screen.getByText('Test Project')).toBeInTheDocument()
        expect(screen.getByText('draft')).toBeInTheDocument()
    })
})
