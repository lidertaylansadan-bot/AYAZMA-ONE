/**
 * Accessibility Utilities
 * Helper functions for improved accessibility
 */

// Announce to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
        document.body.removeChild(announcement)
    }, 1000)
}

// Trap focus within an element
export function trapFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    function handleTabKey(e: KeyboardEvent) {
        if (e.key !== 'Tab') return

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                lastFocusable?.focus()
                e.preventDefault()
            }
        } else {
            if (document.activeElement === lastFocusable) {
                firstFocusable?.focus()
                e.preventDefault()
            }
        }
    }

    element.addEventListener('keydown', handleTabKey)

    return () => {
        element.removeEventListener('keydown', handleTabKey)
    }
}

// Get accessible label for an element
export function getAccessibleLabel(element: HTMLElement): string {
    return (
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.textContent ||
        ''
    ).trim()
}

// Check if element is keyboard accessible
export function isKeyboardAccessible(element: HTMLElement): boolean {
    const tabIndex = element.getAttribute('tabindex')
    const isInteractive = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)

    return isInteractive || (tabIndex !== null && tabIndex !== '-1')
}

// Add keyboard navigation to a list
export function addKeyboardNavigation(
    container: HTMLElement,
    itemSelector: string,
    onSelect?: (item: HTMLElement) => void
) {
    let currentIndex = 0
    const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector))

    function setActiveItem(index: number) {
        items.forEach((item, i) => {
            if (i === index) {
                item.setAttribute('aria-selected', 'true')
                item.focus()
            } else {
                item.setAttribute('aria-selected', 'false')
            }
        })
    }

    function handleKeyDown(e: KeyboardEvent) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                currentIndex = Math.min(currentIndex + 1, items.length - 1)
                setActiveItem(currentIndex)
                break
            case 'ArrowUp':
                e.preventDefault()
                currentIndex = Math.max(currentIndex - 1, 0)
                setActiveItem(currentIndex)
                break
            case 'Home':
                e.preventDefault()
                currentIndex = 0
                setActiveItem(currentIndex)
                break
            case 'End':
                e.preventDefault()
                currentIndex = items.length - 1
                setActiveItem(currentIndex)
                break
            case 'Enter':
            case ' ':
                e.preventDefault()
                if (onSelect && items[currentIndex]) {
                    onSelect(items[currentIndex])
                }
                break
        }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
        container.removeEventListener('keydown', handleKeyDown)
    }
}

// Debounce for performance
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null
            func(...args)
        }

        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}
