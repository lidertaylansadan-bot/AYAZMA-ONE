import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Select from '../../components/ui/Select'

describe('Select Component', () => {
    const options = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
    ]

    it('renders placeholder when no value selected', () => {
        render(
            <Select placeholder='Select an option'>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </Select>
        )
        expect(screen.getByText('Select an option')).toBeInTheDocument()
    })

    it('opens options list on click and selects an option', async () => {
        const handleChange = vi.fn()
        render(
            <Select placeholder='Select' onChange={(e) => handleChange(e.target.value)}>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </Select>
        )
        // For native select, we userEvent.selectOptions
        const select = screen.getByRole('combobox')
        await userEvent.selectOptions(select, 'opt2')
        expect(handleChange).toHaveBeenCalled()
    })
})
