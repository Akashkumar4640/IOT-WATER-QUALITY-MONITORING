/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#070b14',
          850: '#0b1120',
          800: '#0f172a',
          750: '#15203b',
          700: '#1e293b',
          600: '#334155'
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          900: '#164e63'
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          900: '#064e3b'
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          900: '#78350f'
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          900: '#881337'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.4)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.4)'
      }
    },
  },
  plugins: [],
}
