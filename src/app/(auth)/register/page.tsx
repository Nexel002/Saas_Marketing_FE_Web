'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Register Page
 * 
 * New user registration with email/password.
 * Uses AuthContext for real API integration.
 */
export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('As passwords não coincidem');
            return;
        }

        // Validate password strength
        if (formData.password.length < 6) {
            setError('A password deve ter pelo menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            // Use AuthContext register
            await register(formData.name, formData.email, formData.password);

            // Redirect to dashboard on success
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta. Por favor, tente novamente.');
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
                        Comece a automatizar o seu marketing hoje
                    </p>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-card text-left">
                        <h3 className="font-semibold text-text-primary mb-3">
                            O que você ganha:
                        </h3>
                        <ul className="space-y-2 text-sm text-text-secondary">
                            <li className="flex items-center gap-2">
                                <span className="text-success">✓</span>
                                Acesso ao assistente de IA
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-success">✓</span>
                                Pesquisas de mercado automáticas
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-success">✓</span>
                                Planos estratégicos personalizados
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-success">✓</span>
                                Campanhas de marketing com IA
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Right side - Register Form */}
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
                                Criar Conta
                            </h2>
                            <p className="text-text-secondary mt-2">
                                Registe-se para começar a usar o PromoMo
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
                                label="Nome completo"
                                type="text"
                                placeholder="João Silva"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />

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
                                helperText="Mínimo 6 caracteres"
                                required
                            />

                            <Input
                                label="Confirmar Password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />

                            <div className="flex items-start gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="rounded border-border mt-0.5"
                                    required
                                />
                                <label htmlFor="terms" className="text-text-secondary">
                                    Aceito os{' '}
                                    <Link href="/terms" className="text-primary hover:underline">
                                        Termos de Serviço
                                    </Link>{' '}
                                    e a{' '}
                                    <Link href="/privacy" className="text-primary hover:underline">
                                        Política de Privacidade
                                    </Link>
                                </label>
                            </div>

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                isLoading={isLoading}
                            >
                                Criar Conta
                            </Button>
                        </form>

                        <p className="text-center text-sm text-text-secondary mt-6">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-primary font-medium hover:underline">
                                Entrar
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
