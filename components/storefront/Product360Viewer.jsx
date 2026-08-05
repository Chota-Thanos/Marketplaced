"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

/**
 * Drag (or arrow-key) to spin through an ordered set of frames.
 * Autoplay actually animates — previously "play" only froze the drag handler.
 */
export default function Product360Viewer({ images = [], alt = 'Product' }) {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const dragging = useRef(false);
  const lastX = useRef(0);

  const total = images.length;

  const step = useCallback((delta) => {
    setFrame(f => ((f + delta) % total + total) % total);
  }, [total]);

  // Autoplay loop — this is what the play button now actually does.
  useEffect(() => {
    if (!isPlaying || total === 0) return;
    const id = setInterval(() => step(1), 90);
    return () => clearInterval(id);
  }, [isPlaying, total, step]);

  const onPointerDown = (e) => {
    dragging.current = true;
    lastX.current = e.clientX;
    setIsPlaying(false);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging.current || total === 0) return;
    const dx = e.clientX - lastX.current;
    // One frame per ~8px of travel keeps the spin speed natural.
    if (Math.abs(dx) >= 8) {
      step(dx > 0 ? 1 : -1);
      lastX.current = e.clientX;
    }
  };

  const endDrag = (e) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
  };

  // Nothing to spin — render nothing rather than a fake frame counter.
  if (total === 0) return null;

  return (
    <div className="space-y-2">
      <div
        // Semantically a slider over the frame sequence: arrow keys step
        // through frames, which is exactly the slider interaction model.
        role="slider"
        aria-label={`360 degree view of ${alt}. Drag or use arrow keys to rotate.`}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={frame + 1}
        aria-valuetext={`Frame ${frame + 1} of ${total}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="relative w-full aspect-square bg-canvas border border-line rounded-panel overflow-hidden cursor-ew-resize select-none group touch-none focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {/* All frames stay mounted so spinning doesn't re-request images. */}
        {images.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={i === frame ? `${alt} — frame ${i + 1} of ${total}` : ''}
            aria-hidden={i !== frame}
            draggable={false}
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-75 ${
              i === frame ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-inverse/70 backdrop-blur-md px-4 py-2 rounded-pill opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setIsPlaying(p => !p)}
            aria-label={isPlaying ? 'Pause rotation' : 'Play rotation'}
            className="text-ink-inverse hover:text-highlight"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <span className="text-[10px] text-ink-inverse uppercase tracking-wider font-bold flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> 360° · {frame + 1}/{total}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-ink-subtle text-center font-medium">Drag to rotate — or focus and use ← →</p>
    </div>
  );
}
