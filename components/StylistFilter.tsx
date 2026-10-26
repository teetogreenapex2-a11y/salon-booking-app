"use client";

import { useRouter } from "next/navigation";

type Stylist = { id: string; name: string };

export default function StylistFilter({
  stylists,
  selected,
  date,
  view = "day",
}: {
  stylists: Stylist[];
  selected: string;
  date: string;
  view?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selected}
      onChange={(e) => {
        const params = new URLSearchParams();
        params.set("date", date);
        if (view !== "day") params.set("view", view);
        if (e.target.value !== "all") {
          params.set("stylist", e.target.value);
        }
        router.push(`/admin/calendar?${params.toString()}`);
      }}
      style={{
        padding: "10px 14px",
        border: "1px solid rgba(36, 28, 31, 0.15)",
        borderRadius: 4,
        fontSize: 14,
        fontFamily: "inherit",
        background: "var(--panel)",
      }}
    >
      {view !== "week" && <option value="all">All stylists</option>}
      {stylists.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
