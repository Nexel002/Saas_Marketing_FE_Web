'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Providers Component
 * 
 * Wraps the application with all necessary providers.
 * This is a Client Component that can hold other providers.
 */
export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}

export default Providers;
