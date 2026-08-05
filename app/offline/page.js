export const metadata = { title: "You're offline | BazaarX" };

export default function OfflinePage() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="w-16 h-16 rounded-pill bg-surface-sunken mx-auto flex items-center justify-center mb-5">
        <span className="text-3xl" role="img" aria-label="No connection">📡</span>
      </div>
      <h1 className="text-2xl font-black text-ink">You&apos;re offline</h1>
      <p className="text-ink-subtle mt-2 font-medium">
        Pages you&apos;ve already visited are still available. Reconnect to browse the full catalogue,
        place orders or check delivery status.
      </p>
    </div>
  );
}
