/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        // Existing shadcn colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // Security Design System - Navy Background Layers
        'navy': {
          950: '#0B1120',  // Primary background
          900: '#0F1623',  // Darker variant
          850: '#131B2E',  // Card background
          800: '#1A2540',  // Elevated
          750: '#1F2D4A',  // Hover
        },
        
        // Sapphire Blue (Primary Identity)
        'sapphire': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        
        // Cyan Accent
        'cyan': {
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
        },
        
        // Status Colors (High Visibility)
        'status': {
          'success': '#10B981',
          'success-light': '#34D399',
          'failed': '#EF4444',
          'failed-light': '#F87171',
          'processing': '#F59E0B',
          'processing-light': '#FBB024',
        },
        
        // Border System
        'border-custom': {
          'subtle': '#1E2A42',
          'default': '#2A3F5F',
          'strong': '#3D5A80',
        },
      },
      
      boxShadow: {
        'glow-sapphire': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-sapphire-strong': '0 0 40px rgba(37, 99, 235, 0.6)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.25)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-failed': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-processing': '0 0 20px rgba(245, 158, 11, 0.3)',
        'card': '0 4px 6px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 12px rgba(0, 0, 0, 0.4)',
        'elevated': '0 12px 24px rgba(0, 0, 0, 0.5)',
      },
      
      backgroundImage: {
        'gradient-card': 'linear-gradient(135deg, #131B2E 0%, #0F1623 100%)',
        'gradient-card-hover': 'linear-gradient(135deg, #1A2540 0%, #131B2E 100%)',
        'gradient-sapphire': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #0B1120 0%, #0A0F1C 100%)',
        'gradient-status-success': 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
        'gradient-status-failed': 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)',
        'gradient-status-processing': 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line': 'scan-line 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-up': 'slide-in-up 0.25s ease-out',
        'slide-in-down': 'slide-in-down 0.2s ease-out',
      },
      
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)' },
        },
        'scan-line': {
          '0%': { top: '0%', opacity: '1' },
          '50%': { top: '100%', opacity: '0.8' },
          '51%': { top: '100%', opacity: '0' },
          '52%': { top: '0%', opacity: '0' },
          '53%': { top: '0%', opacity: '1' },
          '100%': { top: '0%', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
