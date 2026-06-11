/**
 * GAD Design System — The Golden Archive
 * Last updated: 2026-06-11
 *
 * Token structure:
 *   colors.age.*          — Age-based artifact marker colors
 *   boxShadow.warm-*      — Warm-toned elevation shadows
 *   boxShadow.golden*     — Primary interaction glow effects
 *   animation.*           — Named animation utilities
 *   fontFamily.display    — Playfair Display (headings)
 *   fontFamily.body       — Inter (body text)
 *
 * Aesthetic: Warm parchment backgrounds, golden glows on interaction,
 * geological patience in animations, scholarly typographic hierarchy.
 */
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: {
            DEFAULT: "hsl(var(--sidebar-primary))",
            foreground: "hsl(var(--sidebar-primary-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--sidebar-accent))",
            foreground: "hsl(var(--sidebar-accent-foreground))",
          },
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "3px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm-xs': '0 1px 2px 0 rgba(139, 69, 19, 0.06)',
        'warm-sm': '0 1px 3px 0 rgba(139, 69, 19, 0.08), 0 1px 2px -1px rgba(139, 69, 19, 0.06)',
        'warm-md': '0 4px 6px -1px rgba(139, 69, 19, 0.10), 0 2px 4px -2px rgba(139, 69, 19, 0.07)',
        'warm-lg': '0 10px 15px -3px rgba(139, 69, 19, 0.10), 0 4px 6px -4px rgba(139, 69, 19, 0.07)',
        'warm-xl': '0 20px 25px -5px rgba(139, 69, 19, 0.10), 0 8px 10px -6px rgba(139, 69, 19, 0.07)',
        'warm-2xl': '0 25px 50px -12px rgba(139, 69, 19, 0.18)',
        'golden': '0 0 0 3px rgba(184, 134, 11, 0.20), 0 0 12px 0 rgba(184, 134, 11, 0.15)',
        'golden-sm': '0 0 0 2px rgba(184, 134, 11, 0.15), 0 0 6px 0 rgba(184, 134, 11, 0.10)',
        'inner-warm': 'inset 0 2px 4px 0 rgba(139, 69, 19, 0.06)',
      },
      transitionTimingFunction: {
        'organic': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-quart': 'cubic-bezier(0.165, 0.84, 0.44, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-1%, -2%)' },
          '20%': { transform: 'translate(2%, -1%)' },
          '30%': { transform: 'translate(-2%, 1%)' },
          '40%': { transform: 'translate(1%, 2%)' },
          '50%': { transform: 'translate(-1%, 1%)' },
          '60%': { transform: 'translate(2%, -2%)' },
          '70%': { transform: 'translate(-1%, -1%)' },
          '80%': { transform: 'translate(1%, 1%)' },
          '90%': { transform: 'translate(2%, 2%)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-golden': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(184, 134, 11, 0)' },
          '50%': { boxShadow: '0 0 0 8px rgba(184, 134, 11, 0.12)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'fade-in-up': 'fadeInUp 0.4s ease-out-quart both',
        'fade-in': 'fadeIn 0.3s ease-out both',
        'scale-in': 'scaleIn 0.2s ease-out-quart both',
        'pulse-golden': 'pulse-golden 2s ease-in-out infinite',
        grain: 'grain 8s steps(10) infinite',
      },
    },
  },
  plugins: [],
};
export default config;
