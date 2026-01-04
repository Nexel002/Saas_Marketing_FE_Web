'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Login Page
 * 
 * Authentication page with email/password login.
 * Uses AuthContext for real API integration.
 */
export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Use AuthContext login
            await login(formData.email, formData.password);

            // Redirect to dashboard on success
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Credenciais inválidas. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Gradient Hero */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-pastel items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <h1 className="text-5xl font-bold text-text-primary mb-4">
                        Promo<span className="text-primary">Mo</span>
                    </h1>
                    <p className="text-xl text-text-secondary mb-8">
                        Automação de Marketing com IA para o seu Negócio
                    </p>

                    {/* Feature list */}
                    <div className="space-y-4 text-left">
                        <FeatureItem text="🎯 Campanhas de marketing automatizadas" />
                        <FeatureItem text="🔍 Pesquisa de mercado inteligente" />
                        <FeatureItem text="📊 Planos estratégicos personalizados" />
                        <FeatureItem text="💬 Assistente de IA disponível 24/7" />
                    </div>
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-3xl font-bold text-text-primary">
                            Promo<span className="text-primary">Mo</span>
                        </h1>
                    </div>

                    {/* Form Card */}
                    <Card variant="outline" padding="lg">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-text-primary">
                                Bem-vindo de volta
                            </h2>
                            <p className="text-text-secondary mt-2">
                                Entre na sua conta para continuar
                            </p>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-error rounded-lg text-sm text-error">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                placeholder="seu@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />

                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded border-border" />
                                    <span className="text-text-secondary">Lembrar-me</span>
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-primary hover:underline"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                isLoading={isLoading}
                            >
                                Entrar
                            </Button>
                        </form>

                        <p className="text-center text-sm text-text-secondary mt-6">
                            Não tem uma conta?{' '}
                            <Link href="/register" className="text-primary font-medium hover:underline">
                                Criar conta
                            </Link>
                        </p>
                    </Card>

                    {/* Footer */}
                    <p className="text-center text-xs text-text-muted mt-6">
                        © 2024 PromoMo. Desenvolvido pela NexelIT
                    </p>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2 text-text-secondary">
            <span>{text}</span>
        </div>
    );
}
