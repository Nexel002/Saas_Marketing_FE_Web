import { HTMLAttributes, forwardRef } from 'react';

/**
 * Card Component
 * 
 * A container component with soft shadows and optional gradient background.
 * Used for grouping related content throughout the application.
 * 
 * @example
 * <Card>
 *   <CardHeader>Title</CardHeader>
 *   <CardContent>Content here</CardContent>
 * </Card>
 */

// =============================================
// Types
// =============================================

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Visual variant of the card */
    variant?: 'default' | 'elevated' | 'outline' | 'gradient';
    /** Padding size */
    padding?: 'none' | 'sm' | 'md' | 'lg';
    /** Whether the card is hoverable */
    hoverable?: boolean;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> { }
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> { }
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> { }

// =============================================
// Styles
// =============================================

const baseStyles = 'rounded-2xl overflow-hidden';

const variantStyles = {
    default: 'bg-white shadow-card',
    elevated: 'bg-white shadow-soft',
    outline: 'bg-white border border-border',
    gradient: 'bg-gradient-subtle shadow-card',
};

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

// =============================================
// Components
// =============================================

export const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            variant = 'default',
            padding = 'md',
            hoverable = false,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const hoverStyles = hoverable
            ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
            : '';

        const classes = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${paddingStyles[padding]}
      ${hoverStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

/**
 * Card Header - Title section of the card
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`mb-4 ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardHeader.displayName = 'CardHeader';

/**
 * Card Content - Main content area of the card
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <div ref={ref} className={className} {...props}>
                {children}
            </div>
        );
    }
);

CardContent.displayName = 'CardContent';

/**
 * Card Footer - Bottom section with actions
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`mt-4 pt-4 border-t border-border ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardFooter.displayName = 'CardFooter';

export default Card;
