/**
 * Error Boundary Component
 * Catches JavaScript errors in child components
 */

import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex items-center justify-center min-h-screen bg-premium-bg p-6">
                    <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            Oops! Something went wrong
                        </h2>

                        <p className="text-premium-muted mb-6">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-400 hover:text-white mb-2">
                                    Error Details
                                </summary>
                                <pre className="text-xs text-red-400 bg-black/20 p-4 rounded-lg overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={this.handleReset}
                                className="flex-1"
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => window.location.reload()}
                                className="flex-1"
                            >
                                Refresh Page
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
