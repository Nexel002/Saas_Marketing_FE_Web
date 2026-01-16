'use client';

import React from 'react';

/**
 * Onboarding Step Interface
 */
interface OnboardingStep {
    id: string;
    label: string;
    completed: boolean;
    current?: boolean;
}

/**
 * OnboardingProgress Props
 */
interface OnboardingProgressProps {
    hasBusiness: boolean;
    hasMarketResearch: boolean;
    hasStrategicPlan: boolean;
    hasCampaigns: boolean;
}

/**
 * OnboardingProgress Component
 * 
 * Displays a clean, minimal progress bar showing the user's
 * onboarding progress through the platform.
 */
export function OnboardingProgress({
    hasBusiness,
    hasMarketResearch,
    hasStrategicPlan,
    hasCampaigns
}: OnboardingProgressProps) {
    // Define steps
    const steps: OnboardingStep[] = [
        { id: 'account', label: 'Conta', completed: true }, // Always true if logged in
        { id: 'business', label: 'Negócio', completed: hasBusiness },
        { id: 'research', label: 'Pesquisa', completed: hasMarketResearch },
        { id: 'plan', label: 'Plano', completed: hasStrategicPlan },
        { id: 'campaign', label: 'Campanha', completed: hasCampaigns },
    ];

    // Calculate progress
    const completedCount = steps.filter(s => s.completed).length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    // All steps completed
    if (progressPercent === 100) {
        return null; // Don't show when complete
    }

    // Find current step (first incomplete)
    const currentStepIndex = steps.findIndex(s => !s.completed);
    if (currentStepIndex !== -1) {
        steps[currentStepIndex].current = true;
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <h3 className="font-semibold text-gray-800">Configure seu Godin</h3>
                </div>
                <span className="text-sm font-medium text-primary">{progressPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                <div
                    className="h-full bg-gradient-to-r from-primary to-primary-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Steps */}
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className="flex flex-col items-center"
                    >
                        {/* Step Circle */}
                        <div
                            className={`
                                w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all
                                ${step.completed
                                    ? 'bg-primary text-white'
                                    : step.current
                                        ? 'bg-primary/10 text-primary border-2 border-primary'
                                        : 'bg-gray-100 text-gray-400'
                                }
                            `}
                        >
                            {step.completed ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <span className="text-xs font-medium">{index + 1}</span>
                            )}
                        </div>

                        {/* Step Label */}
                        <span
                            className={`
                                text-xs font-medium transition-colors
                                ${step.completed
                                    ? 'text-primary'
                                    : step.current
                                        ? 'text-gray-800'
                                        : 'text-gray-400'
                                }
                            `}
                        >
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Current Step Action */}
            {currentStepIndex !== -1 && (
                <div className="mt-5 pt-4 border-t border-gray-50">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Próximo passo:</span>{' '}
                        {getStepAction(steps[currentStepIndex].id)}
                    </p>
                </div>
            )}
        </div>
    );
}

/**
 * Get action text for each step
 */
function getStepAction(stepId: string): string {
    switch (stepId) {
        case 'business':
            return 'Configure os dados do seu negócio';
        case 'research':
            return 'Gere uma pesquisa de mercado com a IA';
        case 'plan':
            return 'Crie seu plano estratégico';
        case 'campaign':
            return 'Lance sua primeira campanha de marketing';
        default:
            return 'Continue configurando sua conta';
    }
}

export default OnboardingProgress;
