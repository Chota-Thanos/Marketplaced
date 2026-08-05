'use client';

import React, { useState } from 'react';
import { ShieldCheck, Star, Upload, CheckCircle, Sparkles, X } from 'lucide-react';

export default function VerifiedReviewModal({ isOpen, onClose, product, onSubmitReview }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hasMedia, setHasMedia] = useState(false);
  const [bisAccepted, setBisAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bisAccepted) return;

    setSubmitted(true);
    setTimeout(() => {
      onSubmitReview({
        user: "Abrar Patel",
        rating,
        comment,
        verified: true,
        hasMedia,
        date: new Date().toISOString().split('T')[0]
      });
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-surface border border-line rounded-panel p-6 text-ink shadow-panel overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-subtle hover:text-ink p-2 rounded-pill bg-surface-sunken hover:bg-surface-sunken transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-control bg-success-soft border border-success flex items-center justify-center text-success font-bold">
            <ShieldCheck className="w-6 h-6 text-success" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs font-black text-success">
              <span>BIS IS 19000:2022 Compliant</span>
            </div>
            <h3 className="text-lg font-black text-ink">Submit Verified Review</h3>
          </div>
        </div>

        {/* Product Snippet */}
        <div className="bg-surface-muted p-3 rounded-card flex items-center gap-3 mb-4 border border-line">
          <img src={product.image} alt={product.title} className="w-12 h-12 object-cover rounded-control bg-surface border" />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-ink truncate">{product.title}</h4>
            <p className="text-[11px] text-success flex items-center gap-1 mt-0.5 font-bold">
              <CheckCircle className="w-3.5 h-3.5" /> Order ORD-94815 (Delivered)
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-pill bg-success-soft border border-success text-success mx-auto flex items-center justify-center animate-bounce shadow-card">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-ink">Review Submitted for Admin Moderation!</h4>
            {hasMedia && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill bg-warning-soft border border-warning text-warning text-xs font-black animate-pulse">
                <Sparkles className="w-4 h-4 text-warning" /> ₹50 Cashback Credited to your UPI!
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-bold text-ink-muted mb-1.5" htmlFor="verifiedreviewmodal-f1">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-rating text-warning'
                          : 'text-ink-subtle'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <label htmlFor="verifiedreviewmodal-f1" className="block text-xs font-bold text-ink-muted mb-1.5">Review Feedback</label>
              <textarea id="verifiedreviewmodal-f1"
                rows={3}
                required
                placeholder="Share your experience regarding fit, quality, packaging..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-surface-muted border border-line rounded-control p-3 text-xs text-ink placeholder-ink-subtle focus:outline-none focus:border-warning focus:bg-surface transition"
              />
            </div>

            {/* Media Upload (Reward Trigger) */}
            <div className="bg-gradient-to-r from-warning-soft to-accent-soft p-4 rounded-card border border-warning">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-warning flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Media Reward (+₹50 Cashback)
                </span>
                <span className="text-[10px] text-ink-subtle font-bold">Photo / Video</span>
              </div>

              <button
                type="button"
                onClick={() => setHasMedia(!hasMedia)}
                className={`w-full py-2.5 px-3 rounded-control border border-dashed text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                  hasMedia
                    ? 'bg-warning border-warning text-ink-inverse shadow-card'
                    : 'bg-surface border-line text-ink-muted hover:border-warning'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{hasMedia ? 'Media Attached! (+₹50 Cashback Unlocked)' : 'Upload Product Photo or Reel Video'}</span>
              </button>
            </div>

            {/* BIS IS 19000:2022 Compliance Checkbox */}
            <div className="flex items-start gap-2.5 text-xs text-ink-muted bg-surface-muted p-3 rounded-control border border-line font-medium">
              <input
                type="checkbox"
                id="bisCheck"
                checked={bisAccepted}
                onChange={(e) => setBisAccepted(e.target.checked)}
                className="mt-0.5 rounded border-line text-warning focus:ring-warning accent-warning"
              />
              <label htmlFor="bisCheck" className="text-[11px] leading-tight cursor-pointer">
                I hereby accept BIS IS 19000:2022 terms guaranteeing this review is authentic based on my verified delivered purchase experience.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!bisAccepted}
              className={`w-full py-3 rounded-control font-bold text-xs flex items-center justify-center gap-2 shadow-card transition ${
                bisAccepted
                  ? 'btn-primary'
                  : 'bg-surface-sunken text-ink-subtle cursor-not-allowed border border-line'
              }`}
            >
              <span>Submit for Moderation</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
