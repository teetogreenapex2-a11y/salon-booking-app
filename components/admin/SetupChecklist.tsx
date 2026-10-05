"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SetupStep } from "@/lib/setup";

// A friendly "here's what to do next" card. Steps arrive already marked
// done/not-done from the server. "Hide for now" is remembered on this
// device only — it comes back on its own if the browser forgets it.
export default function SetupChecklist({
  storageKey,
  title,
  steps,
  bookingLink,
}: {
  storageKey: string;
  title: string;
  steps: SetupStep[];
  bookingLink?: string;
}) {
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey) === "hidden") setHidden(true);
    } catch {
      // Storage blocked — just keep showing the card.
    }
  }, [storageKey]);

  const required = steps.filter((s) => !s.optional);
  const optional = steps.filter((s) => s.optional && !s.done);
  const doneCount = required.filter((s) => s.done).length;
  const allDone = doneCount === required.length;
  const nextKey = required.find((s) => !s.done)?.key;

  // Once the main steps are finished the card goes away on its own —
  // unless there are still optional suggestions worth showing.
  if (hidden || (allDone && optional.length === 0)) return null;

  function hide() {
    setHidden(true);
    try {
      window.localStorage.setItem(storageKey, "hidden");
    } catch {
      // Not remembered, but hidden for this visit.
    }
  }

  async function copyLink() {
    if (!bookingLink) return;
    try {
      await navigator.clipboard.writeText(bookingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your booking link:", bookingLink);
    }
  }

  const pct = required.length ? Math.round((doneCount / required.length) * 100) : 100;

  return (
    <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 12, marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <p className="display" style={{ fontSize: 20, margin: 0 }}>
            {allDone ? "You're all set — a few extras" : title}
          </p>
          {!allDone && (
            <p className="subtle" style={{ margin: "2px 0 0", fontSize: 13 }}>
              {doneCount} of {required.length} done
            </p>
          )}
        </div>
        <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12, whiteSpace: "nowrap" }} onClick={hide}>
          Hide for now
        </button>
      </div>

      {!allDone && (
        <div style={{ height: 6, borderRadius: 3, background: "rgba(36,28,31,0.1)", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--berry)" }} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {[...required, ...optional].map((s, i) => {
          const isNext = s.key === nextKey;
          return (
            <div
              key={s.key}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: "12px 0",
                borderTop: i === 0 ? "none" : "1px solid rgba(36,28,31,0.08)",
                opacity: s.done ? 0.55 : 1,
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: "none",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: s.done ? "#fff" : "var(--berry)",
                  background: s.done ? "var(--berry)" : "transparent",
                  border: "2px solid var(--berry)",
                }}
              >
                {s.done ? "✓" : ""}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="name" style={{ margin: 0 }}>
                  {s.title}
                  {s.optional && <span className="subtle" style={{ fontWeight: 400 }}> (optional)</span>}
                </p>
                {!s.done && (
                  <p className="subtle" style={{ margin: "2px 0 8px", fontSize: 13 }}>
                    {s.description}
                  </p>
                )}
                {!s.done && s.key === "share" && bookingLink && (
                  <p style={{ margin: "0 0 8px", fontSize: 13, wordBreak: "break-all" }}>
                    <strong>{bookingLink.replace(/^https?:\/\//, "")}</strong>
                  </p>
                )}
                {!s.done && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {s.key === "share" && bookingLink ? (
                      <button
                        className={isNext ? "btn-primary" : "btn-ghost"}
                        style={{ padding: "6px 14px", fontSize: 13 }}
                        onClick={copyLink}
                      >
                        {copied ? "Copied!" : "Copy my link"}
                      </button>
                    ) : (
                      <Link
                        href={s.href}
                        className={isNext ? "btn-primary" : "btn-ghost"}
                        style={{ padding: "6px 14px", fontSize: 13 }}
                      >
                        {s.cta}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
