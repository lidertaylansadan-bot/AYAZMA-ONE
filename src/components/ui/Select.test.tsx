import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Select from '../../components/ui/Select'

describe('Select Component', () => {
    const options = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
    ]

    it('renders placeholder when no value selected', () => {
        render(<Select placeholder='Select an option' options={options} />)
        expect(screen.getByText('Select an option')).toBeInTheDocument()
    })

    it('opens options list on click and selects an option', async () => {
        const handleChange = vi.fn()
        render(<Select placeholder='Select' options={options} onChange={handleChange} />)
        const trigger = screen.getByText('Select')
        await userEvent.click(trigger)
        const option = screen.getByText('Option 2')
        await userEvent.click(option)
        expect(handleChange).toHaveBeenCalledWith('opt2')
    })
})
