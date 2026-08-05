'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, Sliders } from 'lucide-react';

const DEFAULT_PRICE_GROUP = {
  id: 'price',
  label: 'Price Range',
  type: 'range',
  min: 0,
  max: 10000,
  step: 100,
};

export default function DynamicFilters({ filterConfig, activeFilters, onChange, onClearAll, maxCatalogPrice = 10000 }) {
  const customGroups = filterConfig?.groups || [];
  const hasCustomPrice = customGroups.some(g => g.id === 'price' || g.type === 'range');
  
  const priceGroup = {
    ...DEFAULT_PRICE_GROUP,
    max: maxCatalogPrice > 0 ? Math.ceil(maxCatalogPrice / 500) * 500 : 10000
  };

  const groups = hasCustomPrice ? customGroups : [priceGroup, ...customGroups];

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

  const hasActiveFilters = Object.values(activeFilters).some(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object' && v !== null) return v.max !== undefined || v.min !== undefined;
    return v !== undefined && v !== null && v !== '';
  });

  return (
    <div className="space-y-0 border border-line rounded-panel overflow-hidden bg-surface shadow-subtle">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-line bg-surface-muted">
        <span className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-accent" />
          Filter Products
        </span>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-[11px] font-black text-danger hover:underline flex items-center gap-1"
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

                {/* RANGE SLIDER */}
                {group.type === 'range' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between bg-surface-muted p-2.5 rounded-card border border-line">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-extrabold text-ink-subtle uppercase">Max Price</span>
                        <span className="text-xs font-black text-accent">
                          ₹{(activeVal?.max ?? group.max ?? 10000).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {activeVal?.max !== undefined && activeVal.max < group.max && (
                        <button
                          onClick={() => handleRange(group.id, 'max', group.max)}
                          className="text-[10px] font-bold text-ink-subtle hover:text-danger"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    
                    <input
                      type="range"
                      min={group.min ?? 0}
                      max={group.max ?? 10000}
                      step={group.step ?? 100}
                      value={activeVal?.max ?? group.max ?? 10000}
                      onChange={e => handleRange(group.id, 'max', e.target.value)}
                      className="w-full h-2 rounded-pill bg-surface-sunken appearance-none cursor-pointer accent-accent"
                    />

                    <div className="flex justify-between text-[10px] text-ink-subtle font-bold px-0.5">
                      <span>₹{(group.min ?? 0).toLocaleString('en-IN')}</span>
                      <span>₹{(group.max ?? 10000).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* CHECKBOX */}
                {group.type === 'checkbox' && (group.options || []).map(opt => (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group py-0.5">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-line accent-accent cursor-pointer"
                      checked={(activeVal || []).includes(opt.value)}
                      onChange={e => handleCheckbox(group.id, opt.value, e.target.checked)}
                    />
                    <span className="text-xs font-semibold text-ink group-hover:text-accent transition">
                      {opt.label}
                    </span>
                  </label>
                ))}

                {/* RADIO */}
                {group.type === 'radio' && (group.options || []).map(opt => (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group py-0.5">
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
                              ? 'bg-ink text-ink-inverse border-ink shadow-subtle'
                              : 'bg-surface text-ink border-line hover:border-line-strong'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
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
