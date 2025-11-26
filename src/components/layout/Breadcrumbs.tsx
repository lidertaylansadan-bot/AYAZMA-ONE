/**
 * Breadcrumbs Component
 * Navigation breadcrumb trail
 */

import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
    label: string
    href?: string
}

const routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    'control-panel': 'Control Panel',
    'audit-log': 'Audit Log',
    wizard: 'Wizard',
    app: 'App',
    workflow: 'Workflow',
    content: 'Content',
    settings: 'Settings',
    agents: 'Agents',
    runs: 'Runs'
}

export function Breadcrumbs() {
    const location = useLocation()
    const pathnames = location.pathname.split('/').filter(x => x)

    if (pathnames.length === 0) return null

    const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Home', href: '/dashboard' }
    ]

    pathnames.forEach((segment, index) => {
        const href = `/${pathnames.slice(0, index + 1).join('/')}`
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

        breadcrumbs.push({
            label,
            href: index === pathnames.length - 1 ? undefined : href
        })
    })

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                    {index > 0 && (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}

                    {crumb.href ? (
                        <Link
                            to={crumb.href}
                            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                        >
                            {index === 0 && <Home className="w-4 h-4" />}
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className="flex items-center gap-1.5 text-white font-medium">
                            {index === 0 && <Home className="w-4 h-4" />}
                            {crumb.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    )
}
