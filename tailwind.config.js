/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        glass: {
          DEFAULT: "rgba(15, 23, 42, 0.6)",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.12)",
          active: "rgba(255, 255, 255, 0.15)",
        },
        premium: {
          bg: "var(--bg-premium)",
          card: "#0f172a", // Slate 900 - Keep fixed for now or variable if needed
          text: "var(--text-premium)",
          muted: "#94a3b8", // Slate 400
          accent: "#6366f1", // Indigo 500
          success: "#10b981", // Emerald 500
          warning: "#f59e0b", // Amber 500
          error: "#ef4444", // Red 500
          info: "#3b82f6", // Blue 500
        },
        semantic: {
          success: {
            DEFAULT: "#10b981",
            light: "#34d399",
            dark: "#059669",
            bg: "rgba(16, 185, 129, 0.1)",
          },
          warning: {
            DEFAULT: "#f59e0b",
            light: "#fbbf24",
            dark: "#d97706",
            bg: "rgba(245, 158, 11, 0.1)",
          },
          error: {
            DEFAULT: "#ef4444",
            light: "#f87171",
            dark: "#dc2626",
            bg: "rgba(239, 68, 68, 0.1)",
          },
          info: {
            DEFAULT: "#3b82f6",
            light: "#60a5fa",
            dark: "#2563eb",
            bg: "rgba(59, 130, 246, 0.1)",
          },
        }
      },
      backgroundImage: {
        'premium-gradient': 'radial-gradient(circle at top left, #1e1b4b, #020617)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
        'primary-gradient': 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
        'accent-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        'success-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'warning-gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'error-gradient': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'aurora': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'ocean': 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
        'forest': 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
        'glow-conic': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glass-hover': '0 8px 32px 0 rgba(99, 102, 241, 0.15), 0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.5)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 30px rgba(99, 102, 241, 0.6)',
        'premium': '0 20px 60px -15px rgba(0, 0, 0, 0.5), 0 10px 20px -10px rgba(0, 0, 0, 0.3)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
        'neon-purple': '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)',
        'neon-pink': '0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(236, 72, 153, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-left': 'slide-left 0.3s ease-out',
        'slide-right': 'slide-right 0.3s ease-out',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'rotate-slow': 'rotate-slow 20s linear infinite',
        'scale-in': 'scale-in 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-left': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(99, 102, 241, 0.8), 0 0 40px rgba(99, 102, 241, 0.4)' },
        },
        'rotate-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      }
    },
  },
  plugins: [],
};
