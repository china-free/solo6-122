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
        panel: {
          dark: '#1a1a1d',
          mid: '#2a2a2e',
          light: '#3a3a3f',
          border: '#4a4a4f',
        },
        bronze: {
          50: '#f7e8c8',
          100: '#e8d0a0',
          200: '#d4b070',
          300: '#c08c40',
          400: '#a87820',
          500: '#8b6914',
          600: '#6e520e',
          700: '#533d0a',
          800: '#3a2a06',
          900: '#241a04',
        },
        neon: {
          red: '#ff3b30',
          green: '#34c759',
          yellow: '#ffcc00',
          blue: '#007aff',
          orange: '#ff9500',
          purple: '#af52de',
        },
        cable: {
          red: '#ff4d4d',
          yellow: '#ffd93d',
          blue: '#4da6ff',
          green: '#6bcb77',
          purple: '#c780e8',
          orange: '#ff8c42',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
        body: ['"Roboto Condensed"', 'sans-serif'],
      },
      boxShadow: {
        'module': 'inset 0 2px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.5)',
        'knob': 'inset 0 -2px 4px rgba(0,0,0,0.6), inset 0 2px 2px rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.5)',
        'jack': 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.6)',
        'crt': 'inset 0 0 80px rgba(52, 199, 89, 0.15), inset 0 0 160px rgba(0, 0, 0, 0.9)',
      },
      backgroundImage: {
        'brushed-metal': `
          repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.02) 0px,
            rgba(255,255,255,0.02) 1px,
            transparent 1px,
            transparent 2px
          ),
          repeating-linear-gradient(
            90deg,
            rgba(0,0,0,0.03) 0px,
            rgba(0,0,0,0.03) 1px,
            transparent 1px,
            transparent 3px
          )
        `,
        'noise': `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
      },
      animation: {
        'pulse-led': 'pulse-led 1.5s ease-in-out infinite',
        'cable-flow': 'cable-flow 2s linear infinite',
        'victory-flash': 'victory-flash 0.6s ease-out 3',
      },
      keyframes: {
        'pulse-led': {
          '0%, 100%': { opacity: '0.6', boxShadow: '0 0 4px currentColor' },
          '50%': { opacity: '1', boxShadow: '0 0 12px currentColor' },
        },
        'cable-flow': {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-20' },
        },
        'victory-flash': {
          '0%, 100%': { backgroundColor: 'rgba(52, 199, 89, 0.0)' },
          '50%': { backgroundColor: 'rgba(52, 199, 89, 0.3)' },
        },
      },
    },
  },
  plugins: [],
};
