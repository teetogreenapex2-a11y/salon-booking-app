"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { visibleQuestions } from "@/lib/setupQuestions";

// One question at a time, tap an answer to move on. Skippable at any
// point; either way the checklist underneath is built from the answers.
export default function SetupQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Which questions apply can change as answers come in (the commission
  // question only appears for owners who sell products).
  const questions = visibleQuestions(answers);
  const q = questions[step];

  async function save(body: object) {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/setup-answers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      setError("Couldn't save that — try again.");
    }
  }

  function choose(value: string) {
    const next = { ...answers, [q.key]: value };
    setAnswers(next);
    const nextQuestions = visibleQuestions(next);
    if (step < nextQuestions.length - 1) {
      setStep(step + 1);
    } else {
      // Drop answers to questions that no longer apply (e.g. if they went
      // back and changed an earlier answer).
      const keep = new Set(nextQuestions.map((x) => x.key as string));
      save(Object.fromEntries(Object.entries(next).filter(([k]) => keep.has(k))));
    }
  }

  return (
    <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 14, marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <p className="subtle" style={{ margin: 0, fontSize: 13 }}>
          Quick setup · question {step + 1} of {questions.length}
        </p>
        <button
          className="btn-ghost"
          style={{ padding: "4px 10px", fontSize: 12 }}
          onClick={() => save({ skip: true })}
          disabled={saving}
        >
          Skip for now
        </button>
      </div>

      <div style={{ height: 6, borderRadius: 3, background: "rgba(36,28,31,0.1)", overflow: "hidden" }}>
        <div style={{ width: `${((step + 1) / questions.length) * 100}%`, height: "100%", background: "var(--berry)" }} />
      </div>

      <p className="display" style={{ fontSize: 22, margin: 0 }}>{q.prompt}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.options.map((o) => (
          <button
            key={o.value}
            className={`card ${answers[q.key] === o.value ? "selected" : ""}`}
            style={{ textAlign: "left", padding: "12px 14px" }}
            onClick={() => choose(o.value)}
            disabled={saving}
          >
            <span className="name">{o.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {step > 0 && (
          <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setStep(step - 1)} disabled={saving}>
            Back
          </button>
        )}
        {saving && <span className="subtle" style={{ fontSize: 12 }}>Saving…</span>}
        {error && <span style={{ color: "#b00020", fontSize: 12 }}>{error}</span>}
      </div>
    </div>
  );
}
