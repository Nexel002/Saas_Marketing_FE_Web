/**
 * Auth Layout
 * 
 * Layout wrapper for authentication pages (login, register, forgot password).
 * No sidebar or header - clean layout for auth flows.
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white">
            {children}
        </div>
    );
}
