import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Input from './Input'
import { User } from 'lucide-react'

describe('Input Component', () => {
    it('renders with label', () => {
        render(<Input label="Username" />)
        expect(screen.getByText('Username')).toBeInTheDocument()
    })

    it('renders without label', () => {
        render(<Input placeholder="Enter text" />)
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('handles user input', async () => {
        const user = userEvent.setup()
        render(<Input placeholder="Type here" />)

        const input = screen.getByPlaceholderText('Type here')
        await user.type(input, 'Hello World')

        expect(input).toHaveValue('Hello World')
    })

    it('displays error message when error prop is provided', () => {
        render(<Input label="Email" error="Invalid email" />)
        expect(screen.getByText('Invalid email')).toBeInTheDocument()
        expect(screen.getByText('Invalid email')).toHaveClass('text-red-400')
    })

    it('renders with icon', () => {
        const { container } = render(<Input icon={<User data-testid="user-icon" />} placeholder="Username" />)
        expect(screen.getByTestId('user-icon')).toBeInTheDocument()
    })

    it('applies correct padding when icon is present', () => {
        render(<Input icon={<User />} placeholder="Username" />)
        const input = screen.getByPlaceholderText('Username')
        expect(input).toHaveClass('pl-10')
    })

    it('applies dark theme styles', () => {
        render(<Input placeholder="Dark input" />)
        const input = screen.getByPlaceholderText('Dark input')
        expect(input).toHaveClass('bg-gray-900/50')
        expect(input).toHaveClass('border-gray-700')
        expect(input).toHaveClass('text-gray-100')
    })

    it('applies custom className', () => {
        render(<Input className="custom-class" />)
        const input = screen.getByRole('textbox')
        expect(input).toHaveClass('custom-class')
    })

    it('forwards HTML input attributes', () => {
        render(<Input type="email" required placeholder="Email" />)
        const input = screen.getByPlaceholderText('Email')
        expect(input).toHaveAttribute('type', 'email')
        expect(input).toBeRequired()
    })
})
