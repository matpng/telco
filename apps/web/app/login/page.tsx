"use client";

import { useState } from "react";
import { apiPost } from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("acme.admin@telcocredit.local");
  const [password, setPassword] = useState("Admin123!");
  const [msg, setMsg] = useState("");

  async function onLogin() {
    setMsg("");
    try {
      const r = await apiPost("/auth/login", { email, password });
      localStorage.setItem("token", r.token);
      window.location.href = "/";
    } catch (e: any) {
      setMsg(e.message || String(e));
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-sm text-gray-600 mt-1">Starter auth. Replace with Keycloak/Auth247 for production.</p>
      <div className="mt-6 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Email</span>
          <input className="border rounded-lg p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Password</span>
          <input className="border rounded-lg p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="rounded-lg bg-black text-white p-2" onClick={onLogin}>Login</button>
        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </div>
    </div>
  );
}
