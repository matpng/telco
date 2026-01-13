"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

export default function InvoicesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setRows(await apiGet("/invoices"));
  }

  useEffect(() => { load().catch(console.error); }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Period</th>
              <th>Issue</th>
              <th>Due</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}</td>
                <td>{new Date(r.issueDate).toLocaleDateString()}</td>
                <td>{new Date(r.dueDate).toLocaleDateString()}</td>
                <td>PGK {Number(r.totalAmount).toFixed(2)}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        Statements are generated automatically on the 1st of each month and emailed to the billing email address.
      </div>
    </div>
  );
}
