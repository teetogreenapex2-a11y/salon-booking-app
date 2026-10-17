"use client";

export default function PrintButton() {
  return (
    <button className="btn-primary" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => window.print()}>
      Print
    </button>
  );
}
