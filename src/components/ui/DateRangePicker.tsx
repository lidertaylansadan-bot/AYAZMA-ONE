import { useState, useRef, useEffect } from 'react'
import { format, addDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

type DateRange = {
    from: Date | null
    to: Date | null
}

type Props = {
    value: DateRange
    onChange: (range: DateRange) => void
    placeholder?: string
    className?: string
}

export default function DateRangePicker({
    value,
    onChange,
    placeholder = 'Select date range',
    className
}: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const daysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month + 1, 0).getDate()
    }

    const firstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const handleDateClick = (day: number) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

        if (!value.from || (value.from && value.to)) {
            onChange({ from: selectedDate, to: null })
        } else {
            if (selectedDate < value.from) {
                onChange({ from: selectedDate, to: value.from })
            } else {
                onChange({ from: value.from, to: selectedDate })
            }
            setIsOpen(false)
        }
    }

    const isSelected = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        if (value.from && date.getTime() === value.from.getTime()) return true
        if (value.to && date.getTime() === value.to.getTime()) return true
        if (value.from && value.to) {
            return isWithinInterval(date, { start: value.from, end: value.to })
        }
        return false
    }

    const isRangeStart = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        return value.from && date.getTime() === value.from.getTime()
    }

    const isRangeEnd = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        return value.to && date.getTime() === value.to.getTime()
    }

    const renderCalendar = () => {
        const days = []
        const totalDays = daysInMonth(currentMonth)
        const startDay = firstDayOfMonth(currentMonth)

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8" />)
        }

        for (let i = 1; i <= totalDays; i++) {
            const selected = isSelected(i)
            const start = isRangeStart(i)
            const end = isRangeEnd(i)

            days.push(
                <button
                    key={i}
                    onClick={() => handleDateClick(i)}
                    className={clsx(
                        "h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors relative z-10",
                        start || end ? "bg-indigo-500 text-white" : "",
                        selected && !start && !end ? "bg-indigo-500/20 text-indigo-300 rounded-none" : "hover:bg-white/10 text-gray-300",
                        start && value.to ? "rounded-r-none" : "",
                        end && value.from ? "rounded-l-none" : ""
                    )}
                >
                    {i}
                </button>
            )
        }

        return days
    }

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const formatDateRange = () => {
        if (value.from && value.to) {
            return `${format(value.from, 'MMM d, yyyy')} - ${format(value.to, 'MMM d, yyyy')}`
        }
        if (value.from) {
            return format(value.from, 'MMM d, yyyy')
        }
        return ''
    }

    return (
        <div className={clsx("relative", className)} ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white cursor-pointer transition-all duration-200 hover:border-white/20 flex items-center gap-2 min-h-[42px]",
                    isOpen && "border-indigo-500/50 ring-1 ring-indigo-500/50"
                )}
            >
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span className={clsx("flex-1 text-sm", !value.from && "text-gray-500")}>
                    {formatDateRange() || placeholder}
                </span>
                {(value.from || value.to) && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onChange({ from: null, to: null })
                        }}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 p-4 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl w-72"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <ChevronLeft className="w-4 h-4 text-gray-400" />
                            </button>
                            <span className="text-sm font-medium text-white">
                                {format(currentMonth, 'MMMM yyyy')}
                            </span>
                            <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-center text-xs text-gray-500 font-medium">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {renderCalendar()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
