/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './client/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            textShadow: {
                sm: '0 1px 2px var(--tw-shadow-color)',
                DEFAULT: '0 2px 4px var(--tw-shadow-color)',
                lg: '0 8px 16px var(--tw-shadow-color)',
            },

            backgroundImage: {
                'primary-gradient':
                    'linear-gradient(100deg, #1d47b3 23%, #30a7d7 78%, #2986ca 100%)',
                'green-gradient':
                    'linear-gradient(98deg, #1DB388 0%, #30D797 100%, #29CA6F 100%)',
                'purple-gradient':
                    'radial-gradient(circle, #514a7b 1px, transparent 1px)',
                'dark-gradient':
                    'linear-gradient(120deg, rgb(61,61,61), rgb(125, 125, 125))',
            },

            colors: {
                primary: '#1D47B3',
                secondary: '#30A7D7',
                tertiary: '#94E0FF',
                dark: '#111022',
                light: '#EFF0F6',
                purple: '#383154',
                error: '#D7304E',
                success: '#30D797',
                neutral: {
                    100: '#FFFFFF',
                    200: '#F3F5FF',
                    300: '#EFF0F6',
                    400: '#D9DBE9',
                    500: '#B1B3CB',
                    600: '#7A7D9C',
                    700: '#3E395F',
                    800: '#0B0A33',
                    900: '#111022',
                },
            },


        },

    },
    plugins: [ require("daisyui") ],
}
