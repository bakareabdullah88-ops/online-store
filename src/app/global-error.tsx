"use client";

import "./globals.css";

/** Last-resort boundary (root layout failed). Self-contained: no providers. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-NG">
      <body className="flex min-h-dvh items-center justify-center bg-canvas p-6 text-ink">
        <main className="max-w-md text-center">
          <p className="font-mono text-xs tracking-widest text-muted uppercase">Kiosk</p>
          <h1 className="mt-4 text-3xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-muted">
            Please try again. Your bag and orders are stored on this device and are safe.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 h-11 rounded-md bg-primary px-5 font-medium text-on-primary"
          >
            Reload Kiosk
          </button>
        </main>
      </body>
    </html>
  );
}
