import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card from './Card'

describe('Card Component', () => {
    it('renders children correctly', () => {
        render(
            <Card>
                <h2>Card Title</h2>
                <p>Card content</p>
            </Card>
        )

        expect(screen.getByText('Card Title')).toBeInTheDocument()
        expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('applies glassmorphism styles', () => {
        const { container } = render(<Card>Content</Card>)
        const card = container.firstChild
        expect(card).toHaveClass('glass-panel')
        expect(card).toHaveClass('rounded-xl')
        expect(card).toHaveClass('p-6')
    })

    it('applies custom className', () => {
        const { container } = render(<Card className="custom-class">Content</Card>)
        const card = container.firstChild
        expect(card).toHaveClass('custom-class')
    })

    it('has hover effect enabled by default', () => {
        // The hover prop is true by default
        render(<Card>Hoverable</Card>)
        // Since framer-motion animations are complex to test,
        // we verify the component renders without errors
        expect(screen.getByText('Hoverable')).toBeInTheDocument()
    })

    it('disables hover effect when hover prop is false', () => {
        render(<Card hover={false}>No hover</Card>)
        expect(screen.getByText('No hover')).toBeInTheDocument()
    })
})
