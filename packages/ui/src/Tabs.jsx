'use client';

import React from 'react';
import { cn } from './cn';

/**
 * Tabs — the filter-chip row used by admin order/return/review queues and by
 * the customer's order filters. Each of those built its own, so the selected
 * state looked different on every screen and none exposed tab semantics.
 */
export function Tabs({ tabs, value, onChange, className, size = 'md' }) {
  return (
    <div role="tablist" className={cn('flex flex-wrap items-center gap-2', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-2 font-bold rounded-pill whitespace-nowrap',
              'transition-colors duration-[var(--ds-motion-fast)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
              size === 'sm' ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2',
              active
                ? 'bg-primary text-on-primary'
                : 'bg-surface text-ink-muted border border-line hover:border-line-strong hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-pill px-1.5 py-0.5 text-2xs',
                  active ? 'bg-on-primary/20' : 'bg-surface-sunken',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
