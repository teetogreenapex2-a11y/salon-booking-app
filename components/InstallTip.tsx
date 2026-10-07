"use client";

import { useEffect, useState } from "react";
import { Share, Plus } from "lucide-react";

const KEY = "hsx_install_dismissed";

// "Add to your home screen" nudge for customers. iPhone gets the Share
// steps (Safari has no install button); Android/Chrome gets a real
// one-tap install. Hidden once installed or dismissed.
export default function InstallTip({ businessName }: { businessName: string }) {
  const [mode, setMode] = useState<"none" | "ios" | "prompt">("none");
  const [deferred, setDeferred] = useState<any>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {}
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    if (isIos) {
      setMode("ios");
      return;
    }
    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e);
      setMode("prompt");
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setMode("none");
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => null);
    dismiss();
  }

  if (mode === "none") return null;

  return (
    <div
      className="card static"
      style={{ flexDirection: "column", alignItems: "stretch", gap: 8, marginTop: 20 }}
    >
      <p className="name" style={{ margin: 0 }}>Keep {businessName} on your phone</p>
      {mode === "ios" ? (
        <p className="subtle" style={{ margin: 0 }}>
          Tap <Share size={14} style={{ verticalAlign: "-2px" }} /> <strong>Share</strong> in Safari, then{" "}
          <Plus size={14} style={{ verticalAlign: "-2px" }} /> <strong>Add to Home Screen</strong> — next time you can book in one tap.
        </p>
      ) : (
        <p className="subtle" style={{ margin: 0 }}>
          Add it to your home screen to book or rebook in one tap.
        </p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {mode === "prompt" && (
          <button className="btn-primary" style={{ padding: "8px 14px", fontSize: 13 }} onClick={install}>
            Add to home screen
          </button>
        )}
        <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }} onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
