/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050d1a',
          900: '#0a1b33',
          800: '#122847',
          700: '#1a3a63',
          600: '#24508a',
          500: '#2d6bb3',
          200: '#c5d4e8',
          50: '#eef3f9',
        },
        gold: {
          400: '#d4b56a',
          500: '#c4a35a',
          600: '#a8883d',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eaedf2',
          200: '#d5dbe6',
          400: '#7b8798',
          600: '#4a5568',
          800: '#1c2430',
          900: '#111827',
        },
        status: {
          pass: '#0f766e',
          warn: '#c2410c',
          review: '#1d4ed8',
          critical: '#b91c1c',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 18px 40px -24px rgba(10, 27, 51, 0.35)',
        glow: '0 0 0 1px rgba(196, 163, 90, 0.25), 0 24px 80px -20px rgba(10, 27, 51, 0.55)',
      },
      backgroundImage: {
        mesh: 'radial-gradient(1200px 600px at 10% -10%, rgba(45,107,179,0.28), transparent 55%), radial-gradient(900px 500px at 90% 10%, rgba(196,163,90,0.16), transparent 50%)',
      },
    },
  },
  plugins: [],
}
