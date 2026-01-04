/**
 * UI Components - Barrel Export
 * 
 * Central export for all UI components.
 * Import from here for consistent access to the design system.
 * 
 * @example
 * import { Button, Card, Input } from '@/components/ui';
 */

// Base components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Card, CardHeader, CardContent, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

// Dashboard components
export { NotificationList } from './NotificationList';
export type { NotificationItem } from './NotificationList';

export { OnboardingProgress } from './OnboardingProgress';

export { SmartTips } from './SmartTips';
