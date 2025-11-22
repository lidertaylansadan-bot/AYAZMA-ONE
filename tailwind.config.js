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
          DEFAULT: "rgba(30, 41, 59, 0.7)",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.1)",
        },
        premium: {
          bg: "#0f172a", // Slate 900
          card: "#1e293b", // Slate 800
          text: "#f8fafc", // Slate 50
          muted: "#94a3b8", // Slate 400
        }
      },
      backgroundImage: {
        'premium-gradient': 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        'primary-gradient': 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
        'accent-gradient': 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(96, 165, 250, 0.1), 0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
};
