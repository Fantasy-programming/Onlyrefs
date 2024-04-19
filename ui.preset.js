const { fontFamily } = require('tailwindcss/defaultTheme');

/**@type {import("tailwindcss").Config} */
module.exports = {
  darkMode: ['class', '[data-kb-theme="dark"]'],
  content: ['./src/**/*.{js,jsx,md,mdx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary))',
          foreground: 'hsl(var(--tertiary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--kb-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--kb-accordion-content-height)' },
          to: { height: 0 },
        },
        'content-show': {
          from: { opacity: 0, transform: 'scale(0.96)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        'content-hide': {
          from: { opacity: 1, transform: 'scale(1)' },
          to: { opacity: 0, transform: 'scale(0.96)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'content-show': 'content-show 0.2s ease-out',
        'content-hide': 'content-hide 0.2s ease-out',
      },
      gridTemplateColumns: {
        fluid: 'repeat(auto-fit, minmax(15rem, 1fr))',
      },
      fontFamily: {
        serif: 'var(--font-serif)',
        sans: 'var(--font-sans)',
      },
      boxShadow: {
        subtleBtn:
          '0 2px 2px rgba(0, 0, 0, 0.19), 0 2px 2px rgba(0, 0, 0, 0.23), inset 2px 2px 2px 0 rgba(255, 255, 255, 0.05)',
        cardShadow:
          '0 6px 12px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23), inset 1px 1px 1px 0 rgba(255, 255, 255, 0.05), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.05)',
        cardShadowLight:
          '0 6px 12px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.15), inset 1px 1px 1px 0 rgba(0, 0, 0, 0.05), inset -1px -1px 1px 0 rgba(0, 0, 0, 0.05)',
      },
      typography: {
        xl: {
          css: {
            p: {
              marginTop: '0.5em',
              marginBottom: '0.5rem',
            },
            h1: {
              fontSize: '2em',
              marginTop: '0.9em',
              marginBottom: '0.9rem',
            },
            h2: {
              marginTop: '0.9em',
              marginBottom: '0.9rem',
            },
            h3: {
              marginTop: '0.9em',
              marginBottom: '0.9rem',
            },
            h4: {
              marginTop: '0.9em',
              marginBottom: '0.9rem',
            },
            h5: {
              marginTop: '0.9em',
              marginBottom: '0.9rem',
            },
            h6: {
              marginTop: '0.9em',
              marginBottom: '0.9rem',
            },
            ul: {
              marginTop: '0.9em',
              marginBottom: '0.9rem',
              li: {
                marginTop: '0.5em',
                marginBottom: '0.5rem',
                p: {
                  marginTop: '0.5em',
                  marginBottom: '0.5rem',
                },
              },
            },
            ol: {
              marginTop: '0.9em',
              marginBottom: '0.9rem',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('./fontvariation'),
  ],
};
