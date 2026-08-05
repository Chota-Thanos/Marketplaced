'use client';

import React from 'react';
import { cn } from './cn';

/** Card — the default container. One radius, one border, one shadow rule. */
export function Card({ as: Tag = 'div', interactive = false, padded = true, className, children, ...props }) {
  return (
    <Tag
      className={cn(
        'bg-surface border border-line rounded-card',
        padded && 'p-5',
        interactive &&
          'transition-all duration-[var(--ds-motion-base)] hover:border-line-strong hover:shadow-card hover:-translate-y-0.5',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Panel — a larger container for page sections and sidebars. */
export function Panel({ as: Tag = 'section', className, children, ...props }) {
  return (
    <Tag className={cn('bg-surface border border-line rounded-panel p-6', className)} {...props}>
      {children}
    </Tag>
  );
}

const BADGE_TONES = {
  neutral: 'bg-surface-sunken text-ink-muted',
  primary: 'bg-primary text-on-primary',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  highlight: 'bg-highlight text-on-highlight',
  sale: 'bg-sale text-on-primary',
  new: 'bg-new text-on-primary',
};

/** Badge — status pills, tags, counts. */
export function Badge({ tone = 'neutral', size = 'sm', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-bold rounded-pill whitespace-nowrap',
        size === 'xs' ? 'text-2xs px-2 py-0.5' : 'text-xs px-2.5 py-1',
        BADGE_TONES[tone] || BADGE_TONES.neutral,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const ALERT_TONES = {
  info: 'bg-info-soft text-info border-info/20',
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
};

/** Alert — inline messages. Errors announce themselves. */
export function Alert({ tone = 'info', title, className, children, ...props }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('rounded-control border px-4 py-3 text-base', ALERT_TONES[tone], className)}
      {...props}
    >
      {title && <p className="font-bold mb-0.5">{title}</p>}
      {children}
    </div>
  );
}

/** Skeleton — loading placeholder. */
export function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-surface-sunken rounded-control', className)}
      {...props}
    />
  );
}

/** Spinner — for inline async state outside a Button. */
export function Spinner({ className, label = 'Loading' }) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <span
        className={cn(
          'inline-block size-5 animate-spin rounded-pill border-2 border-line border-t-accent',
          className,
        )}
      />
    </span>
  );
}

/** EmptyState — the "nothing here yet" panel, consistent everywhere. */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)}>
      {Icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-pill bg-surface-sunken text-ink-subtle">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-md font-extrabold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-base text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default Card;
