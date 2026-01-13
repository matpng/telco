"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../lib/api";

export default function EmployeesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [department, setDepartment] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    setRows(await apiGet("/employees"));
  }

  useEffect(() => { load().catch(console.error); }, []);

  async function add() {
    setMsg("");
    try {
      await apiPost("/employees", { fullName, msisdn, department });
      setFullName(""); setMsisdn(""); setDepartment("");
      await load();
      setMsg("Employee added.");
    } catch (e: any) {
      setMsg(e.message || String(e));
    }
  }

  async function toggle(id: string, status: string) {
    await apiPatch(`/employees/${id}`, { status: status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" });
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Employees</h1>

      <div className="mt-6 rounded-xl border p-4">
        <div className="font-medium">Add employee</div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <input className="border rounded-lg p-2" placeholder="Full name" value={fullName} onChange={(e)=>setFullName(e.target.value)} />
          <input className="border rounded-lg p-2" placeholder="MSISDN e.g. +67570123456" value={msisdn} onChange={(e)=>setMsisdn(e.target.value)} />
          <input className="border rounded-lg p-2" placeholder="Department" value={department} onChange={(e)=>setDepartment(e.target.value)} />
        </div>
        <button className="mt-3 rounded-lg bg-black text-white px-3 py-2" onClick={add}>Add</button>
        {msg ? <div className="mt-2 text-sm text-gray-700">{msg}</div> : null}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Name</th>
              <th>MSISDN</th>
              <th>Department</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.fullName}</td>
                <td>{r.msisdn}</td>
                <td>{r.department || "—"}</td>
                <td>{r.status}</td>
                <td className="text-right">
                  <button className="underline" onClick={()=>toggle(r.id, r.status)}>
                    {r.status === "ACTIVE" ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        Employees request credit via SMS: <code>TOPUP 5</code>, <code>BAL</code>, <code>HISTORY</code>, <code>HELP</code>
      </div>
    </div>
  );
}
