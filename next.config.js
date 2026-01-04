/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // Configure images domains if needed
    images: {
        domains: ['localhost'],
    },

    // Environment variables that should be available client-side
    env: {
        NEXT_PUBLIC_APP_NAME: 'PromoMo',
    },
};

module.exports = nextConfig;
