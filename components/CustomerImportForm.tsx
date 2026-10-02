"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = { name: string; email: string; phone: string };

function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  function parseLine(line: string): string[] {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  }

  const header = parseLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = header.findIndex((h) => h.includes("name"));
  const emailIdx = header.findIndex((h) => h.includes("email"));
  const phoneIdx = header.findIndex((h) => h.includes("phone"));

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const name = nameIdx >= 0 ? cells[nameIdx] ?? "" : "";
    const email = emailIdx >= 0 ? cells[emailIdx] ?? "" : "";
    const phone = phoneIdx >= 0 ? cells[phoneIdx] ?? "" : "";
    if (email) {
      rows.push({ name: name || email.split("@")[0], email, phone });
    }
  }
  return rows;
}

export default function CustomerImportForm() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError("No rows with an email column were found in that file.");
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Import failed");
      }
      const data = await res.json();
      setResult(data);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <p className="subtle" style={{ fontSize: 13.5, marginBottom: 14 }}>
          Upload a CSV file with columns for <strong>name</strong>, <strong>email</strong>, and{" "}
          <strong>phone</strong> (email is required — it's how we match existing customers). The first row
          should be the column headers.
        </p>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} />
      </div>

      {fileName && rows.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <p style={{ fontWeight: 600, marginBottom: 10 }}>
            {fileName} — {rows.length} customer{rows.length === 1 ? "" : "s"} found
          </p>
          <div style={{ maxHeight: 220, overflowY: "auto", fontSize: 13.5 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                  <th style={{ padding: "6px 8px" }}>Name</th>
                  <th style={{ padding: "6px 8px" }}>Email</th>
                  <th style={{ padding: "6px 8px" }}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "6px 8px" }}>{r.name}</td>
                    <td style={{ padding: "6px 8px" }}>{r.email}</td>
                    <td style={{ padding: "6px 8px" }}>{r.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <p className="subtle" style={{ marginTop: 8 }}>
                …and {rows.length - 50} more.
              </p>
            )}
          </div>
          <button className="btn-primary" onClick={handleImport} disabled={importing} style={{ marginTop: 16 }}>
            {importing ? "Importing…" : `Import ${rows.length} customers`}
          </button>
        </div>
      )}

      {error && <p style={{ color: "#b3261e" }}>{error}</p>}

      {result && (
        <div className="card" style={{ padding: 20, background: "#e3f1e6" }}>
          <p style={{ fontWeight: 600, color: "#2e7d4f", marginBottom: 4 }}>Import complete</p>
          <p style={{ fontSize: 14 }}>
            {result.created} new customer{result.created === 1 ? "" : "s"} added, {result.updated} existing
            customer{result.updated === 1 ? "" : "s"} updated
            {result.skipped > 0 ? `, ${result.skipped} skipped (missing email)` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}
