/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg: "#0B0F19",
          card: "#161F30",
          accent: "#F59E0B",
          gold: "#FBBF24",
          crimson: "#EF4444",
          police: "#3B82F6",
          thief: "#8B5CF6",
          minister: "#10B981",
          soldier: "#F97316",
          citizen: "#6B7280",
          paper: "#FDF6E2",
          parchment: "#EFE2C5",
        }
      },
      fontFamily: {
        game: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        wobble: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        paperFlutter: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(4deg)' },
          '100%': { transform: 'translateY(0) rotate(0deg)' },
        }
      },
      animation: {
        wobble: 'wobble 0.8s ease-in-out infinite',
        glow: 'pulseGlow 2s ease-in-out infinite',
        flutter: 'paperFlutter 2.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
