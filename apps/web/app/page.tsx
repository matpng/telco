"use client";

import { useEffect, useState } from "react";
import { apiGet } from "./lib/api";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiGet("/dashboard/summary").then(setData).catch((e) => setErr(e.message || String(e)));
  }, []);

  if (err) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-sm text-red-700">{err}</p>
        <p className="mt-2 text-sm">If not logged in, go to <a className="underline" href="/login">/login</a>.</p>
      </div>
    );
  }

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total spend (this month)" value={`PGK ${Number(data.totalSpend || 0).toFixed(2)}`} />
        <Card title="Employees" value={String(data.employees || 0)} />
        <Card title="Network split" value={Object.entries(data.byNetwork || {}).map(([k,v]:any)=>`${k}:${Number(v).toFixed(2)}`).join(" | ") || "—"} />
      </div>
      <div className="mt-8 text-sm text-gray-600">
        Period: {new Date(data.periodStart).toLocaleDateString()} – {new Date(data.periodEnd).toLocaleDateString()}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}
