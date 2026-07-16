import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta de marca: verde oscuro / verde yerba mate / blanco / gris claro.
        brand: {
          50: '#eef6f0',
          100: '#d5ead9',
          200: '#aad5b4',
          300: '#7abd8d',
          400: '#4f9f68',
          500: '#357f4c',
          600: '#26663c',
          700: '#1f5232',
          800: '#0f3d2e', // verde oscuro (primario)
          900: '#0a2b20',
        },
        mate: {
          400: '#8bc34a', // verde yerba mate (acento)
          500: '#6fa036',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
