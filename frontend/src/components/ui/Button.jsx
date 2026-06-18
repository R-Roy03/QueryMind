/**
 * Button — gradient primary, teal, ghost, danger variants.
 * Cogrion enterprise light theme with hover glow and press feedback.
 */
import { cn } from '../../lib/utils';
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  // Base
  'inline-flex items-center justify-center gap-1.5 font-semibold cursor-pointer select-none transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: [
          'text-white rounded-lg',
          'shadow-[0_4px_16px_rgba(6,182,212,0.2)]',
          'hover:shadow-[0_6px_24px_rgba(6,182,212,0.3)]',
          'hover:brightness-110',
        ].join(' '),
        teal: [
          'text-white rounded-lg',
          'shadow-[0_4px_16px_rgba(16,185,129,0.2)]',
          'hover:shadow-[0_6px_24px_rgba(16,185,129,0.3)]',
          'hover:brightness-110',
        ].join(' '),
        ghost: [
          'rounded-lg border',
          'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)]',
          'hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)]',
        ].join(' '),
        danger: [
          'rounded-lg border',
          'bg-red-50 text-red-600 border-red-200',
          'dark:bg-red-950 dark:text-red-400 dark:border-red-800',
          'hover:bg-red-100 dark:hover:bg-red-900',
        ].join(' '),
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-[13px]',
        lg: 'px-6 py-2.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  size = 'md',
  icon,
  style: overrideStyle = {},
  className,
}) {
  // Gradient backgrounds need inline style since Tailwind can't do complex gradients easily
  const gradientStyles = {
    primary: { background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-azure))' },
    teal: { background: 'linear-gradient(135deg, #10B981, #059669)' },
    ghost: {},
    danger: {},
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      style={{
        ...(gradientStyles[variant] || {}),
        fontFamily: "'Inter', system-ui, sans-serif",
        ...overrideStyle,
      }}
    >
      {icon && icon}
      {children}
    </button>
  );
}
