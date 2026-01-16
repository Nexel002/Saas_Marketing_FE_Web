import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            // =============================================
            // DESIGN TOKENS - Godin Light Theme
            // =============================================
            colors: {
                // Background colors
                background: '#FFFFFF',
                surface: '#F8FAFC',

                // Primary brand color (Indigo)
                primary: {
                    DEFAULT: '#6366F1',
                    50: '#EEEEFF',
                    100: '#E0E1FF',
                    200: '#C7C8FE',
                    300: '#A5A7FC',
                    400: '#8184F9',
                    500: '#6366F1',
                    600: '#4F51E5',
                    700: '#4243C7',
                    800: '#3839A2',
                    900: '#333580',
                },

                // Accent colors (Pastel)
                accent: {
                    pink: '#FBC5D8',
                    blue: '#B8D4E3',
                    yellow: '#FDE68A',
                },

                // Semantic colors
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',

                // Text colors
                'text-primary': '#1F2937',
                'text-secondary': '#6B7280',
                'text-muted': '#9CA3AF',
            },

            // Typography - Century Gothic
            fontFamily: {
                sans: ['Century Gothic', 'CenturyGothic', 'AppleGothic', 'Segoe UI', 'Trebuchet MS', 'sans-serif'],
            },

            // Gradients as background images
            backgroundImage: {
                'gradient-pastel': 'linear-gradient(135deg, #FBC5D8 0%, #B8D4E3 50%, #FDE68A 100%)',
                'gradient-subtle': 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
            },

            // Box shadows
            boxShadow: {
                'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.05)',
                'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.04)',
            },

            // Border radius
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
            },

            // Animations
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
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
                slideInLeft: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
