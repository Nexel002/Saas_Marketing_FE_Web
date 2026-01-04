'use client';

import { InputHTMLAttributes, forwardRef, useState, useId } from 'react';

/**
 * Input Component
 * 
 * A flexible input component with label, error state, and optional icons.
 * Supports all standard HTML input types.
 * 
 * @example
 * <Input label="Email" type="email" placeholder="seu@email.com" />
 * <Input label="Password" type="password" error="Password is required" />
 */

// =============================================
// Types
// =============================================

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    /** Label text above the input */
    label?: string;
    /** Error message to display */
    error?: string;
    /** Helper text below the input */
    helperText?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Left icon element */
    leftIcon?: React.ReactNode;
    /** Right icon element */
    rightIcon?: React.ReactNode;
    /** Full width input */
    fullWidth?: boolean;
}

// =============================================
// Styles
// =============================================

const baseInputStyles = `
  w-full rounded-xl border
  bg-white text-text-primary
  placeholder:text-text-muted
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
  disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60
`;

const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
};

const stateStyles = {
    default: 'border-border hover:border-gray-400',
    error: 'border-error focus:ring-error',
};

// =============================================
// Component
// =============================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            size = 'md',
            leftIcon,
            rightIcon,
            fullWidth = true,
            className = '',
            id,
            type = 'text',
            ...props
        },
        ref
    ) => {
        // Use React's useId for consistent server/client IDs (fixes hydration)
        const generatedId = useId();
        const inputId = id || generatedId;

        // State for password visibility toggle
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword && showPassword ? 'text' : type;

        const containerClasses = fullWidth ? 'w-full' : '';

        const inputClasses = `
      ${baseInputStyles}
      ${sizeStyles[size]}
      ${error ? stateStyles.error : stateStyles.default}
      ${leftIcon ? 'pl-11' : ''}
      ${rightIcon || isPassword ? 'pr-11' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

        return (
            <div className={containerClasses}>
                {/* Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-text-primary mb-1.5"
                    >
                        {label}
                    </label>
                )}

                {/* Input wrapper for icons */}
                <div className="relative">
                    {/* Left icon */}
                    {leftIcon && (
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                            {leftIcon}
                        </span>
                    )}

                    {/* Input element */}
                    <input
                        ref={ref}
                        id={inputId}
                        type={inputType}
                        className={inputClasses}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : undefined}
                        {...props}
                    />

                    {/* Right icon or password toggle */}
                    {(rightIcon || isPassword) && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                            {isPassword ? (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="hover:text-text-secondary transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {showPassword ? (
                                        <EyeOffIcon className="w-5 h-5" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5" />
                                    )}
                                </button>
                            ) : (
                                rightIcon
                            )}
                        </span>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <p
                        id={`${inputId}-error`}
                        className="mt-1.5 text-sm text-error flex items-center gap-1"
                    >
                        <AlertIcon className="w-4 h-4" />
                        {error}
                    </p>
                )}

                {/* Helper text */}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-text-muted">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

// =============================================
// Icon Components (inline SVGs)
// =============================================

function EyeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function EyeOffIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    );
}

function AlertIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

export default Input;
