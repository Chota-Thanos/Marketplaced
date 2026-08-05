'use client';

import React from 'react';
import { ZoomIn } from 'lucide-react';
import { Modal } from '@ds/ui';

/**
 * Zoomed view of a product hotspot.
 *
 * The overlay, backdrop dismissal, Escape handling, focus trap and scroll lock
 * all come from Modal now. This file previously reimplemented the first three
 * and had none of the last two, so a keyboard user could tab out of the open
 * dialog into the page behind it.
 */
export default function HotspotDetailModal({ hotspot, onClose }) {
  if (!hotspot) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="sm"
      title={hotspot.title || 'Product detail'}
      className="overflow-hidden"
    >
      <div className="relative aspect-square bg-surface-sunken -mx-6 -mt-5 mb-4">
        {hotspot.zoomedImage ? (
          <img
            src={hotspot.zoomedImage}
            alt={hotspot.title || 'Close-up of the selected product detail'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-subtle text-xs font-bold">
            No close-up image provided
          </div>
        )}
        {hotspot.zoomRatio && (
          <span className="absolute top-3 left-3 bg-inverse/85 text-ink-inverse text-2xs font-black px-2.5 py-1 rounded-pill flex items-center gap-1">
            <ZoomIn className="w-3 h-3" /> {hotspot.zoomRatio}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {hotspot.detail && (
          <p className="text-base text-ink-muted font-medium leading-relaxed">{hotspot.detail}</p>
        )}
        {hotspot.techSpecs && (
          <p className="text-xs font-mono text-ink-subtle bg-surface-muted border border-line rounded-control px-3 py-2 mt-2">
            {hotspot.techSpecs}
          </p>
        )}
      </div>
    </Modal>
  );
}
