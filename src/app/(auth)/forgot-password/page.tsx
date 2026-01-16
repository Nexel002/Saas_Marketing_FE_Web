'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Input } from '@/components/ui';

/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset email.
 */
export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // TODO: Implement password reset API call
            // await authService.requestPasswordReset(email);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar email. Por favor, tente novamente.');
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
                        Godin
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

            {/* Right side - Forgot Password Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-3xl font-bold text-text-primary">
                            Godin
                        </h1>
                    </div>

                    {/* Form Card */}
                    <Card variant="outline" padding="lg">
                        {!success ? (
                            <>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg
                                            className="w-8 h-8 text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-text-primary">
                                        Esqueceu a senha?
                                    </h2>
                                    <p className="text-text-secondary mt-2">
                                        Sem problema! Digite o seu email e enviaremos um link para redefinir a senha.
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
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />

                                    <Button
                                        type="submit"
                                        fullWidth
                                        size="lg"
                                        isLoading={isLoading}
                                    >
                                        Enviar link de recuperação
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link
                                        href="/login"
                                        className="text-sm text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-2"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                            />
                                        </svg>
                                        Voltar ao login
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-8 h-8 text-success"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">
                                    Email enviado!
                                </h3>
                                <p className="text-text-secondary mb-6">
                                    Se existir uma conta com o email <strong>{email}</strong>, receberá um link para redefinir a senha.
                                </p>
                                <p className="text-sm text-text-muted mb-6">
                                    Não recebeu o email? Verifique a pasta de spam ou
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSuccess(false);
                                        setEmail('');
                                    }}
                                >
                                    Tentar novamente
                                </Button>

                                <div className="mt-6">
                                    <Link
                                        href="/login"
                                        className="text-sm text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-2"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                            />
                                        </svg>
                                        Voltar ao login
                                    </Link>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Footer */}
                    <p className="text-center text-xs text-text-muted mt-6">
                        © 2024 Godin. Desenvolvido pela NexelIT
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
