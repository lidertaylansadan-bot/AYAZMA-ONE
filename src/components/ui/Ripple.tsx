/**
 * Ripple Effect Component
 * Material Design ripple effect for buttons
 */

import { useRef, MouseEvent } from 'react'

interface RippleProps {
    duration?: number
    color?: string
}

export function useRipple({ duration = 600, color = 'rgba(255, 255, 255, 0.3)' }: RippleProps = {}) {
    const rippleRef = useRef<HTMLDivElement>(null)

    const createRipple = (event: MouseEvent<HTMLElement>) => {
        const button = event.currentTarget
        const rect = button.getBoundingClientRect()

        const diameter = Math.max(rect.width, rect.height)
        const radius = diameter / 2

        const ripple = document.createElement('span')
        ripple.style.width = ripple.style.height = `${diameter}px`
        ripple.style.left = `${event.clientX - rect.left - radius}px`
        ripple.style.top = `${event.clientY - rect.top - radius}px`
        ripple.style.backgroundColor = color
        ripple.className = 'ripple-effect'

        const existingRipple = button.querySelector('.ripple-effect')
        if (existingRipple) {
            existingRipple.remove()
        }

        button.appendChild(ripple)

        setTimeout(() => {
            ripple.remove()
        }, duration)
    }

    return { createRipple, rippleRef }
}

// CSS to add to index.css:
/*
.ripple-effect {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  animation: ripple 600ms ease-out;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
*/
