"use client";

import { useEffect, useRef, useState } from "react";

// Camera scanner for barcodes and QR codes, plus a text box for handheld
// (USB / Bluetooth) scanners — those type the code and press Enter.
export default function BarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (code: string) => void;
  onClose?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const last = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");

  useEffect(() => {
    let controls: { stop: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const c = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (!result) return;
          const code = result.getText();
          const now = Date.now();
          // The camera sees the same label many times a second — ignore repeats.
          if (code === last.current.code && now - last.current.at < 2500) return;
          last.current = { code, at: now };
          try {
            navigator.vibrate?.(60);
          } catch {}
          onScanRef.current(code);
        });
        if (cancelled) c.stop();
        else controls = c;
      } catch {
        setError("Camera isn't available. Allow camera access in your browser, or type the code below.");
      }
    })();
    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, []);

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const code = manual.trim();
    if (!code) return;
    onScanRef.current(code);
    setManual("");
  }

  return (
    <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 10, padding: 12 }}>
      {error ? (
        <p className="subtle" style={{ color: "#b3261e", margin: 0 }}>{error}</p>
      ) : (
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 8, background: "#000" }}
        />
      )}
      <form onSubmit={submitManual} style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Or type / scan with a handheld scanner, then Enter"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
          autoComplete="off"
        />
        <button className="btn-ghost" type="submit" style={{ padding: "6px 12px", fontSize: 12 }}>
          Add
        </button>
      </form>
      {onClose && (
        <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12, alignSelf: "flex-start" }} onClick={onClose}>
          Close scanner
        </button>
      )}
    </div>
  );
}
