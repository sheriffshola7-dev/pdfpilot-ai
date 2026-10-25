"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ArrowLeft, ShieldCheck, Users, FileText, Bookmark, Activity, RefreshCw, LockKeyhole } from "lucide-react";

type Overview = {
  metrics: { totalUsers: number; usersReturned: number; usersMayBeTruncated: boolean; totalDocuments: number; totalSavedInsights: number; totalActivityEvents: number };
  users: { id: string; email: string; createdAt: string; lastSignInAt: string | null; emailConfirmed: boolean }[];
};

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [message, setMessage] = useState("Checking administrator access…");
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Supabase is not configured. Add the public Supabase environment variables and redeploy."); setBusy(false); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setMessage("Sign in to PDFPilot AI first, then open the admin panel."); setBusy(false); return; }
    try {
      const response = await fetch("/api/admin/overview", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
      const body = await response.json();
      if (!response.ok) { setOverview(null); setMessage(body.error || "Unable to load admin panel."); }
      else { setOverview(body); setMessage(""); }
    } catch { setMessage("Could not reach the admin service. Please try again."); }
    finally { setBusy(false); }
  }

  useEffect(() => { void load(); }, []);

  const cards = overview ? [
    { label: "Registered users", value: overview.metrics.totalUsers, icon: Users },
    { label: "Documents analyzed", value: overview.metrics.totalDocuments, icon: FileText },
    { label: "Saved insights", value: overview.metrics.totalSavedInsights, icon: Bookmark },
    { label: "Activity events", value: overview.metrics.totalActivityEvents, icon: Activity },
  ] : [];

  return <main className="admin-page">
    <header className="admin-header">
      <Link href="/" className="admin-back"><ArrowLeft size={17}/> Back to workspace</Link>
      <div className="admin-brand"><span><ShieldCheck size={21}/></span><div><strong>PDFPilot AI</strong><small>SHORLAH CLOUD · ADMINISTRATION</small></div></div>
      <button className="admin-refresh" onClick={() => void load()} disabled={busy}><RefreshCw size={16} className={busy ? "admin-spin" : ""}/> Refresh</button>
    </header>
    <section className="admin-content">
      <div className="admin-title"><div><p className="admin-eyebrow">CONTROL CENTER</p><h1>Admin panel</h1><p>Platform health, registered accounts, and usage overview.</p></div><span className="admin-secure"><LockKeyhole size={15}/> Protected endpoint</span></div>
      {message && <div className="admin-message"><ShieldCheck size={20}/><div><strong>Admin setup / access</strong><p>{message}</p>{message.includes("not configured") && <p>Required server-only Netlify variables: <code>ADMIN_EMAILS</code> (your exact account email) and <code>SUPABASE_SERVICE_ROLE_KEY</code> (Supabase secret key). Never put the service-role key in a NEXT_PUBLIC variable.</p>}</div></div>}
      {overview && <>
        <div className="admin-metrics">{cards.map(({label,value,icon:Icon})=><article className="admin-metric" key={label}><span><Icon size={19}/></span><p>{label}</p><strong>{value.toLocaleString()}</strong></article>)}</div>
        {overview.metrics.usersMayBeTruncated && <p className="admin-note">Showing the first 100 accounts. A paginated user directory can be added as the platform grows.</p>}
        <section className="admin-table-card"><div className="admin-table-heading"><div><h2>Registered accounts</h2><p>Email confirmation and recent sign-in status</p></div><span>{overview.users.length} shown</span></div>
          <div className="admin-table-wrap"><table><thead><tr><th>Email</th><th>Joined</th><th>Last sign-in</th><th>Verification</th></tr></thead><tbody>{overview.users.map(user=><tr key={user.id}><td>{user.email || "—"}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td>{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : "Never"}</td><td><span className={user.emailConfirmed ? "admin-badge admin-badge-ok" : "admin-badge admin-badge-pending"}>{user.emailConfirmed ? "Verified" : "Pending"}</span></td></tr>)}</tbody></table></div>
        </section>
        <p className="admin-privacy">Privacy note: this overview shows account metadata and aggregate counts, not document contents. Access is checked on the server against the ADMIN_EMAILS allowlist.</p>
      </>}
    </section>
  </main>;
}
