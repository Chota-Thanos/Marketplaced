'use client';

import React from 'react';
import { cn } from './cn';

/**
 * The button. Replaces 233 hand-rolled <button> elements that between them used
 * 12 different padding combinations and 5 different corner radii.
 *
 * Every visual decision is a token lookup, so a button is correct in dark mode
 * without a single `dark:` class.
 */

const VARIANTS = {
  primary:
    'bg-primary text-on-primary shadow-button hover:bg-primary-hover hover:-translate-y-px active:translate-y-0',
  secondary:
    'bg-surface text-ink border border-line hover:border-line-strong hover:bg-surface-muted',
  accent:
    'bg-accent text-on-accent shadow-button hover:bg-accent-hover hover:-translate-y-px active:translate-y-0',
  highlight:
    'bg-highlight text-on-highlight hover:bg-highlight-hover',
  danger:
    'bg-danger text-on-primary hover:bg-danger-hover',
  'danger-soft':
    'bg-danger-soft text-danger border border-danger/20 hover:bg-danger hover:text-on-primary',
  ghost:
    'bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink',
  link:
    'bg-transparent text-accent underline-offset-4 hover:underline p-0 shadow-none',
};

const SIZES = {
  xs: 'text-2xs px-2.5 py-1 gap-1',
  sm: 'text-xs px-3.5 py-2 gap-1.5',
  md: 'text-sm px-5 py-2.5 gap-2',
  lg: 'text-base px-6 py-3.5 gap-2',
};

const ICON_SIZES = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3',
};

export const Button = React.forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    shape = 'pill',
    loading = false,
    disabled = false,
    iconOnly = false,
    fullWidth = false,
    leadingIcon = null,
    trailingIcon = null,
    className,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const isNativeButton = Tag === 'button';

  return (
    <Tag
      ref={ref}
      // `as` exists so a navigation control can look identical to a button
      // without pretending to be one. A Link rendered here keeps its anchor
      // semantics; only <button> gets type/disabled, and a disabled link is
      // expressed with aria-disabled since anchors have no disabled state.
      type={isNativeButton ? type : undefined}
      disabled={isNativeButton ? isDisabled : undefined}
      aria-disabled={!isNativeButton && isDisabled ? true : undefined}
      // A loading button is still focusable-adjacent for screen readers, so say
      // so rather than relying on the spinner being noticed visually.
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-bold whitespace-nowrap',
        'transition-all duration-[var(--ds-motion-base)] ease-[var(--ds-motion-ease)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:opacity-50 disabled:pointer-events-none',
        shape === 'pill' ? 'rounded-pill' : 'rounded-control',
        VARIANTS[variant] || VARIANTS.primary,
        iconOnly ? ICON_SIZES[size] : SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block size-4 shrink-0 animate-spin rounded-pill border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </Tag>
  );
});

export default Button;
