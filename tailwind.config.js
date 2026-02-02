/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1e3a8a',
        teal: '#0d9488',
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
        card: '8px',
        btn: '4px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
