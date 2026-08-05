"use client";

import { useState } from 'react';
import { Gift } from 'lucide-react';

export default function LoyaltyPointsRedemption({ availablePoints = 1250, conversionRate = 0.1, onRedeem }) {
  const [redeemAmount, setRedeemAmount] = useState(0);
  
  const maxRedeemableValue = availablePoints * conversionRate;

  const handleApply = () => {
    if (onRedeem) onRedeem(redeemAmount);
  };

  return (
    <div className="bg-inverse border border-line-strong rounded-control p-4 mt-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-warning/10 text-warning rounded-pill">
          <Gift size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-ink-inverse">BazaarX Loyalty Points</h4>
          <p className="text-sm text-ink-subtle">Available: {availablePoints} points (₹{maxRedeemableValue})</p>
        </div>
      </div>
      
      {availablePoints > 0 ? (
        <div className="flex space-x-3">
          <input 
            type="number" 
            min="0" 
            max={availablePoints}
            placeholder="Points to redeem"
            className="flex-1 bg-inverse border border-line-strong rounded-control px-4 py-2 text-ink-inverse focus:outline-none focus:border-warning/50"
            value={redeemAmount || ''}
            onChange={(e) => setRedeemAmount(Math.min(availablePoints, Math.max(0, parseInt(e.target.value) || 0)))}
          />
          <button 
            onClick={handleApply}
            disabled={redeemAmount <= 0}
            className="px-6 py-2 bg-inverse text-ink-inverse font-medium rounded-control hover:bg-inverse disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      ) : (
        <p className="text-sm text-ink-subtle">You don't have enough points to redeem yet. Keep shopping to earn more!</p>
      )}
    </div>
  );
}
