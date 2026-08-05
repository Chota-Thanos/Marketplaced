'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from './cn';
import { Button } from './Button';

/**
 * Modal and Drawer.
 *
 * There were 16 independent `fixed inset-0` overlays in this codebase. Each one
 * had to remember Escape handling, background scroll lock, focus trapping and
 * focus restore — and most remembered some but not all, which is how a keyboard
 * user ends up tabbing into the page behind an open dialog. Doing it once here
 * means the next overlay gets all four by construction.
 */

function useDialogBehaviour(isOpen, onClose, panelRef) {
  const restoreFocusTo = React.useRef(null);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    restoreFocusTo.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    // Move focus into the dialog so the next Tab starts inside it.
    const initial = focusables()[0] || panelRef.current;
    initial?.focus?.();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      // Wrap at both ends, so focus can never reach the page behind.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      restoreFocusTo.current?.focus?.();
    };
  }, [isOpen, onClose, panelRef]);
}

const WIDTHS = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[95vw]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  footer = null,
  className,
  children,
  closeOnBackdrop = true,
}) {
  const panelRef = React.useRef(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  useDialogBehaviour(isOpen, onClose, panelRef);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={closeOnBackdrop ? onClose : undefined}
        className="absolute inset-0 bg-inverse/50 backdrop-blur-sm cursor-default"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-surface text-ink rounded-panel shadow-panel',
          'flex flex-col max-h-[90vh] overflow-hidden',
          WIDTHS[size],
          className,
        )}
      >
        {(title || onClose) && (
          <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-lg font-extrabold text-ink truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="text-xs text-ink-muted mt-0.5">
                  {description}
                </p>
              )}
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </Button>
            )}
          </header>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line bg-surface-muted shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function Drawer({
  isOpen,
  onClose,
  title,
  side = 'right',
  footer = null,
  className,
  children,
}) {
  const panelRef = React.useRef(null);
  const titleId = React.useId();

  useDialogBehaviour(isOpen, onClose, panelRef);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal">
      <button
        type="button"
        aria-label="Close panel"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-inverse/50 backdrop-blur-sm cursor-default"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'absolute top-0 bottom-0 w-full max-w-md bg-surface text-ink shadow-panel',
          'flex flex-col',
          side === 'right' ? 'right-0' : 'left-0',
          className,
        )}
      >
        {(title || onClose) && (
          <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-line shrink-0">
            {title && (
              <h2 id={titleId} className="text-lg font-extrabold text-ink">
                {title}
              </h2>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </Button>
            )}
          </header>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <footer className="border-t border-line px-5 py-4 bg-surface-muted shrink-0">{footer}</footer>
        )}
      </div>
    </div>
  );
}

export default Modal;
