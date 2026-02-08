/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B365D',
          50: '#E8EDF4',
          100: '#D1DBE9',
          200: '#A3B7D3',
          300: '#7593BD',
          400: '#476FA7',
          500: '#1B365D',
          600: '#162C4D',
          700: '#11223D',
          800: '#0C182D',
          900: '#070E1D',
        },
        teal: {
          DEFAULT: '#4ECDC4',
          50: '#E6F9F7',
          100: '#CCF3EF',
          200: '#99E7DF',
          300: '#66DBCF',
          400: '#4ECDC4',
          500: '#3DBDB5',
          600: '#2D9D96',
          700: '#1D7D77',
          800: '#0D5D58',
          900: '#003D39',
        },
        coral: '#FF6B6B',
        success: '#16a34a',
        warning: '#f97316',
        error: '#dc2626',
        'bg-primary': '#f8fafc',
        'bg-secondary': '#ffffff',
        'text-primary': '#1e293b',
        'text-secondary': '#64748b',
        border: '#e2e8f0',
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', '"Hiragino Kaku Gothic ProN"', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(27, 54, 93, 0.08)',
        'card-hover': '0 4px 16px rgba(27, 54, 93, 0.12)',
        'bottom-nav': '0 -2px 10px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
