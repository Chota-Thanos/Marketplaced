'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Volume2, Sparkles, ArrowRight } from 'lucide-react';

// BCP-47 tags the Web Speech API expects for each offered language.
const SPEECH_LOCALES = {
  Hinglish: 'en-IN',
  Hindi: 'hi-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
};

export default function VernacularVoiceModal({ isOpen, onClose, onSelectQuery }) {
  const [listening, setListening] = useState(false);
  const [activeLang, setActiveLang] = useState('Hinglish');
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const [micError, setMicError] = useState('');
  const recognitionRef = useRef(null);

  const sampleQueries = {
    Hinglish: [
      "Kala running shoes dikhao",
      "Festive silk saree set under 4000",
      "Wireless ANC headphones heavy bass"
    ],
    Hindi: [
      "काला रनिंग शूज़ दिखाओ",
      "त्योहार के लिए रेशमी सूट दिखाओ",
      "वायरलेस हेडफ़ोन सबसे अच्छा डिस्काउंट"
    ],
    Tamil: [
      "கருப்பு ஓடும் காலணிகள் காண்பி",
      "பட்டு புடவை சிறந்த விலை"
    ],
    Telugu: [
      "నల్లటి రన్నింగ్ షూస్ చూపించు",
      "పట్టు చీరలు తక్కువ ధరలో"
    ]
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(Boolean(SR));
  }, []);

  // Stop the mic if the modal closes mid-recognition.
  useEffect(() => {
    if (!isOpen && recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setListening(false);
    }
  }, [isOpen]);

  const submitQuery = (query) => {
    setTranscript(`"${query}"`);
    setListening(false);
    onSelectQuery(query);
    onClose();
  };

  /** Real speech-to-text via the Web Speech API. */
  const handleStartListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    setMicError('');
    setTranscript('Listening…');
    setListening(true);

    const recognition = new SR();
    recognition.lang = SPEECH_LOCALES[activeLang] || 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const result = Array.from(event.results)
        .map(r => r[0].transcript)
        .join(' ')
        .trim();

      setTranscript(result);
      // Only dispatch once the engine marks the phrase final.
      if (event.results[event.results.length - 1].isFinal && result) {
        submitQuery(result);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      setTranscript('');
      setMicError(
        event.error === 'not-allowed'
          ? 'Microphone permission was denied. Enable it in your browser to use voice search.'
          : event.error === 'no-speech'
            ? "Didn't catch that — try again."
            : `Voice search failed (${event.error}).`
      );
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-surface border border-line rounded-panel p-6 sm:p-8 text-ink shadow-panel overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-subtle hover:text-ink p-2 rounded-pill bg-surface-sunken hover:bg-surface-sunken transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Vernacular Tabs */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-warning-soft border border-warning text-warning text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Vernacular Voice Search
          </div>
          <h3 className="text-xl font-black text-ink">Speak in Your Native Language</h3>
          <p className="text-xs text-ink-subtle font-medium mt-1">Supports Hindi, Tamil, Telugu & Hinglish voice recognition</p>

          {/* Language Pills */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {Object.keys(sampleQueries).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3.5 py-1 rounded-pill text-xs font-bold transition ${
                  activeLang === lang
                    ? 'bg-warning text-ink-inverse shadow-card'
                    : 'bg-surface-sunken text-ink-muted hover:bg-surface-sunken'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Central Pulse Microphone Button */}
        <div className="flex flex-col items-center justify-center my-6">
          <button
            onClick={() => (listening ? stopListening() : handleStartListening())}
            disabled={!supported}
            aria-label={listening ? 'Stop listening' : 'Start voice search'}
            className={`relative w-24 h-24 rounded-pill flex items-center justify-center transition transform active:scale-95 disabled:opacity-40 ${
              listening
                ? 'bg-gradient-to-tr from-warning via-danger to-accent shadow-panel shadow-warning/50'
                : 'bg-gradient-to-tr from-warning to-danger hover:scale-105 shadow-hover'
            }`}
          >
            {listening && (
              <div className="absolute inset-0 rounded-pill border-4 border-warning/50 animate-voice-wave" />
            )}
            <Mic className={`w-10 h-10 text-ink-inverse ${listening ? 'animate-bounce' : ''}`} />
          </button>

          <p role="status" className="text-sm font-bold text-ink-muted mt-4 min-h-6 text-center">
            {transcript || (supported ? 'Tap mic to speak' : '')}
          </p>

          {!supported && (
            <p className="text-xs font-bold text-warning bg-warning-soft border border-warning rounded-control px-3 py-2 mt-2 text-center">
              This browser doesn&apos;t support speech recognition. Use a sample prompt below, or try Chrome or Edge.
            </p>
          )}
          {micError && (
            <p role="alert" className="text-xs font-bold text-danger mt-2 text-center">{micError}</p>
          )}
        </div>

        {/* Preset Sample Prompts */}
        <div className="mt-4 pt-4 border-t border-line">
          <p className="text-xs font-bold text-ink-subtle uppercase tracking-wider mb-2.5 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-accent" /> Or tap a sample prompt:
          </p>
          <div className="space-y-2">
            {sampleQueries[activeLang].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => submitQuery(prompt)}
                className="w-full text-left px-4 py-2.5 rounded-control bg-surface-muted hover:bg-warning-soft border border-line hover:border-warning text-xs font-bold text-ink hover:text-warning flex items-center justify-between transition group"
              >
                <span>"{prompt}"</span>
                <ArrowRight className="w-3.5 h-3.5 text-ink-subtle group-hover:text-warning transition" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
