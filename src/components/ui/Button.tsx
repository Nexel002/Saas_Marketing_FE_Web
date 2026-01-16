import { ButtonHTMLAttributes, forwardRef } from 'react';

/**
 * Button Component
 * 
 * A versatile button component with multiple variants and sizes.
 * Follows the Godin design system with primary, secondary, outline, and ghost variants.
 * 
 * @example
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="outline" isLoading>Loading...</Button>
 */

// =============================================
// Types
// =============================================

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Right icon element */
  rightIcon?: React.ReactNode;
}

// =============================================
// Styles
// =============================================

const baseStyles = `
  inline-flex items-center justify-center
  font-medium rounded-xl
  transition-all duration-200
  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const variantStyles = {
  primary: `
    bg-primary text-white
    hover:bg-primary-600 active:bg-primary-700
    shadow-soft hover:shadow-md
  `,
  secondary: `
    bg-surface text-text-primary
    hover:bg-gray-100 active:bg-gray-200
    border border-border
  `,
  outline: `
    bg-transparent text-primary
    border-2 border-primary
    hover:bg-primary hover:text-white
  `,
  ghost: `
    bg-transparent text-text-secondary
    hover:bg-surface hover:text-text-primary
  `,
  danger: `
    bg-error text-white
    hover:bg-red-600 active:bg-red-700
  `,
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-base gap-2',
  lg: 'px-7 py-3.5 text-lg gap-2.5',
};

// =============================================
// Component
// =============================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const classes = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <span className="spinner mr-2" />
        )}

        {/* Left icon */}
        {!isLoading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}

        {/* Button text */}
        <span>{children}</span>

        {/* Right icon */}
        {rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
