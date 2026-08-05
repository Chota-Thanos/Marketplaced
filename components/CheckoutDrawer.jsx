'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Sparkles,
  ArrowRight,
  Smartphone,
  Lock,
  ShoppingBag,
  User,
  Mail,
  KeyRound,
  RefreshCw,
  Tag,
  Wallet,
  XCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from './providers/StoreProvider';
import { apiFetch, formatINR } from '../lib/apiClient';
import { brand } from '@ds/brand';

export default function CheckoutDrawer({ isOpen, onClose, cartItems, onUpdateQty, onRemoveItem, onClearCart }) {
  const { authToken, login, register } = useStore();
  const [step, setStep] = useState('cart'); // 'cart' | 'auth' | 'checkout' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('gpay');
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [address, setAddress] = useState({
    name: 'Abrar Patel',
    phone: '+91 98765 43210',
    street: 'Flat 402, Green Glen Layout, Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103'
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [orderNumber, setOrderNumber] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Coupon + wallet
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // Auth step state
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = appliedCoupon?.discount || 0;
  const shipping = (subtotal - discount) > 1999 || cartItems.length === 0 ? 0 : 99;
  const payableBeforeWallet = Math.max(0, subtotal - discount + shipping);
  const walletApplied = useWallet ? Math.min(walletBalance, payableBeforeWallet) : 0;
  const grandTotal = payableBeforeWallet - walletApplied;

  const cartPayload = () => cartItems.map(item => ({
    product_id: item.id,
    variant_id: item.variantId || null,
    quantity: item.quantity,
  }));

  // Pull saved addresses + wallet balance once the user reaches checkout.
  useEffect(() => {
    if (step !== 'checkout' || !authToken) return;

    apiFetch('/addresses', { token: authToken }).then(res => {
      const list = res.data || [];
      setSavedAddresses(list);
      const preferred = list.find(a => a.is_default) || list[0];
      if (preferred) {
        setAddress({
          name: preferred.name,
          phone: preferred.phone,
          street: [preferred.line1, preferred.line2].filter(Boolean).join(', '),
          city: preferred.city,
          state: preferred.state,
          pincode: preferred.pincode,
        });
      }
    }).catch(() => {});

    apiFetch('/wallet', { token: authToken })
      .then(res => setWalletBalance(res.data.balance || 0))
      .catch(() => {});
  }, [step, authToken]);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponBusy(true);
    setCouponError('');
    try {
      const res = await apiFetch('/coupons/preview', {
        method: 'POST',
        token: authToken,
        body: { code: couponInput.trim(), items: cartPayload() },
      });
      setAppliedCoupon(res.data);
      setCouponInput('');
    } catch (err) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    } finally {
      setCouponBusy(false);
    }
  };

  const handleDetectGps = () => {
    setIsGpsLoading(true);
    setTimeout(() => {
      setAddress(a => ({
        ...a,
        street: 'Auto-detected via GPS: HSR Layout Sector 1, near Metro Station',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102'
      }));
      setIsGpsLoading(false);
    }, 1000);
  };

  const handleProceedToCheckout = () => {
    setStep(authToken ? 'checkout' : 'auth');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (authMode === 'login') {
        await login(authEmail, authPassword);
      } else {
        await register(authName, authEmail, authPhone, authPassword);
      }
      setStep('checkout');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePayNow = async () => {
    setIsPaying(true);
    setCheckoutError('');
    const mockTxn = 'UPI-' + Math.floor(1000000000 + Math.random() * 9000000000);

    try {
      const res = await apiFetch('/orders/checkout', {
        method: 'POST',
        token: authToken,
        body: {
          items: cartPayload(),
          shipping_address: {
            name: address.name,
            phone: address.phone,
            line1: address.street,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          },
          payment_method: 'UPI',
          transaction_id: mockTxn,
          coupon_code: appliedCoupon?.code || null,
          use_wallet: useWallet,
        },
      });

      setOrderNumber(res.data.order_number);
      setStep('success');
      try {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      } catch (e) { /* non-critical: ignore */ }
    } catch (error) {
      setCheckoutError(error.message || 'Failed to place order');
    } finally {
      setIsPaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-inverse/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface text-ink shadow-panel flex flex-col justify-between border-l border-line">

          {/* Header */}
          <div className="p-5 border-b border-line flex items-center justify-between bg-surface-muted">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-control bg-accent text-ink-inverse flex items-center justify-center font-black text-sm shadow-subtle">
                {brand.logoInitials}
              </div>
              <h2 className="text-lg font-black text-ink">
                {step === 'cart' && 'Your Shopping Bag'}
                {step === 'auth' && 'Sign In to Continue'}
                {step === 'checkout' && '1-Click UPI Checkout'}
                {step === 'success' && 'Order Confirmed!'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-ink-subtle hover:text-ink p-2 rounded-pill hover:bg-surface-sunken transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* STEP 1: CART LIST */}
            {step === 'cart' && (
              <>
                {cartItems.length === 0 ? (
                  <div className="py-16 text-center text-ink-subtle space-y-3">
                    <div className="w-16 h-16 rounded-pill bg-surface-sunken mx-auto flex items-center justify-center text-ink-subtle">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <p className="text-base font-bold text-ink-muted">Your bag is empty</p>
                    <p className="text-xs text-ink-subtle">Explore products or video reels to add items!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.cartItemId} className="flex gap-4 p-4 border border-line rounded-card bg-surface shadow-subtle hover:shadow-card transition group">
                        <div className="w-20 h-20 bg-surface-sunken rounded-control overflow-hidden shrink-0">
                          <img src={item.image || item.images?.[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-black text-ink leading-tight">{item.title}</h4>
                          {item.variantName && (
                            <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-wide mt-0.5">
                              {item.variantName}
                            </p>
                          )}
                          <p className="text-xs text-accent font-black mt-0.5">₹{item.price.toLocaleString('en-IN')}</p>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => onUpdateQty(item.cartItemId, item.quantity - 1)}
                              className="w-6 h-6 rounded bg-surface-sunken hover:bg-surface-sunken flex items-center justify-center text-xs font-bold"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQty(item.cartItemId, item.quantity + 1)}
                              className="w-6 h-6 rounded bg-surface-sunken hover:bg-surface-sunken flex items-center justify-center text-xs font-bold"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.cartItemId)}
                          className="text-ink-subtle hover:text-danger p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* STEP 2: AUTH (real Sanctum login/register against Laravel) */}
            {step === 'auth' && (
              <div className="space-y-5">
                <div className="flex bg-surface-sunken rounded-card p-1">
                  <button
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    className={`flex-1 py-2 rounded-control text-xs font-bold transition ${authMode === 'login' ? 'bg-surface shadow-subtle text-ink' : 'text-ink-subtle'}`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    className={`flex-1 py-2 rounded-control text-xs font-bold transition ${authMode === 'register' ? 'bg-surface shadow-subtle text-ink' : 'text-ink-subtle'}`}
                  >
                    Create Account
                  </button>
                </div>

                {authError && (
                  <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card text-xs font-bold">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  {authMode === 'register' && (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                      <input type="text" required value={authName} onChange={e => setAuthName(e.target.value)}
                        placeholder="Full name"
                        className="w-full bg-surface-muted border border-line rounded-card pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-line-strong"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                    <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full bg-surface-muted border border-line rounded-card pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-line-strong"
                    />
                  </div>
                  {authMode === 'register' && (
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                      <input type="tel" value={authPhone} onChange={e => setAuthPhone(e.target.value)}
                        placeholder="Phone (optional)"
                        className="w-full bg-surface-muted border border-line rounded-card pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-line-strong"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                    <input type="password" required minLength={8} value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-surface-muted border border-line rounded-card pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-line-strong"
                    />
                  </div>
                  <button type="submit" disabled={authLoading}
                    className="btn-primary w-full justify-center text-sm py-3.5 disabled:opacity-50">
                    {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                  </button>
                </form>
                <p className="text-[11px] text-ink-subtle text-center">
                  Try: priya.sharma@example.com / Password@123
                </p>
              </div>
            )}

            {/* STEP 3: CHECKOUT (GPS & UPI) */}
            {step === 'checkout' && (
              <div className="space-y-5">
                {checkoutError && (
                  <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card text-xs font-bold">
                    {checkoutError}
                  </div>
                )}

                {/* GPS Address Auto-Detect */}
                <div className="bg-surface-muted p-4 rounded-card border border-line space-y-3 shadow-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-accent uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Delivery Address
                    </span>
                    <button
                      onClick={handleDetectGps}
                      disabled={isGpsLoading}
                      className="text-[11px] font-bold text-success hover:text-success bg-success-soft border border-success px-2.5 py-0.5 rounded-pill transition"
                    >
                      {isGpsLoading ? 'Locating GPS...' : '📍 Auto-detect GPS'}
                    </button>
                  </div>

                  {savedAddresses.length > 0 && (
                    <select
                      onChange={e => {
                        const a = savedAddresses.find(x => x.id === e.target.value);
                        if (a) setAddress({
                          name: a.name, phone: a.phone,
                          street: [a.line1, a.line2].filter(Boolean).join(', '),
                          city: a.city, state: a.state, pincode: a.pincode,
                        });
                      }}
                      className="w-full bg-surface border border-line rounded-control px-3 py-2 text-xs font-semibold focus:outline-none focus:border-line-strong"
                    >
                      {savedAddresses.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.tag} — {a.line1}, {a.city} {a.is_default ? '(default)' : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="text-xs text-ink-muted space-y-1">
                    <p className="font-bold text-ink">{address.name} ({address.phone})</p>
                    <p>{address.street}, {address.city}, {address.state} - {address.pincode}</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-ink-subtle uppercase mb-1" htmlFor="checkoutdrawer-f1">State</label>
                    <input id="checkoutdrawer-f1"
                      type="text"
                      value={address.state}
                      onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}
                      className="w-full bg-surface border border-line rounded-control px-3 py-2 text-xs font-semibold focus:outline-none focus:border-line-strong"
                    />
                  </div>
                </div>

                {/* Coupon */}
                <div className="bg-surface-muted p-4 rounded-card border border-line space-y-3 shadow-subtle">
                  <span className="text-xs font-extrabold text-success uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Apply Coupon
                  </span>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between gap-2 bg-success-soft border border-success rounded-control px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-black text-success text-xs">{appliedCoupon.code}</p>
                        <p className="text-[11px] text-success font-medium truncate">
                          {appliedCoupon.description} · saves {formatINR(appliedCoupon.discount)}
                        </p>
                      </div>
                      <button onClick={() => { setAppliedCoupon(null); setCouponError(''); }}
                        className="text-success hover:text-danger shrink-0">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          value={couponInput}
                          onChange={e => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                          placeholder="Enter code e.g. BHARAT15"
                          className="flex-1 bg-surface border border-line rounded-control px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-line-strong"
                        />
                        <button onClick={applyCoupon} disabled={couponBusy || !couponInput.trim()}
                          className="bg-inverse text-ink-inverse px-4 rounded-control text-xs font-bold disabled:opacity-40">
                          {couponBusy ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && <p className="text-[11px] font-bold text-danger">{couponError}</p>}
                    </>
                  )}
                </div>

                {/* Wallet */}
                {walletBalance > 0 && (
                  <label className="flex items-center justify-between gap-3 bg-surface-muted p-4 rounded-card border border-line cursor-pointer shadow-subtle">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-accent" />
                      <div>
                        <p className="text-xs font-extrabold text-ink">Use {brand.walletName}</p>
                        <p className="text-[11px] text-ink-subtle font-medium">
                          Balance {formatINR(walletBalance)}
                          {useWallet && walletApplied > 0 && ` · applying ${formatINR(walletApplied)}`}
                        </p>
                      </div>
                    </div>
                    <input type="checkbox" checked={useWallet} onChange={e => setUseWallet(e.target.checked)}
                      className="w-5 h-5 accent-primary cursor-pointer" />
                  </label>
                )}

                {/* UPI Payment Options */}
                <div className="bg-surface-muted p-4 rounded-card border border-line space-y-3 shadow-subtle">
                  <span className="text-xs font-extrabold text-accent uppercase tracking-wider flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5" /> Default Payment Method: Instant UPI
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'gpay', name: 'Google Pay', icon: '🔵' },
                      { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
                      { id: 'paytm', name: 'Paytm UPI', icon: '🔷' },
                      { id: 'bhim', name: 'BHIM QR', icon: '🟠' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3 rounded-control border text-xs font-bold flex items-center gap-2 transition ${
                          paymentMethod === m.id
                            ? 'bg-accent text-ink-inverse border-accent shadow-card'
                            : 'bg-surface border-line text-ink-muted hover:border-line'
                        }`}
                      >
                        <span>{m.icon}</span>
                        <span>{m.name}</span>
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'bhim' && (
                    <div className="bg-surface p-4 rounded-control text-center space-y-2 border border-line shadow-inner">
                      <div className="w-28 h-28 bg-surface p-2 mx-auto rounded-control shadow-card flex items-center justify-center text-ink border">
                        <QrCode className="w-24 h-24 text-ink" />
                      </div>
                      <p className="text-[11px] text-ink-subtle font-medium">Scan using any UPI App to pay ₹{grandTotal.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-ink-muted bg-surface-sunken p-3 rounded-control border border-line font-medium">
                  <Lock className="w-4 h-4 text-success shrink-0" />
                  <span>256-Bit SSL Encrypted. No manual card entry required for Indian UPI flows.</span>
                </div>
              </div>
            )}

            {/* STEP 4: ORDER SUCCESS */}
            {step === 'success' && (
              <div className="py-8 text-center space-y-4">
                <div className="w-20 h-20 rounded-pill bg-success-soft text-success border border-success mx-auto flex items-center justify-center animate-bounce shadow-card">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-ink">Payment Successful!</h3>
                  <p className="text-xs text-ink-subtle mt-1">Order Number: <span className="text-accent font-mono font-bold">{orderNumber}</span></p>
                </div>

                <div className="bg-surface-muted p-4 rounded-card text-left text-xs space-y-2 border border-line shadow-subtle">
                  <div className="flex justify-between border-b border-line pb-2">
                    <span className="text-ink-subtle">Logistics Partner</span>
                    <span className="font-bold text-success">Shiprocket Express</span>
                  </div>
                  <div className="flex justify-between border-b border-line pb-2">
                    <span className="text-ink-subtle">Estimated Delivery</span>
                    <span className="font-bold text-ink">Tomorrow, by 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-subtle">WhatsApp Updates</span>
                    <span className="font-bold text-accent">Sent to {address.phone}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClearCart();
                    setStep('cart');
                    onClose();
                  }}
                  className="btn-primary w-full justify-center"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Footer Totals & Action Buttons */}
          {(step === 'cart' || step === 'checkout') && cartItems.length > 0 && (
            <div className="p-5 border-t border-line bg-surface-muted space-y-3">
              <div className="space-y-1.5 text-xs text-ink-muted font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-ink font-bold">{formatINR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className="text-success font-bold">− {formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="text-success font-bold">{shipping === 0 ? 'FREE' : formatINR(shipping)}</span>
                </div>
                {walletApplied > 0 && (
                  <div className="flex justify-between">
                    <span>Wallet applied</span>
                    <span className="text-success font-bold">− {formatINR(walletApplied)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-ink pt-2 border-t border-line">
                  <span>Total Payable</span>
                  <span className="text-accent text-lg">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  onClick={handleProceedToCheckout}
                  className="btn-primary w-full justify-center text-sm py-3.5 shadow-card"
                >
                  <span>Proceed to 1-Click Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handlePayNow}
                  disabled={isPaying}
                  className="btn-primary w-full justify-center text-sm py-3.5 bg-gradient-to-r from-success via-success to-accent hover:from-success hover:to-accent shadow-card disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isPaying ? 'Processing...' : `Pay ${formatINR(grandTotal)} via UPI`}</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
