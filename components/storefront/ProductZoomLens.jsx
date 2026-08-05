'use client';

import React, { useState, useRef } from 'react';
import { ZoomIn } from 'lucide-react';

const ZOOM_FACTOR = 2.2;

/**
 * Hover-to-magnify: moving the cursor over the image reveals a zoomed crop
 * in the same box (in-place, not a side panel — a side panel would spill
 * into the info column next to it in the two-column PDP grid). The overlay
 * is pointer-events-none so it never blocks hotspot pins layered above it.
 */
export default function ProductZoomLens({ src, alt, children, className = '' }) {
  const [active, setActive] = useState(false);
  const [bg, setBg] = useState({ size: '100% 100%', position: '0 0' });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setBg({
      size: `${ZOOM_FACTOR * 100}% ${ZOOM_FACTOR * 100}%`,
      position: `${xPct}% ${yPct}%`,
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={handleMouseMove}
    >
      {children}

      {/* Zoomed crop, revealed on hover — same box, no layout side-effects. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none transition-opacity duration-100 ${active ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: bg.size,
          backgroundPosition: bg.position,
          backgroundRepeat: 'no-repeat',
        }}
      />

      {!active && (
        <div className="absolute bottom-4 right-4 bg-inverse/60 text-ink-inverse text-[10px] font-bold px-2.5 py-1.5 rounded-pill items-center gap-1 pointer-events-none hidden sm:flex z-10">
          <ZoomIn className="w-3 h-3" /> Hover to zoom
        </div>
      )}
    </div>
  );
}
