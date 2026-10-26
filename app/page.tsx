"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpenText,
  Check, ChevronDown, CircleHelp, Clock3, FileCheck2, FileSearch, FileText,
  Files, FolderOpen, LayoutDashboard, Menu, MessageSquareText, Plus, Search,
  Settings2, ShieldCheck, Sparkles, UploadCloud, X, Zap, Moon, Sun
} from "lucide-react";

type ToolKey = "Analyze PDF" | "Compare documents" | "Chat with PDF";
const tools: { title: ToolKey; description: string; icon: typeof FileSearch; tone: string }[] = [
  { title: "Analyze PDF", description: "Get clear summaries, insights, and key takeaways.", icon: FileSearch, tone: "green" },
  { title: "Compare documents", description: "Compare two PDFs and review key differences.", icon: Files, tone: "purple" },
  { title: "Chat with PDF", description: "Ask questions and get answers grounded in your files.", icon: MessageSquareText, tone: "orange" },
];

export default function Home() {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [active, setActive] = useState("Overview");
  const [workspaceRestored, setWorkspaceRestored] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem("pdfpilot-theme"); } catch { /* Storage may be disabled by the browser. */ }
    const preferred = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial = saved === "dark" || saved === "light" ? saved : preferred ? "dark" : "light";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);
  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem("pdfpilot-theme", nextTheme);
    } catch {
      setNotice("Theme changed for this session, but your browser could not save the preference.");
    }
  }
  const [tool, setTool] = useState<ToolKey | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [query, setQuery] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [history, setHistory] = useState<Record<string, any>[]>([]);
  const [savedInsights, setSavedInsights] = useState<Record<string, any>[]>([]);
  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) { setUser(data.session?.user ?? null); setAuthReady(true); }
    }).catch(() => { if (mounted) setAuthReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [supabase]);
  useEffect(() => {
    try {
      const savedWorkspace = JSON.parse(localStorage.getItem("pdfpilot-workspace") || "null");
      if (savedWorkspace && typeof savedWorkspace === "object") {
        if (typeof savedWorkspace.active === "string") setActive(savedWorkspace.active);
        if (["Analyze PDF", "Compare documents", "Chat with PDF"].includes(savedWorkspace.tool)) setTool(savedWorkspace.tool as ToolKey);
        if (savedWorkspace.result && typeof savedWorkspace.result === "object") setResult(savedWorkspace.result);
        if (typeof savedWorkspace.query === "string") setQuery(savedWorkspace.query);
        if (typeof savedWorkspace.chatQuestion === "string") setChatQuestion(savedWorkspace.chatQuestion);
        if (savedWorkspace.tool && !savedWorkspace.result) setNotice("Your previous workspace was restored. For privacy, choose the PDF again because uploaded files are not kept after refresh.");
      }
    } catch { /* Ignore unavailable or malformed workspace state. */ }
    setWorkspaceRestored(true);
  }, []);
  useEffect(() => {
    if (!workspaceRestored) return;
    try { localStorage.setItem("pdfpilot-workspace", JSON.stringify({ active, tool, result, query, chatQuestion })); }
    catch { /* Workspace remains usable this session if storage is unavailable. */ }
  }, [workspaceRestored, active, tool, result, query, chatQuestion]);
  useEffect(() => {
    try {
      const storedHistory = JSON.parse(localStorage.getItem("pdfpilot-history") || "[]");
      const storedInsights = JSON.parse(localStorage.getItem("pdfpilot-insights") || "[]");
      setHistory(Array.isArray(storedHistory) ? storedHistory : []);
      setSavedInsights(Array.isArray(storedInsights) ? storedInsights : []);
    } catch { setHistory([]); setSavedInsights([]); }
  }, []);
  useEffect(() => {
    if (!supabase || !user) return;
    let cancelled = false;
    setHistory([]);
    setSavedInsights([]);
    (async () => {
      const [docs, insights] = await Promise.all([
        supabase.from("documents").select("id,file_name,page_count,character_count,analysis_type,result,created_at").order("created_at", { ascending: false }).limit(30),
        supabase.from("saved_insights").select("id,title,insight_type,content,source_file_name,created_at").order("created_at", { ascending: false }).limit(50),
      ]);
      if (cancelled) return;
      if (!docs.error && docs.data) {
        const rows = docs.data.map(row => ({ id: row.id, tool: row.analysis_type === "compare" ? "Compare documents" : row.analysis_type === "chat" ? "Chat with PDF" : "Analyze PDF", title: row.file_name, createdAt: row.created_at, result: row.result }));
        setHistory(rows); persistLocal("pdfpilot-history", rows);
      } else if (docs.error) setNotice("Cloud document history could not be loaded. Please check database access.");
      if (!insights.error && insights.data) {
        const rows = insights.data.map(row => ({ id: row.id, tool: row.insight_type, title: row.title, createdAt: row.created_at, summary: Array.isArray(row.content?.summary) ? row.content.summary : [] }));
        setSavedInsights(rows); persistLocal("pdfpilot-insights", rows);
      } else if (insights.error) setNotice("Cloud saved insights could not be loaded. Please check database access.");
    })().catch(() => { if (!cancelled) setNotice("Could not load your cloud workspace. Please refresh and try again."); });
    return () => { cancelled = true; };
  }, [supabase, user?.id]);
  function persistLocal(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { setNotice("Browser storage is full or unavailable. This result is still visible, but may not be saved after you leave this page."); return false; }
  }
  function saveResultToHistory(data: Record<string, any>, toolName: ToolKey) {
    const title = data.document?.name || data.documents?.map((d: {name:string})=>d.name).join(" ↔ ") || toolName;
    const entry = { id: `${Date.now()}-${"wm3kri"}`, tool: toolName, title, createdAt: new Date().toISOString(), result: data };
    setHistory(old => { const next=[entry,...old].slice(0,30); persistLocal("pdfpilot-history", next); return next; });
    if (supabase && user) {
      void supabase.from("documents").insert({
        user_id: user.id, file_name: title, page_count: Number(data.document?.pages || 0),
        character_count: Number(data.characterCount || 0),
        analysis_type: toolName === "Compare documents" ? "compare" : toolName === "Chat with PDF" ? "chat" : "analyze",
        result: data,
      }).select("id,file_name,analysis_type,result,created_at").single().then(({ data: row, error }) => {
        if (error) { setNotice("Result is visible locally, but cloud history could not be saved."); return; }
        if (row) {
          const cloudEntry = { id: row.id, tool: toolName, title: row.file_name, createdAt: row.created_at, result: row.result };
          setHistory(old => { const next=[cloudEntry,...old.filter(item => item.id !== entry.id)].slice(0,30); persistLocal("pdfpilot-history", next); return next; });
        }
      });
    }
  }
  function saveInsight() {
    if (!result) return;
    const title = result.document?.name || result.documents?.map((d:{name:string})=>d.name).join(" ↔ ") || "Saved insight";
    const summary = result.summary?.slice(0,3) || (result.answer ? [result.answer] : result.keyDifferences?.slice(0,3) || [result.overview || "Document insight"]);
    const entry={id:`${Date.now()}-${"axqkpc"}`,tool:tool || "Analysis",title,createdAt:new Date().toISOString(),summary};
    const saved = persistLocal("pdfpilot-insights", [entry, ...savedInsights].slice(0,50));
    setSavedInsights(old=>[entry,...old].slice(0,50));
    if (supabase && user) {
      void supabase.from("saved_insights").insert({ user_id:user.id, title, insight_type: tool === "Compare documents" ? "comparison" : result.answer ? "answer" : "summary", content:{summary}, source_file_name:title })
        .select("id,title,insight_type,content,created_at").single().then(({data: row,error}) => {
          if(error) { setNotice("Insight was saved locally, but cloud saving failed."); return; }
          if(row) {
            const cloudEntry={id:row.id,tool:row.insight_type,title:row.title,createdAt:row.created_at,summary:Array.isArray(row.content?.summary)?row.content.summary:[]};
            setSavedInsights(old=>{const next=[cloudEntry,...old.filter(item=>item.id!==entry.id)].slice(0,50);persistLocal("pdfpilot-insights",next);return next;});
            setNotice("Insight saved to your cloud account.");
          }
        });
    } else if (saved) setNotice("Insight saved on this device. Sign in to sync it to your account.");
  }
  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setAuthMessage("Supabase is not configured. Add the public environment variables and restart the app."); return; }
    setAuthBusy(true); setAuthMessage("");
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword, options: { data: { display_name: authName.trim() }, emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) setAuthMessage("Account created. Check your email and open the verification link before signing in.");
        else setAuthMessage("Account created and signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
        if (error) throw error;
        setAuthMessage("Signed in successfully.");
      }
    } catch (error) { setAuthMessage(error instanceof Error ? error.message : "Authentication failed. Please try again."); }
    finally { setAuthBusy(false); }
  }
  async function handleLogout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setNotice("Could not sign out. Please try again.");
    else { try { localStorage.removeItem("pdfpilot-history"); localStorage.removeItem("pdfpilot-insights"); } catch { /* Local storage may be unavailable. */ } setHistory([]); setSavedInsights([]); setResult(null); setTool(null); setActive("Overview"); setNotice("You have signed out."); }
  }
  function removeHistory(id:string) { setHistory(old=>{const next=old.filter(item=>item.id!==id);persistLocal("pdfpilot-history", next);return next;}); if (supabase && user && /^[0-9a-f-]{36}$/i.test(id)) void supabase.from("documents").delete().eq("id",id).eq("user_id",user.id).then(({error})=>{if(error)setNotice("History was removed from this view, but cloud deletion failed.");}); }
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  function selectTool(next: ToolKey) {
    setTool(next);
    setFiles([]);
    setNotice("");
    setResult(null);
    setChatQuestion("");
    setActive(next);
  }
  async function runProcess() {
    if (tool === "Chat with PDF" && !chatQuestion.trim()) { setNotice("Enter a question about your PDF first."); return; }
    if (!files.length || (tool === "Compare documents" && files.length < 2)) return;
    setProcessing(true); setNotice(""); setResult(null);
    try {
      const form = new FormData();
      if (tool === "Compare documents") {
        form.append("action", "compare"); form.append("file1", files[0]); form.append("file2", files[1]);
      } else {
        form.append("action", tool === "Chat with PDF" ? "chat" : "analyze"); form.append("file", files[0]);
        if (tool === "Chat with PDF") form.append("question", chatQuestion);
      }
      const response = await fetch("/api/process", { method: "POST", body: form, signal: AbortSignal.timeout(35000) });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(response.ok
          ? "The server returned an unexpected response. Please try again."
          : "The PDF service is temporarily unavailable. Please try again shortly.");
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Processing failed.");
      setResult(data);
      saveResultToHistory(data, tool as ToolKey);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not process this PDF. Please try again."); }
    finally { setProcessing(false); }
  }

  function onFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list);
    const invalid = picked.find((f) => !(f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")));
    if (invalid) { setNotice(`${invalid.name} is not a PDF. Please choose PDF files only.`); return; }
    const oversized = picked.find((f) => f.size > 20 * 1024 * 1024);
    if (oversized) { setNotice(`${oversized.name} is larger than 20 MB. Choose a smaller PDF.`); return; }
    const pdfs = picked.filter((f) => f.size > 0);
    if (!pdfs.length) { setNotice("Please choose a non-empty PDF file."); return; }
    setFiles((old) => [...old, ...pdfs].slice(0, tool === "Compare documents" ? 2 : 1));
    setNotice("");
  }

  const filteredHistory = history.filter((item) => String(item.title || "").toLowerCase().includes(query.toLowerCase()) || String(item.tool || "").toLowerCase().includes(query.toLowerCase()));
  const filteredInsights = savedInsights.filter((item) => String(item.title || "").toLowerCase().includes(query.toLowerCase()) || String(item.tool || "").toLowerCase().includes(query.toLowerCase()) || (Array.isArray(item.summary) && item.summary.some((line: string) => String(line).toLowerCase().includes(query.toLowerCase()))));

  const navItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Analyze PDF", icon: FileSearch },
    { label: "Compare documents", icon: Files },
    { label: "Chat with PDF", icon: MessageSquareText },
    { label: "My documents", icon: FolderOpen },
  ];

  if (!authReady) return <main className="auth-shell"><section className="auth-card"><div className="brand-mark"><FileText size={21}/></div><h1>PDFPilot AI</h1><p>Preparing your secure workspace…</p></section></main>;
  if (!user) return (
    <main className="auth-shell"><section className="auth-card">
      <div className="auth-brand"><div className="brand-mark"><FileText size={21}/></div><div><strong>PDFPilot <span>AI</span></strong><small>BY SHORLAH CLOUD</small></div></div>
      <div className="eyebrow"><ShieldCheck size={14}/> YOUR PRIVATE DOCUMENT WORKSPACE</div>
      <h1>{authMode === "signup" ? "Create your account" : "Welcome back"}</h1>
      <p className="auth-intro">{authMode === "signup" ? "Sign up to save document history and insights securely across devices." : "Sign in to access your documents and saved insights."}</p>
      <form className="auth-form" onSubmit={handleAuthSubmit}>
        {authMode === "signup" && <label>Display name<input value={authName} onChange={e=>setAuthName(e.target.value)} autoComplete="name" maxLength={80} required placeholder="Your name"/></label>}
        <label>Email address<input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com"/></label>
        <label>Password<input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} autoComplete={authMode==="signup"?"new-password":"current-password"} minLength={8} required placeholder="At least 8 characters"/></label>
        <button className="primary-button auth-submit" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={17}/></button>
      </form>
      {authMessage && <p className="auth-message" role="status">{authMessage}</p>}
      <p className="auth-switch">{authMode === "signup" ? "Already have an account?" : "New to PDFPilot AI?"} <button onClick={()=>{setAuthMode(authMode==="signup"?"login":"signup");setAuthMessage("");}}>{authMode==="signup"?"Sign in":"Create account"}</button></p>
      <p className="auth-privacy"><ShieldCheck size={14}/> Your account data is protected by database access policies.</p>
    </section></main>
  );
  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><FileText size={21} strokeWidth={2.4} /></div>
          <div><div className="brand-name">PDFPilot <span>AI</span></div><div className="brand-by">BY SHORLAH CLOUD</div></div>
          <button className="icon-button mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={19}/></button>
        </div>
        <button className="workspace-switch"><div className="workspace-icon">S</div><div className="workspace-copy"><strong>Personal workspace</strong><small>Free plan</small></div><ChevronDown size={16}/></button>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav">
          {navItems.map(({label, icon: Icon}) => <button key={label} className={`nav-item ${active === label ? "nav-active" : ""}`} onClick={() => { setMobileMenu(false); if (label === "Analyze PDF" || label === "Compare documents" || label === "Chat with PDF") selectTool(label as ToolKey); else { setActive(label); setTool(null); } }}><Icon size={18}/><span>{label}</span>{label === "My documents" && <span className="nav-count">{history.length}</span>}</button>)}
        </nav>
        <div className="nav-caption tools-caption">YOUR TOOLS</div>
        <button className="nav-item" onClick={() => {setActive("Saved insights"); setTool(null)}}><BookOpenText size={18}/><span>Saved insights</span></button>
        <button className="nav-item" onClick={() => {setActive("Activity"); setTool(null)}}><Activity size={18}/><span>Activity</span></button>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><div className="upgrade-icon"><Zap size={17}/></div><strong>Unlock more with Pro</strong><p>Get deeper insights and analyze more documents.</p><button onClick={() => setNotice("Plans and billing will be available in a later release.")}>Explore plans <ArrowRight size={14}/></button><div className="upgrade-orbit orbit-one"/><div className="upgrade-orbit orbit-two"/></div>
          <button className="nav-item" onClick={() => {setActive("Settings"); setTool(null)}}><Settings2 size={18}/><span>Settings</span></button>
          <button className={"nav-item " + (active === "Help & support" ? "nav-active" : "")} onClick={() => {setActive("Help & support");setTool(null);setMobileMenu(false)}}><CircleHelp size={18}/><span>Help & support</span></button>
          <div className="profile-row"><div className="profile-avatar">SC</div><div className="profile-copy"><strong>{user.user_metadata?.display_name || user.email || "Your workspace"}</strong><small>Signed-in account</small></div><button className="icon-button" aria-label="Sign out" title="Sign out" onClick={handleLogout}><ChevronDown size={16}/></button></div>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-backdrop" onClick={() => setMobileMenu(false)} aria-label="Close navigation"/>}
      <section className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={20}/></button>
          <div className="breadcrumbs">Workspace <span>/</span> <strong>{tool ?? active}</strong></div>
          <div className="top-actions"><label className="search-box"><Search size={16}/><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents..." aria-label="Search documents, tools and saved insights" /><kbd>⌘ K</kbd></label><button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice("You're all caught up.")}><Bell size={18}/><i/></button><button className="top-avatar auth-top-avatar" title="Sign out" onClick={handleLogout}>{(user.user_metadata?.display_name || user.email || "U").slice(0,2).toUpperCase()}</button></div>
        </header>

        <div className="page-content">
          {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}
          {tool ? (
            <section className="tool-page">
              <button className="back-link" onClick={() => {setTool(null);setActive("Overview")}}>← Back to overview</button>
              <div className="page-heading"><div><div className="eyebrow"><Sparkles size={14}/> AI WORKSPACE</div><h1>{tool}</h1><p>{tool === "Analyze PDF" ? "Turn long documents into clear, useful insights." : tool === "Compare documents" ? "See what changed, what matches, and what needs attention." : "Ask questions about your document and explore the details."}</p></div><div className="heading-shield"><ShieldCheck size={22}/><span>Request-only processing</span></div></div>
              <div className="upload-panel">
                <div className="upload-panel-title"><div className="upload-title-icon"><UploadCloud size={20}/></div><div><h2>{tool === "Compare documents" ? "Add documents to compare" : "Upload your PDF"}</h2><p>{tool === "Compare documents" ? "Add two PDFs to identify differences and similarities." : "PDF files up to 20 MB each."}</p></div></div>
                <button className="dropzone" onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {e.preventDefault();onFiles(e.dataTransfer.files)}}><div className="upload-circle"><UploadCloud size={24}/></div><strong>Drop your PDF here, or <span>browse files</span></strong><small>PDF format · Max 20 MB per file</small></button>
                <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple={tool === "Compare documents"} hidden onChange={(e) => onFiles(e.target.files)}/>
                {files.length > 0 && <div className="selected-files">{files.map((f,i)=><div className="selected-file" key={f.name+i}><FileText size={18}/><div><strong>{f.name}</strong><small>{(f.size/1024/1024).toFixed(2)} MB</small></div><button className="icon-button" onClick={() => setFiles(files.filter((_,j)=>j!==i))} aria-label="Remove file"><X size={16}/></button></div>)}</div>}
                {notice && <p className="inline-warning">{notice}</p>}
                {tool === "Chat with PDF" && files.length > 0 && <label className="question-field"><span>What would you like to know?</span><textarea value={chatQuestion} onChange={(e) => setChatQuestion(e.target.value)} placeholder="Ask a question using terms from your document..." rows={3}/></label>}
                <button className="primary-button analyze-button" disabled={processing || files.length < (tool === "Compare documents" ? 2 : 1) || (tool === "Chat with PDF" && !chatQuestion.trim())} onClick={runProcess}>{processing ? "Processing PDF..." : tool === "Compare documents" ? "Compare documents" : tool === "Chat with PDF" ? "Ask question" : "Analyze document"} {!processing && <ArrowRight size={17}/>}</button>
                {result && <div className="result-panel">
                  <div className="result-heading"><div><span className="result-kicker"><Sparkles size={13}/> {result.aiEnabled ? "AI-ASSISTED RESULT" : "PROCESSING RESULT"}</span><h2>{tool === "Compare documents" ? "Document comparison" : tool === "Chat with PDF" ? "Answer from your PDF" : "Document insights"}</h2></div><div className="result-export-actions"><button className="text-button" onClick={saveInsight}>Save insight</button><button className="text-button" onClick={() => {const blob=new Blob([JSON.stringify(result,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="pdfpilot-result.json";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)}}>JSON ↓</button><button className="text-button" onClick={() => {const lines:string[]=["# PDFPilot AI report","",`Generated from: ${result.document?.name || result.documents?.map((d:{name:string})=>d.name).join(" and ") || "PDF documents"}`,""];if(result.summary)lines.push("## Summary",...result.summary.map((x:string)=>"- "+x),"");if(result.keyFindings?.length)lines.push("## Key findings",...result.keyFindings.map((x:string)=>"- "+x),"");if(result.risks?.length)lines.push("## Risks and cautions",...result.risks.map((x:string)=>"- "+x),"");if(result.actionItems?.length)lines.push("## Action items",...result.actionItems.map((x:string)=>"- "+x),"");if(result.answer)lines.push("## Answer",result.answer,"");if(result.overview)lines.push("## Comparison overview",result.overview,"");if(result.keyDifferences?.length)lines.push("## Key differences",...result.keyDifferences.map((x:string)=>"- "+x),"");if(result.sharedPoints?.length)lines.push("## Shared points",...result.sharedPoints.map((x:string)=>"- "+x),"");if(result.followUps?.length)lines.push("## Follow-up checks",...result.followUps.map((x:string)=>"- "+x),"");if(result.sharedTerms?.length)lines.push("## Shared content terms",result.sharedTerms.join(", "),"");if(result.uniqueToFirst?.length)lines.push("## Terms only in first PDF",result.uniqueToFirst.join(", "),"");if(result.uniqueToSecond?.length)lines.push("## Terms only in second PDF",result.uniqueToSecond.join(", "),"");if(result.matches!==undefined)lines.push("## Retrieved matching passages",String(result.matches),"");if(result.dates?.length)lines.push("## Dates",result.dates.join(", "),"");if(result.amounts?.length)lines.push("## Amounts and percentages",result.amounts.join(", "),"");lines.push("## Notes",String(result.disclaimer || result.note || "Review this output against the source PDF."));const blob=new Blob([lines.join("\n")],{type:"text/markdown;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="pdfpilot-report.md";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)}}>Report ↓</button></div></div>
                  {result.document && <p className="result-meta">{result.document.name}{result.document.pages ? " · "+result.document.pages+" pages" : ""}{result.wordCount ? " · "+result.wordCount.toLocaleString()+" words" : ""}</p>}{result.truncated && <p className="notice" role="status">One or more PDFs exceed the current text-processing window. Results may omit later content, so verify important findings against the complete original document.</p>}
                  {result.summary && <><h3>Summary highlights</h3><ul>{result.summary.map((line:string,i:number)=><li key={i}>{line}</li>)}</ul>{result.keyFindings?.length>0&&<><h3>Key findings</h3><ul>{result.keyFindings.map((line:string,i:number)=><li key={i}>{line}</li>)}</ul></>}{result.risks?.length>0&&<><h3>Risks and cautions</h3><ul>{result.risks.map((line:string,i:number)=><li key={i}>{line}</li>)}</ul></>}{result.actionItems?.length>0&&<><h3>Suggested action items</h3><ul>{result.actionItems.map((line:string,i:number)=><li key={i}>{line}</li>)}</ul></>}{(result.dates?.length>0||result.amounts?.length>0)&&<div className="extracted-grid">{result.dates?.length>0&&<div><h3>Dates found</h3><p>{result.dates.join(" · ")}</p></div>}{result.amounts?.length>0&&<div><h3>Amounts / percentages</h3><p>{result.amounts.join(" · ")}</p></div>}</div>}</>}
                  {result.answer && <p className="answer-text">{result.answer}</p>}
                  {result.documents && <><div className="compare-stats"><div><small>Vocabulary overlap</small><strong>{result.overlap}%</strong></div>{result.documents.map((d:{name:string;pages:number;words:number})=><div key={d.name}><small>{d.name}</small><strong>{d.pages} pages · {d.words} terms</strong></div>)}</div>{result.overview && <><h3>AI comparison overview</h3><p className="answer-text">{result.overview}</p></>}{result.keyDifferences?.length>0&&<><h3>Key differences</h3><ul>{result.keyDifferences.map((line:string,i:number)=><li key={i}>{line}</li>)}</ul></>}{result.sharedPoints?.length>0&&<><h3>Shared points</h3><ul>{result.sharedPoints.map((line:string,i:number)=><li key={i}>{line}</li>)}</ul></>}{result.followUps?.length>0&&<><h3>Follow-up checks</h3><ul>{result.followUps.map((line:string,i:number)=><li key={i}>{line}</li>)}</ul></>}<div className="extracted-grid"><div><h3>Terms only in first PDF</h3><p>{result.uniqueToFirst?.join(", ") || "None found"}</p></div><div><h3>Terms only in second PDF</h3><p>{result.uniqueToSecond?.join(", ") || "None found"}</p></div></div><p className="result-meta">{result.note}</p></>}
                  {result.disclaimer && <p className="result-disclaimer">{result.disclaimer}</p>}
                </div>}
                <p className="privacy-note"><ShieldCheck size={14}/> PDFs are processed for this request and are not saved as files by this app. When AI is configured, extracted text is sent to the AI provider to generate results. History and saved insights are synced to your signed-in account; uploaded PDF files themselves are not stored.</p>
              </div>
              <div className="below-upload"><div><Sparkles size={18}/><strong>What you&apos;ll get</strong></div><p>{tool === "Compare documents" ? "A comparison of extracted content words, plus AI-assisted differences and shared points when server-side AI is configured. Always verify against the original PDFs." : tool === "Chat with PDF" ? "Answers grounded in extracted document text. Page-level citations are not available yet, so check important answers against the original PDF." : "An extractive summary, key findings, detected dates and amounts, and AI-assisted risks or action items when server-side AI is configured."}</p></div>
            </section>
          ) : active === "Overview" ? (
            <>
              <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> YOUR AI DOCUMENT WORKSPACE</div><h1>Make sense of <span>every document.</span></h1><p>Welcome back. What would you like to understand today?</p></div><button className="primary-button" onClick={() => selectTool("Analyze PDF")}><Plus size={18}/> New analysis</button></div>
              <div className="hero-card"><div className="hero-content"><div className="hero-badge"><Sparkles size={13}/> YOUR DOCUMENTS, UNDERSTOOD</div><h2>Less reading.<br/><span>More understanding.</span></h2><p>Summarize, compare, and ask questions about your PDFs — all in one intelligent workspace.</p><button className="hero-button" onClick={() => selectTool("Analyze PDF")}>Analyze a document <ArrowRight size={16}/></button><div className="hero-footnote"><ShieldCheck size={14}/> Request-based processing <span>·</span> AI-assisted insights</div></div><div className="hero-art"><div className="art-glow"/><div className="art-doc art-back"><div/><div/><div/></div><div className="art-doc art-front"><div className="art-file-icon"><FileText size={25}/></div><b>PDF</b><div className="art-line wide"/><div className="art-line"/><div className="art-line short"/><div className="art-highlight"><Check size={13}/> Key insights found</div></div><div className="floating-chip chip-sparkle"><Sparkles size={15}/></div><div className="floating-chip chip-check"><FileCheck2 size={16}/><span>Ready to explore</span></div></div></div>
              <div className="section-title-row"><div><h2>What would you like to do?</h2><p>Powerful tools for your documents</p></div><span className="subtle-label">3 TOOLS</span></div>
              <div className="tool-grid">{tools.map(({title,description,icon:Icon,tone})=><button className="tool-card" key={title} onClick={() => selectTool(title)}><div className={`tool-icon ${tone}`}><Icon size={21}/></div><div className="tool-card-arrow"><ArrowUpRight size={17}/></div><h3>{title}</h3><p>{description}</p><span className="tool-link">Get started <ArrowRight size={14}/></span></button>)}</div>
              <div className="section-title-row recent-heading"><div><h2>Recent documents</h2><p>Pick up where you left off</p></div><button className="text-button" onClick={() => {setActive("My documents");setTool(null)}}>View all <ArrowRight size={15}/></button></div>
              <div className="documents-card">{filteredHistory.slice(0,5).map(item=><div className="document-row" key={item.id}><div className="document-icon mint"><FileText size={20}/></div><div className="document-info"><strong>{item.title}</strong><small>{item.tool} · {new Date(item.createdAt).toLocaleDateString()}</small></div><span className="status-pill"><i/>Processed</span><button className="row-arrow" aria-label={`Open ${item.title}`} onClick={()=>{setResult(item.result);setTool(item.tool);setActive(item.tool)}}><ArrowRight size={17}/></button></div>)}{filteredHistory.length===0&&<div className="empty-search">No recent results yet. Analyze a PDF to see your processing history here.</div>}<button className="add-document-row" onClick={() => selectTool("Analyze PDF")}><span><Plus size={17}/></span> Analyze a new document</button></div>
              <div className="bottom-grid"><div className="insight-card"><div className="insight-icon"><Activity size={18}/></div><div><strong>Your workspace is ready to explore</strong><p>Upload a PDF to begin. Your latest results are synced to your account. Uploaded PDF files themselves are not stored.</p></div><ArrowDownRight size={18}/></div><div className="usage-card"><div className="usage-top"><span>WORKSPACE USAGE</span><span className="usage-free">FREE PLAN</span></div><div className="usage-number">Getting started <span>· {history.length} processed items</span></div><div className="usage-track"><div/></div><p>Usage tracking will activate when accounts are connected.</p></div></div>
              <footer className="page-footer"><span>© 2026 PDFPilot AI</span><span>Thoughtfully built by <b>Shorlah Cloud</b></span><span><ShieldCheck size={13}/> Privacy-first workspace</span></footer>
            </>
          ) : active === "Settings" ? (
            <section className="settings-page">
              <div className="eyebrow"><Settings2 size={14}/> PREFERENCES</div>
              <h1>Settings</h1>
              <p className="settings-intro">Make PDFPilot AI comfortable for your workflow.</p>
              <div className="settings-card">
                <div className="settings-item"><div className="settings-item-icon"><Sun size={20}/></div><div className="settings-item-copy"><strong>Appearance</strong><p>Choose a theme for the dashboard. Your choice is saved on this device.</p></div><button className="theme-switch-button" onClick={toggleTheme}>{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>} Switch to {theme === "dark" ? "light" : "dark"} mode</button></div>
                <div className="settings-item"><div className="settings-item-icon"><ShieldCheck size={20}/></div><div className="settings-item-copy"><strong>Document privacy</strong><p>PDF files are processed per request and are not stored. Only analysis outputs and result metadata are saved to your private account.</p></div><span className="settings-status">Account protected</span></div>
                <div className="settings-item"><div className="settings-item-icon"><Sparkles size={20}/></div><div className="settings-item-copy"><strong>AI provider</strong><p>AI-enhanced answers require a server-side OPENAI_API_KEY. Without it, available text-based fallbacks are used.</p></div><span className="settings-status">Server configuration</span></div>
              </div>
              <button className="primary-button settings-back" onClick={() => {setActive("Overview");setTool(null)}}>Back to overview <ArrowRight size={16}/></button>
            </section>
          ) : active === "My documents" ? (
            <section className="library-page"><div className="eyebrow"><FolderOpen size={14}/> LOCAL WORKSPACE</div><h1>My documents</h1><p className="settings-intro">Your processing history is synced to your account. PDF files themselves are not stored.</p><div className="library-card">{filteredHistory.map(item=><div className="library-row" key={item.id}><div className="library-icon"><FileText size={19}/></div><div className="library-copy"><strong>{item.title}</strong><small>{item.tool} · {new Date(item.createdAt).toLocaleString()}</small></div><button className="text-button" onClick={()=>{setResult(item.result);setTool(item.tool);setActive(item.tool)}}>View result</button><button className="icon-button" aria-label="Remove history item" onClick={()=>removeHistory(item.id)}><X size={16}/></button></div>)}{filteredHistory.length===0&&<div className="library-empty"><FolderOpen size={24}/><strong>No processing history yet</strong><p>Analyze, compare, or chat with a PDF and results will appear here on this device.</p><button className="primary-button" onClick={()=>selectTool("Analyze PDF")}>Analyze a PDF <ArrowRight size={16}/></button></div>}</div></section>
          ) : active === "Saved insights" ? (
            <section className="library-page"><div className="eyebrow"><BookOpenText size={14}/> SAVED NOTES</div><h1>Saved insights</h1><p className="settings-intro">Saved findings synced to your account.</p><div className="insights-list">{filteredInsights.map(item=><article className="saved-insight-card" key={item.id}><div className="library-icon"><Sparkles size={19}/></div><div className="library-copy"><strong>{item.title}</strong><small>{item.tool} · {new Date(item.createdAt).toLocaleString()}</small><ul>{item.summary.map((line:string,i:number)=><li key={i}>{line}</li>)}</ul></div><button className="icon-button" aria-label="Remove saved insight" onClick={()=>{setSavedInsights(old=>{const next=old.filter(x=>x.id!==item.id);persistLocal("pdfpilot-insights",next);return next});if(supabase&&user&&/^[0-9a-f-]{36}$/i.test(item.id))void supabase.from("saved_insights").delete().eq("id",item.id).eq("user_id",user.id).then(({error})=>{if(error)setNotice("Insight was removed from this view, but cloud deletion failed.");});}}><X size={16}/></button></article>)}{filteredInsights.length===0&&<div className="library-empty"><BookOpenText size={24}/><strong>No saved insights yet</strong><p>Use “Save insight” on any analysis result.</p><button className="primary-button" onClick={()=>selectTool("Analyze PDF")}>Analyze a PDF <ArrowRight size={16}/></button></div>}</div></section>
          ) : active === "Activity" ? (
            <section className="library-page"><div className="eyebrow"><Activity size={14}/> RECENT ACTIONS</div><h1>Activity</h1><p className="settings-intro">Completed PDF actions recorded on this device.</p><div className="library-card">{filteredHistory.map(item=><div className="library-row" key={item.id}><div className="library-icon"><Clock3 size={19}/></div><div className="library-copy"><strong>{item.tool}: {item.title}</strong><small>{new Date(item.createdAt).toLocaleString()}</small></div><span className="settings-status">Completed</span></div>)}{filteredHistory.length===0&&<div className="library-empty"><Activity size={24}/><strong>No activity yet</strong><p>Your completed PDF actions will appear here.</p></div>}</div></section>
          ) : active === "Help & support" ? (
            <section className="help-page">
              <div className="eyebrow"><CircleHelp size={14}/> HELP & SUPPORT</div>
              <h1>How can we help?</h1>
              <p className="settings-intro">Quick answers for analyzing, comparing, and asking questions about PDFs.</p>
              <div className="help-grid">
                <article className="help-card"><h2>How do I analyze a PDF?</h2><p>Choose Analyze PDF, select a text-based PDF up to 20 MB, then select Analyze document. If no AI provider key is configured, PDFPilot uses built-in extractive analysis.</p></article>
                <article className="help-card"><h2>Why is my scanned PDF not working?</h2><p>Scanned pages are often images rather than selectable text. OCR is not connected yet, so use a PDF with selectable text or run OCR before uploading.</p></article>
                <article className="help-card"><h2>How does Chat with PDF work?</h2><p>Upload a PDF, enter a question using words from the document, and choose Ask question. Without an AI key, answers use keyword-based passage retrieval and may be incomplete.</p></article>
                <article className="help-card"><h2>How do I compare two PDFs?</h2><p>Choose Compare documents and add two PDFs. Without AI, results show shared and unique terms; overlap is vocabulary overlap, not semantic similarity.</p></article>
                <article className="help-card"><h2>Will uploaded files remain after refresh?</h2><p>Uploaded PDF files are not saved in the browser workspace. Choose files again after refresh. Your current section, search, and completed result are restored on this device.</p></article>
                <article className="help-card"><h2>My result or history is missing</h2><p>Check that browser storage is enabled. Cloud history also depends on database access policies and network connectivity. Check My documents for saved results.</p></article>
              </div>
              <div className="help-contact-card"><div><h2>Still need help?</h2><p>This opens your email app with a support draft; it does not submit anything automatically.</p></div><a className="primary-button" href={"mailto:contact.shorlahdev@gmail.com?subject="+encodeURIComponent("PDFPilot AI support request")+"&body="+encodeURIComponent("Describe the issue:\n\nWhat you expected:\n\nWhat happened instead:\n")}>Email support <ArrowRight size={16}/></a></div>
            </section>
          ) : (
            <section className="placeholder-page"><div className="placeholder-icon"><CircleHelp size={25}/></div><h1>{active}</h1><p>This section will be expanded after the core PDF workflow is tested.</p><button className="primary-button" onClick={()=>{setActive("Overview");setTool(null)}}>Back to overview <ArrowRight size={16}/></button></section>
          )}
        </div>
      </section>
    </main>
  );
}