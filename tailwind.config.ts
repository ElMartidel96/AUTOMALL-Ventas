import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        sm: '100%',
        md: '100%',
        lg: '100%',
        xl: '100%',
        '2xl': '100%',
      },
    },
    extend: {
      colors: {
        // Autos MALL brand palette (derived from AM logo)
        'am-blue': '#1B3A6B',
        'am-blue-light': '#2B5EA7',
        'am-blue-dark': '#122A4F',
        'am-orange': '#E8832A',
        'am-orange-light': '#F5A623',
        'am-orange-dark': '#C96D1D',
        'am-green': '#2D8F4E',
        'am-green-light': '#4CAF50',
        'am-dark': '#0D1B2A',
        'am-darker': '#091420',
        'am-gray': '#F0F0F0',
        'am-silver': '#C0C0C0',

        // Legacy aliases (for gradual migration from dao-* references)
        'dao-primary': '#1B3A6B',
        'dao-secondary': '#E8832A',
        'dao-accent': '#2D8F4E',
        'dao-dark': '#0D1B2A',
        'dao-darker': '#091420',

        // Shadcn/UI semantic colors
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        apexFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        expandIn: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        driveIn: {
          '0%': { opacity: '0', transform: 'translateX(-100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        roadPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        apexFloat: 'apexFloat 4s ease-in-out infinite',
        fadeIn: 'fadeIn 0.2s ease-out',
        scaleIn: 'scaleIn 0.25s ease-out',
        expandIn: 'expandIn 0.2s ease-out',
        slideInRight: 'slideInRight 0.25s ease-out',
        driveIn: 'driveIn 0.6s ease-out',
        roadPulse: 'roadPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
