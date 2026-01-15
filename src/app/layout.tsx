import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

import { Plus_Jakarta_Sans } from 'next/font/google';

const font = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-sans',
});

/**
 * Metadata for the application
 * SEO optimized with proper descriptions
 */
export const metadata: Metadata = {
    title: {
        default: 'PromoMo - Marketing Automation',
        template: '%s | PromoMo',
    },
    description: 'Plataforma de automação de marketing digital com IA para pequenos negócios em Moçambique',
    keywords: ['marketing', 'automação', 'IA', 'negócios', 'Moçambique', 'PromoMo'],
    authors: [{ name: 'NexelIT' }],
    creator: 'NexelIT',
    openGraph: {
        type: 'website',
        locale: 'pt_MZ',
        siteName: 'PromoMo',
    },
};

/**
 * Root Layout Component
 * Wraps all pages with common providers and styles
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt" suppressHydrationWarning>
            <head>
                {/* Preconnect to Google Fonts for faster loading */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className={`min-h-screen bg-background antialiased ${font.className} ${font.variable}`}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}

