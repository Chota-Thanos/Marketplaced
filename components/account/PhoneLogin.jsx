"use client";

import { useState } from 'react';

export function PhoneLogin({ onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    // In a real app: await fetch('/api/v1/auth/otp/send', ...)
    // Mocking the success here
    if (phone.length === 10) {
      setStep('otp');
    } else {
      setError('Please enter a valid 10-digit phone number.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    // In a real app: await fetch('/api/v1/auth/otp/verify', ...)
    if (otp.length === 6) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError('Please enter a valid 6-digit OTP.');
    }
  };

  return (
    <div className="bg-inverse border border-line-strong p-6 rounded-control w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-ink-inverse mb-4">
        {step === 'phone' ? 'Login with Phone' : 'Enter OTP'}
      </h2>
      
      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm text-ink-subtle mb-1" htmlFor="phonelogin-f1">Phone Number</label>
            <div className="flex">
              <span className="bg-inverse border border-line-strong border-r-0 rounded-l-control px-3 py-2 text-ink-subtle">+91</span>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                className="flex-1 bg-inverse border border-line-strong rounded-r-control px-4 py-2 text-ink-inverse focus:outline-none focus:border-accent"
                placeholder="9876543210"
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-accent text-ink-inverse font-medium py-2 rounded-control hover:bg-accent transition-colors">
            Send OTP
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label htmlFor="phonelogin-f1" className="block text-sm text-ink-subtle mb-1">6-Digit OTP</label>
            <input id="phonelogin-f1" 
              type="text" 
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full bg-inverse border border-line-strong rounded-control px-4 py-2 text-ink-inverse focus:outline-none focus:border-accent tracking-[1em] text-center"
              placeholder="••••••"
              required
            />
            <p className="text-xs text-ink-subtle mt-2">Check your logs/SMS for the mock OTP.</p>
          </div>
          <button type="submit" className="w-full bg-accent text-ink-inverse font-medium py-2 rounded-control hover:bg-accent transition-colors">
            Verify & Login
          </button>
          <button type="button" onClick={() => setStep('phone')} className="w-full text-ink-subtle text-sm hover:text-ink-inverse mt-2">
            Change phone number
          </button>
        </form>
      )}
    </div>
  );
}
