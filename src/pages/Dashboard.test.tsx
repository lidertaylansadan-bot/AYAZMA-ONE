import { render, screen } from '@testing-library/react'
import { Dashboard } from './Dashboard'

describe('Dashboard Page', () => {
    it('renders dashboard heading', () => {
        render(<Dashboard />)
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
})
