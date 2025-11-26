import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

type Option = {
    value: string
    label: string
}

type Props = {
    options: Option[]
    value: string[]
    onChange: (value: string[]) => void
    placeholder?: string
    label?: string
    className?: string
}

export default function MultiSelect({
    options,
    value,
    onChange,
    placeholder = 'Select options...',
    label,
    className
}: Props) {
    const [isOpen, setIsOpen] = useState(false)
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

    const toggleOption = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue]
        onChange(newValue)
    }

    const removeOption = (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(value.filter(v => v !== optionValue))
    }

    return (
        <div className={clsx("space-y-1", className)} ref={containerRef}>
            {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
            <div className="relative">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={clsx(
                        "w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white cursor-pointer transition-all duration-200 hover:border-white/20 flex items-center justify-between min-h-[42px]",
                        isOpen && "border-indigo-500/50 ring-1 ring-indigo-500/50"
                    )}
                >
                    <div className="flex flex-wrap gap-1.5">
                        {value.length === 0 ? (
                            <span className="text-gray-500">{placeholder}</span>
                        ) : (
                            value.map(v => {
                                const option = options.find(o => o.value === v)
                                return (
                                    <span
                                        key={v}
                                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                                    >
                                        {option?.label}
                                        <button
                                            onClick={(e) => removeOption(v, e)}
                                            className="ml-1 hover:text-white transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )
                            })
                        )}
                    </div>
                    <ChevronDown className={clsx("w-4 h-4 text-gray-500 transition-transform", isOpen && "rotate-180")} />
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute z-50 w-full mt-2 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl overflow-hidden"
                        >
                            <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {options.map(option => {
                                    const isSelected = value.includes(option.value)
                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() => toggleOption(option.value)}
                                            className={clsx(
                                                "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                                                isSelected ? "bg-indigo-500/20 text-indigo-300" : "text-gray-300 hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            <span>{option.label}</span>
                                            {isSelected && <Check className="w-4 h-4" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
