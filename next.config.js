/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // Configure images domains if needed
    images: {
        domains: ['localhost', 'lh3.googleusercontent.com', 'drive.google.com'],
        formats: ['image/avif', 'image/webp'],
    },

    // Production optimizations
    compiler: {
        // Remove console.logs in production
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Experimental optimizations
    experimental: {
        // Optimize package imports for better tree-shaking
        optimizePackageImports: ['lucide-react', 'react-markdown'],
    },

    // Environment variables that should be available client-side
    env: {
        NEXT_PUBLIC_APP_NAME: 'Godin',
    },
};

module.exports = nextConfig;
