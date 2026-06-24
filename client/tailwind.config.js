/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        ink: '#172033',
        muted: '#596476',
        surface: '#ffffff',
        surfaceMuted: '#edf5ff',
        line: '#c8d7ee',
        lineStrong: '#8fa7c7',
        primary: '#2563eb',
        primaryDark: '#1e40af',
        accent: '#e85d75',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
      },
      boxShadow: {
        liquid_1: 'color-[#e0e0e0] radius-[0px_1px_0px_0px] offset-[0px_10px_0px_0px] blur-[0px] spread-[0px]',
        liquid: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 0 rgba(37,99,235,0.04), 0 22px 42px rgba(33,60,114,0.11)',
        liquidHover: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 13px 0 rgba(37,99,235,0.07), 0 30px 54px rgba(33,60,114,0.17)',
        soft: '0 8px 24px rgba(33,60,114,0.08)',
        panel: '0 18px 48px rgba(33,60,114,0.13)',
      },
      animation: {
        'soft-pulse': 'pulse 1.15s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
