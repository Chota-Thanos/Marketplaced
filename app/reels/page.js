import React from 'react';
import { apiFetch, mapProduct } from '../../lib/apiClient';
import ReelsClient from '../../components/storefront/ReelsClient';

export const dynamic = 'force-dynamic';

/**
 * Shoppertainment feed — an optional layer, not a requirement.
 *
 * Reels are products a seller specifically opted into (`reel_video_url` set in
 * the admin product form), never the catalogue at large. Most sellers will
 * attach a clip to few products or none, so an empty feed here is the ordinary
 * case, and `ReelsClient` renders a real empty state for it rather than
 * erroring or falling back to placeholder data.
 */
export default async function ReelsPage() {
  const res = await apiFetch('/reels');
  const reels = (res.data || []).map(mapProduct);

  return <ReelsClient reels={reels} />;
}
