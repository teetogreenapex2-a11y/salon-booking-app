"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, Check } from "lucide-react";

// Always-visible "your booking link" card: copy it for a Google profile or
// Instagram bio, and download a QR code for the front desk or a flyer.
export default function ShareLinkCard({ link, name }: { link: string; name: string }) {
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(link, { width: 640, margin: 2, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => setQr(""));
  }, [link]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your booking link:", link);
    }
  }

  return (
    <div className="card static" style={{ gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 28 }}>
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt={`QR code for ${name}`} width={112} height={112} style={{ borderRadius: 8, background: "#fff" }} />
      )}
      <div style={{ flex: 1, minWidth: 200 }}>
        <p className="name" style={{ margin: 0 }}>Your booking link</p>
        <p className="subtle" style={{ margin: "2px 0 10px", wordBreak: "break-all" }}>{link.replace("https://", "")}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-primary" style={{ padding: "8px 14px", fontSize: 13 }} onClick={copy}>
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}
          </button>
          {qr && (
            <a
              className="btn-ghost"
              style={{ padding: "8px 14px", fontSize: 13, textDecoration: "none" }}
              href={qr}
              download={`${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-booking-qr.png`}
            >
              <Download size={14} /> Download QR code
            </a>
          )}
        </div>
        <p className="subtle" style={{ margin: "10px 0 0", fontSize: 12 }}>
          Put the link on your Google Business Profile and Instagram. Print the QR code for your front desk.
        </p>
      </div>
    </div>
  );
}
