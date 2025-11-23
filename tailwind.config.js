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
          DEFAULT: "rgba(15, 23, 42, 0.6)", // Darker base for better contrast
          border: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.12)",
          active: "rgba(255, 255, 255, 0.15)",
        },
        premium: {
          bg: "#020617", // Slate 950 - Deeper, richer background
          card: "#0f172a", // Slate 900
          text: "#f8fafc", // Slate 50
          muted: "#94a3b8", // Slate 400
          accent: "#6366f1", // Indigo 500
        }
      },
      backgroundImage: {
        'premium-gradient': 'radial-gradient(circle at top left, #1e1b4b, #020617)', // Deep Indigo to Slate 950
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
        'primary-gradient': 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', // Indigo to Blue
        'accent-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', // Violet to Pink
        'glow-conic': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glass-hover': '0 8px 32px 0 rgba(99, 102, 241, 0.15), 0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
