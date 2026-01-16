import Link from 'next/link';

/**
 * Landing Page Component
 * First page users see - redirects to login or shows welcome
 */
export default function HomePage() {
    return (
        <main className="min-h-screen flex flex-col">
            {/* Hero Section with Gradient Background */}
            <div className="flex-1 flex items-center justify-center bg-gradient-pastel">
                <div className="max-w-4xl mx-auto px-6 py-16 text-center">
                    {/* Logo / Brand */}
                    <div className="mb-8">
                        <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-4">
                            Godin
                        </h1>
                        <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto">
                            Automação de Marketing com IA para o seu Negócio
                        </p>
                    </div>

                    {/* Description */}
                    <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
                        Crie campanhas de marketing, pesquisas de mercado e planos estratégicos
                        com a ajuda de inteligência artificial.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary rounded-xl hover:bg-primary-hover transition-colors shadow-soft"
                        >
                            Começar Agora
                        </Link>
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-text-primary bg-white border border-border rounded-xl hover:bg-surface transition-colors"
                        >
                            Criar Conta
                        </Link>
                    </div>

                    {/* Features Preview */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon="🎯"
                            title="Campanhas de Marketing"
                            description="Gere campanhas completas com planos de conteúdo para redes sociais"
                        />
                        <FeatureCard
                            icon="🔍"
                            title="Pesquisa de Mercado"
                            description="Análise de concorrência e tendências do seu sector"
                        />
                        <FeatureCard
                            icon="📊"
                            title="Plano Estratégico"
                            description="Identidade visual e estratégia de marketing personalizada"
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-6 text-center text-text-muted bg-surface">
                <p>© 2024 Godin. Desenvolvido com ❤️ pela NexelIT</p>
            </footer>
        </main>
    );
}

/**
 * Feature Card Component
 * Displays a feature with icon, title, and description
 */
function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-card">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
            <p className="text-text-secondary text-sm">{description}</p>
        </div>
    );
}
