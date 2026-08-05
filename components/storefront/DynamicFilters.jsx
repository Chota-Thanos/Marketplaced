'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

/**
 * Renders dynamic filter groups from a category's filterConfig.
 *
 * filterConfig shape:
 * {
 *   groups: [
 *     { id: 'gender', label: 'Gender', type: 'radio', options: [{label, value}] },
 *     { id: 'size',   label: 'Size',   type: 'chip',  options: [{label, value}] },
 *     { id: 'brand',  label: 'Brand',  type: 'checkbox', options: [{label, value}] },
 *     { id: 'price',  label: 'Price',  type: 'range', min: 0, max: 10000, step: 100 },
 *   ]
 * }
 */
export default function DynamicFilters({ filterConfig, activeFilters, onChange, onClearAll }) {
  const groups = filterConfig?.groups || [];
  const [collapsed, setCollapsed] = useState({});

  const toggle = (id) => setCollapsed(s => ({ ...s, [id]: !s[id] }));

  const handleCheckbox = (groupId, value, checked) => {
    const current = activeFilters[groupId] || [];
    const next = checked
      ? [...current, value]
      : current.filter(v => v !== value);
    onChange({ ...activeFilters, [groupId]: next });
  };

  const handleRadio = (groupId, value) => {
    onChange({ ...activeFilters, [groupId]: value });
  };

  const handleRange = (groupId, key, value) => {
    const current = activeFilters[groupId] || {};
    onChange({ ...activeFilters, [groupId]: { ...current, [key]: Number(value) } });
  };

  const hasActiveFilters = Object.values(activeFilters).some(v =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== ''
  );

  if (!groups.length) return null;

  return (
    <div className="space-y-0 border border-line rounded-panel overflow-hidden bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface-muted">
        <span className="text-sm font-black text-ink uppercase tracking-wide">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs font-black text-danger hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      {/* Groups */}
      {groups.map((group) => {
        const isCollapsed = collapsed[group.id];
        const activeVal = activeFilters[group.id];

        return (
          <div key={group.id} className="border-b border-line last:border-b-0">
            {/* Group Header */}
            <button
              onClick={() => toggle(group.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-muted transition"
            >
              <span className="text-xs font-black text-ink uppercase tracking-wider">{group.label}</span>
              {isCollapsed
                ? <ChevronDown className="w-3.5 h-3.5 text-ink-subtle" />
                : <ChevronUp className="w-3.5 h-3.5 text-ink-subtle" />
              }
            </button>

            {/* Group Body */}
            {!isCollapsed && (
              <div className="px-4 pb-4 space-y-2">

                {/* CHECKBOX */}
                {group.type === 'checkbox' && (group.options || []).map(opt => (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-line accent-accent cursor-pointer"
                      checked={(activeVal || []).includes(opt.value)}
                      onChange={e => handleCheckbox(group.id, opt.value, e.target.checked)}
                    />
                    <span className="text-xs font-semibold text-ink group-hover:text-accent transition">
                      {opt.label}
                    </span>
                    {opt.count !== undefined && (
                      <span className="text-[10px] text-ink-subtle ml-auto">({opt.count})</span>
                    )}
                  </label>
                ))}

                {/* RADIO */}
                {group.type === 'radio' && (group.options || []).map(opt => (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name={group.id}
                      className="w-3.5 h-3.5 border-line accent-accent cursor-pointer"
                      checked={activeVal === opt.value}
                      onChange={() => handleRadio(group.id, opt.value)}
                    />
                    <span className="text-xs font-semibold text-ink group-hover:text-accent transition">
                      {opt.label}
                    </span>
                  </label>
                ))}

                {/* CHIP */}
                {group.type === 'chip' && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(group.options || []).map(opt => {
                      const isActive = (activeVal || []).includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleCheckbox(group.id, opt.value, !isActive)}
                          className={`px-2.5 py-1 rounded-control text-[11px] font-bold border transition-all ${
                            isActive
                              ? 'bg-ink text-ink-inverse border-ink'
                              : 'bg-surface text-ink border-line hover:border-line-strong'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* RANGE */}
                {group.type === 'range' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-ink">
                      <span>₹{(activeVal?.min ?? group.min ?? 0).toLocaleString('en-IN')}</span>
                      <span>₹{(activeVal?.max ?? group.max ?? 10000).toLocaleString('en-IN')}</span>
                    </div>
                    <input
                      type="range"
                      min={group.min ?? 0}
                      max={group.max ?? 10000}
                      step={group.step ?? 100}
                      value={activeVal?.max ?? group.max ?? 10000}
                      onChange={e => handleRange(group.id, 'max', e.target.value)}
                      className="w-full accent-accent"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
