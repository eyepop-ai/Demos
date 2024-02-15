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
        },
    },
    plugins: [ require("daisyui") ],
}
