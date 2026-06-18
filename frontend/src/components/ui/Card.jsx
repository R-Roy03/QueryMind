/**
 * Card — container with rounded corners.
 * NO overflow-hidden here — inner content handles its own overflow.
 * This prevents first-letter clipping at rounded corners.
 */
import { cn } from '../../lib/utils';

export function Card({
  children,
  className,
  style = {},
  glow = false,
  onMouseEnter,
  onMouseLeave,
}) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-card)]',
        'rounded-lg',
        'border border-[var(--border-default)]',
        'shadow-sm',
        glow && 'shadow-[0_0_20px_rgba(6,182,212,0.08)]',
        className,
      )}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}
