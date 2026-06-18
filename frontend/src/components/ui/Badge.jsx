/**
 * Badge — pill label with semantic color variants.
 * Uses teal/cyan as primary data color per user preference.
 */
import { cn } from '../../lib/utils';
import { cva } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide whitespace-nowrap border',
  {
    variants: {
      type: {
        default: 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-default)]',
        blue:    'bg-[#E6FAF7] text-[#00A896] border-[#B2F0E6] dark:bg-[#0a2e2a] dark:text-[#00D264] dark:border-[#0d4a3f]',
        teal:    'bg-[#E6FAF7] text-[#00A896] border-[#B2F0E6] dark:bg-[#0a2e2a] dark:text-[#00D264] dark:border-[#0d4a3f]',
        amber:   'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
        red:     'bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
        green:   'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
        purple:  'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800',
      },
    },
    defaultVariants: {
      type: 'default',
    },
  }
);

export function Badge({ children, type = 'default', className }) {
  return (
    <span
      className={cn(badgeVariants({ type }), className)}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {children}
    </span>
  );
}
