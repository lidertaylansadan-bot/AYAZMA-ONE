import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button Component', () => {
    it('renders with children', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('handles click events', async () => {
        const handleClick = vi.fn()
        const user = userEvent.setup()

        render(<Button onClick={handleClick}>Click me</Button>)

        await user.click(screen.getByText('Click me'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('applies primary variant styles by default', () => {
        render(<Button>Primary Button</Button>)
        const button = screen.getByText('Primary Button')
        expect(button).toHaveClass('bg-gradient-to-r')
    })

    it('applies secondary variant styles', () => {
        render(<Button variant="secondary">Secondary Button</Button>)
        const button = screen.getByText('Secondary Button')
        expect(button).toHaveClass('bg-gradient-to-r')
    })

    it('applies ghost variant styles', () => {
        render(<Button variant="ghost">Ghost Button</Button>)
        const button = screen.getByText('Ghost Button')
        expect(button).toHaveClass('bg-transparent')
    })

    it('disables button when disabled prop is true', () => {
        render(<Button disabled>Disabled Button</Button>)
        const button = screen.getByText('Disabled Button')
        expect(button).toBeDisabled()
    })

    it('applies custom className', () => {
        render(<Button className="custom-class">Custom Button</Button>)
        const button = screen.getByText('Custom Button')
        expect(button).toHaveClass('custom-class')
    })
})
