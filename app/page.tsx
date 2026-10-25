"use client";

import { useRef, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpenText,
  Check, ChevronDown, CircleHelp, Clock3, FileCheck2, FileSearch, FileText,
  Files, FolderOpen, LayoutDashboard, Menu, MessageSquareText, Plus, Search,
  Settings2, ShieldCheck, Sparkles, UploadCloud, X, Zap
} from "lucide-react";

type ToolKey = "Analyze PDF" | "Compare documents" | "Chat with PDF";
const recentDocs = [
  { name: "Q3 Financial Report.pdf", meta: "PDF · 24 pages · Analyzed 2 hours ago", tag: "Analyzed", color: "mint", icon: "report" },
  { name: "Service Agreement v2.pdf", meta: "PDF · 12 pages · Compared yesterday", tag: "Compared", color: "lavender", icon: "contract" },
  { name: "Market Research 2026.pdf", meta: "PDF · 38 pages · Analyzed Oct 22", tag: "Analyzed", color: "peach", icon: "research" },
];
const tools: { title: ToolKey; description: string; icon: typeof FileSearch; tone: string }[] = [
  { title: "Analyze PDF", description: "Get clear summaries, insights, and key takeaways.", icon: FileSearch, tone: "green" },
  { title: "Compare documents", description: "Find differences between two or more files.", icon: Files, tone: "purple" },
  { title: "Chat with PDF", description: "Ask questions and get answers grounded in your files.", icon: MessageSquareText, tone: "orange" },
];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [tool, setTool] = useState<ToolKey | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function selectTool(next: ToolKey) {
    setTool(next);
    setFiles([]);
    setNotice("");
    setActive(next);
  }
  function onFiles(list: FileList | null) {
    if (!list) return;
    const pdfs = Array.from(list).filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    setFiles((old) => [...old, ...pdfs].slice(0, tool === "Compare documents" ? 4 : 1));
    setNotice(pdfs.length ? "" : "Please choose a PDF file.");
  }

  const navItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Analyze PDF", icon: FileSearch },
    { label: "Compare documents", icon: Files },
    { label: "Chat with PDF", icon: MessageSquareText },
    { label: "My documents", icon: FolderOpen },
  ];

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
          {navItems.map(({label, icon: Icon}) => <button key={label} className={`nav-item ${active === label ? "nav-active" : ""}`} onClick={() => label === "Analyze PDF" || label === "Compare documents" || label === "Chat with PDF" ? selectTool(label as ToolKey) : (setActive(label), setTool(null))}><Icon size={18}/><span>{label}</span>{label === "My documents" && <span className="nav-count">3</span>}</button>)}
        </nav>
        <div className="nav-caption tools-caption">YOUR TOOLS</div>
        <button className="nav-item" onClick={() => {setActive("Saved insights"); setTool(null)}}><BookOpenText size={18}/><span>Saved insights</span></button>
        <button className="nav-item" onClick={() => {setActive("Activity"); setTool(null)}}><Activity size={18}/><span>Activity</span></button>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><div className="upgrade-icon"><Zap size={17}/></div><strong>Unlock more with Pro</strong><p>Get deeper insights and analyze more documents.</p><button onClick={() => setNotice("Plans and billing will be available in a later release.")}>Explore plans <ArrowRight size={14}/></button><div className="upgrade-orbit orbit-one"/><div className="upgrade-orbit orbit-two"/></div>
          <button className="nav-item" onClick={() => {setActive("Settings"); setTool(null)}}><Settings2 size={18}/><span>Settings</span></button>
          <button className="nav-item" onClick={() => setNotice("Help center is coming soon.")}><CircleHelp size={18}/><span>Help & support</span></button>
          <div className="profile-row"><div className="profile-avatar">SC</div><div className="profile-copy"><strong>Your workspace</strong><small>Personal account</small></div><button className="icon-button" aria-label="Profile options" onClick={() => setNotice("Account settings will be available when authentication is connected.")}><ChevronDown size={16}/></button></div>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-backdrop" onClick={() => setMobileMenu(false)} aria-label="Close navigation"/>}
      <section className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={20}/></button>
          <div className="breadcrumbs">Workspace <span>/</span> <strong>{tool ?? active}</strong></div>
          <div className="top-actions"><label className="search-box"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents..." /><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice("You're all caught up.")}><Bell size={18}/><i/></button><div className="top-avatar">SC</div></div>
        </header>

        <div className="page-content">
          {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}
          {tool ? (
            <section className="tool-page">
              <button className="back-link" onClick={() => {setTool(null);setActive("Overview")}}>← Back to overview</button>
              <div className="page-heading"><div><div className="eyebrow"><Sparkles size={14}/> AI WORKSPACE</div><h1>{tool}</h1><p>{tool === "Analyze PDF" ? "Turn long documents into clear, useful insights." : tool === "Compare documents" ? "See what changed, what matches, and what needs attention." : "Ask questions about your document and explore the details."}</p></div><div className="heading-shield"><ShieldCheck size={22}/><span>Your files stay yours</span></div></div>
              <div className="upload-panel">
                <div className="upload-panel-title"><div className="upload-title-icon"><UploadCloud size={20}/></div><div><h2>{tool === "Compare documents" ? "Add documents to compare" : "Upload your PDF"}</h2><p>{tool === "Compare documents" ? "Add 2–4 PDFs to identify differences and similarities." : "PDF files up to 20 MB each."}</p></div></div>
                <button className="dropzone" onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {e.preventDefault();onFiles(e.dataTransfer.files)}}><div className="upload-circle"><UploadCloud size={24}/></div><strong>Drop your PDF here, or <span>browse files</span></strong><small>PDF format · Max 20 MB per file</small></button>
                <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple={tool === "Compare documents"} hidden onChange={(e) => onFiles(e.target.files)}/>
                {files.length > 0 && <div className="selected-files">{files.map((f,i)=><div className="selected-file" key={f.name+i}><FileText size={18}/><div><strong>{f.name}</strong><small>{(f.size/1024/1024).toFixed(2)} MB</small></div><button className="icon-button" onClick={() => setFiles(files.filter((_,j)=>j!==i))} aria-label="Remove file"><X size={16}/></button></div>)}</div>}
                {notice && <p className="inline-warning">{notice}</p>}
                <button className="primary-button analyze-button" disabled={files.length < (tool === "Compare documents" ? 2 : 1)} onClick={() => setNotice("Upload selection works. AI processing will be connected after secure backend setup.")}>{tool === "Compare documents" ? "Compare documents" : tool === "Chat with PDF" ? "Start chatting" : "Analyze document"} <ArrowRight size={17}/></button>
                <p className="privacy-note"><ShieldCheck size={14}/> Private by design. Your documents are not shared with other users.</p>
              </div>
              <div className="below-upload"><div><Sparkles size={18}/><strong>What you'll get</strong></div><p>{tool === "Compare documents" ? "A structured differences report, matching sections, changed values, and important clauses." : tool === "Chat with PDF" ? "Document-grounded answers, follow-up questions, and relevant page references." : "An executive summary, key findings, extracted facts, important dates, and suggested next steps."}</p></div>
            </section>
          ) : active === "Overview" ? (
            <>
              <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> YOUR AI DOCUMENT WORKSPACE</div><h1>Make sense of <span>every document.</span></h1><p>Welcome back. What would you like to understand today?</p></div><button className="primary-button" onClick={() => selectTool("Analyze PDF")}><Plus size={18}/> New analysis</button></div>
              <div className="hero-card"><div className="hero-content"><div className="hero-badge"><Sparkles size={13}/> YOUR DOCUMENTS, UNDERSTOOD</div><h2>Less reading.<br/><span>More understanding.</span></h2><p>Summarize, compare, and ask questions about your PDFs — all in one intelligent workspace.</p><button className="hero-button" onClick={() => selectTool("Analyze PDF")}>Analyze a document <ArrowRight size={16}/></button><div className="hero-footnote"><ShieldCheck size={14}/> Secure workspace <span>·</span> AI-powered insights</div></div><div className="hero-art"><div className="art-glow"/><div className="art-doc art-back"><div/><div/><div/></div><div className="art-doc art-front"><div className="art-file-icon"><FileText size={25}/></div><b>PDF</b><div className="art-line wide"/><div className="art-line"/><div className="art-line short"/><div className="art-highlight"><Check size={13}/> Key insights found</div></div><div className="floating-chip chip-sparkle"><Sparkles size={15}/></div><div className="floating-chip chip-check"><FileCheck2 size={16}/><span>Ready to explore</span></div></div></div>
              <div className="section-title-row"><div><h2>What would you like to do?</h2><p>Powerful tools for your documents</p></div><span className="subtle-label">3 TOOLS</span></div>
              <div className="tool-grid">{tools.map(({title,description,icon:Icon,tone})=><button className="tool-card" key={title} onClick={() => selectTool(title)}><div className={`tool-icon ${tone}`}><Icon size={21}/></div><div className="tool-card-arrow"><ArrowUpRight size={17}/></div><h3>{title}</h3><p>{description}</p><span className="tool-link">Get started <ArrowRight size={14}/></span></button>)}</div>
              <div className="section-title-row recent-heading"><div><h2>Recent documents</h2><p>Pick up where you left off</p></div><button className="text-button" onClick={() => {setActive("My documents");setTool(null)}}>View all <ArrowRight size={15}/></button></div>
              <div className="documents-card">{recentDocs.filter(d=>d.name.toLowerCase().includes(query.toLowerCase())).map((doc)=><div className="document-row" key={doc.name}><div className={`document-icon ${doc.color}`}><FileText size={20}/></div><div className="document-info"><strong>{doc.name}</strong><small>{doc.meta}</small></div><span className={`status-pill ${doc.tag==="Compared"?"compared":""}`}><i/>{doc.tag}</span><button className="row-arrow" aria-label={`Open ${doc.name}`} onClick={() => {setNotice("Connect storage to open saved document history.");setActive("My documents")}}><ArrowRight size={17}/></button></div>)}{recentDocs.filter(d=>d.name.toLowerCase().includes(query.toLowerCase())).length===0&&<div className="empty-search">No matching sample documents.</div>}<button className="add-document-row" onClick={() => selectTool("Analyze PDF")}><span><Plus size={17}/></span> Analyze a new document</button></div>
              <div className="bottom-grid"><div className="insight-card"><div className="insight-icon"><Activity size={18}/></div><div><strong>Your workspace is ready to explore</strong><p>Upload a PDF to begin. Your analysis history will appear here once document processing is connected.</p></div><ArrowDownRight size={18}/></div><div className="usage-card"><div className="usage-top"><span>WORKSPACE USAGE</span><span className="usage-free">FREE PLAN</span></div><div className="usage-number">Getting started <span>· 0 uploads</span></div><div className="usage-track"><div/></div><p>Usage tracking will activate when accounts are connected.</p></div></div>
              <footer className="page-footer"><span>© 2026 PDFPilot AI</span><span>Thoughtfully built by <b>Shorlah Cloud</b></span><span><ShieldCheck size={13}/> Privacy-first workspace</span></footer>
            </>
          ) : (
            <section className="placeholder-page"><div className="placeholder-icon"><FolderOpen size={25}/></div><h1>{active}</h1><p>This workspace section is part of the interface foundation. Saved files, real activity, account settings, and history will be connected in the next development stages.</p><button className="primary-button" onClick={() => {setActive("Overview");setTool(null)}}>Back to overview <ArrowRight size={16}/></button></section>
          )}
        </div>
      </section>
    </main>
  );
}