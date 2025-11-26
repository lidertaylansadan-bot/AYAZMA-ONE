import { useState, useEffect, InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { clsx } from 'clsx'

type Props = InputHTMLAttributes<HTMLInputElement> & {
    onSearch: (value: string) => void
    debounceMs?: number
}

export default function SearchInput({
    onSearch,
    debounceMs = 300,
    className,
    placeholder = 'Search...',
    ...props
}: Props) {
    const [value, setValue] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(value)
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [value, debounceMs, onSearch])

    return (
        <div className={clsx("relative", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                {...props}
            />
            {value && (
                <button
                    onClick={() => setValue('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}
