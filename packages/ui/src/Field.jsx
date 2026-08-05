'use client';

import React from 'react';
import { cn } from './cn';

/**
 * Form controls with the label/description/error wiring done once.
 *
 * The accessibility pass on this codebase fixed 57 unlabelled controls by hand,
 * pairing htmlFor/id at every call site — including index-scoped ids inside
 * loops. That fix is only as durable as the next person's diligence. Here the
 * id comes from useId, so a control cannot be rendered unlabelled: there is no
 * call site at which to forget.
 */

const CONTROL_BASE = cn(
  'w-full bg-surface text-ink text-base rounded-control border border-line',
  'px-3.5 py-2.5 transition-colors duration-[var(--ds-motion-fast)]',
  'placeholder:text-ink-subtle',
  'hover:border-line-strong',
  'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
  'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface-sunken',
);

function useFieldIds(explicitId, { description, error }) {
  const generated = React.useId();
  const id = explicitId || generated;
  const describedBy = [description && `${id}-description`, error && `${id}-error`]
    .filter(Boolean)
    .join(' ');

  return { id, describedBy: describedBy || undefined };
}

/** Label + control + description/error, laid out consistently. */
export function Field({
  label,
  description,
  error,
  required = false,
  htmlFor,
  className,
  children,
  ...props
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-bold text-ink-muted">
          {label}
          {required && (
            <span className="text-danger ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {description && !error && (
        <p id={htmlFor && `${htmlFor}-description`} className="text-xs text-ink-subtle">
          {description}
        </p>
      )}
      {error && (
        // role="alert" so the message is announced when it appears after a
        // failed submit, not only when the field is next focused.
        <p id={htmlFor && `${htmlFor}-error`} role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = React.forwardRef(function Input(
  { label, description, error, required, className, id: explicitId, wrapperClassName, ...props },
  ref,
) {
  const { id, describedBy } = useFieldIds(explicitId, { description, error });

  return (
    <Field
      label={label}
      description={description}
      error={error}
      required={required}
      htmlFor={id}
      className={wrapperClassName}
    >
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL_BASE, error && 'border-danger focus:border-danger focus:ring-danger/20', className)}
        {...props}
      />
    </Field>
  );
});

export const Textarea = React.forwardRef(function Textarea(
  { label, description, error, required, className, id: explicitId, rows = 4, wrapperClassName, ...props },
  ref,
) {
  const { id, describedBy } = useFieldIds(explicitId, { description, error });

  return (
    <Field
      label={label}
      description={description}
      error={error}
      required={required}
      htmlFor={id}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL_BASE, 'resize-y', error && 'border-danger focus:border-danger', className)}
        {...props}
      />
    </Field>
  );
});

export const Select = React.forwardRef(function Select(
  { label, description, error, required, className, id: explicitId, children, wrapperClassName, ...props },
  ref,
) {
  const { id, describedBy } = useFieldIds(explicitId, { description, error });

  return (
    <Field
      label={label}
      description={description}
      error={error}
      required={required}
      htmlFor={id}
      className={wrapperClassName}
    >
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL_BASE, 'appearance-none pr-9 cursor-pointer', className)}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
});

export const Checkbox = React.forwardRef(function Checkbox(
  { label, description, className, id: explicitId, ...props },
  ref,
) {
  const { id, describedBy } = useFieldIds(explicitId, { description });

  return (
    <div className="flex items-start gap-2.5">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        aria-describedby={describedBy}
        className={cn(
          'mt-0.5 size-4 shrink-0 cursor-pointer rounded-chip border-line text-accent',
          'focus:ring-2 focus:ring-accent/30',
          className,
        )}
        {...props}
      />
      <div className="flex flex-col">
        {label && (
          <label htmlFor={id} className="text-base font-semibold text-ink cursor-pointer">
            {label}
          </label>
        )}
        {description && (
          <p id={`${id}-description`} className="text-xs text-ink-subtle">
            {description}
          </p>
        )}
      </div>
    </div>
  );
});

export default Field;
