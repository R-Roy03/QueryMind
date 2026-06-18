/**
 * Skeleton — shimmer loading placeholder.
 * Cogrion enterprise light theme.
 */
import { cn } from '../../lib/utils';

export function Skeleton({ width = '100%', height = 16, rounded = 12, className }) {
  return (
    <div
      className={cn(
        'animate-[shimmer_2s_infinite_linear]',
        className,
      )}
      style={{
        width,
        height,
        borderRadius: rounded,
        background: 'linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-hover) 50%, var(--bg-surface) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
}
