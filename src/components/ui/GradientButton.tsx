import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ElementType;
    fullWidth?: boolean;
}

export const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, icon: Icon, children, fullWidth, ...props }, ref) => {

        const baseStyles = "relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group";

        const variants = {
            primary: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]",
            secondary: "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/10",
            outline: "bg-transparent border-2 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500",
            ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
        };

        const sizes = {
            sm: "px-4 py-2 text-sm",
            md: "px-6 py-3 text-base",
            lg: "px-8 py-4 text-lg"
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && "w-full",
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {variant === 'primary' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}

                <span className="relative flex items-center gap-2">
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {!isLoading && Icon && <Icon className="w-5 h-5" />}
                    {children}
                </span>
            </motion.button>
        );
    }
);

GradientButton.displayName = 'GradientButton';
