"use client";

import { useEffect, useMemo, useState } from "react";

type Priority = "High" | "Medium" | "Low";
type FindingStatus = "Draft" | "Reviewed" | "Approved";

type Finding = {
  id: string;
  title: string;
  category: string;
  observation: string;
  impact: string;
  recommendation: string;
  priority: Priority;
  status: FindingStatus;
};

type Audit = {
  clientName: string;
  brandName: string;
  website: string;
  industry: string;
  audience: string;
  objectives: string;
  findings: Finding[];
};

const categories = [
  "Brand strategy and positioning",
  "Visual identity consistency",
  "Logo usage",
  "Typography",
  "Color system",
  "Art direction and imagery",
  "Website and digital touchpoints",
  "Brand communication",
  "Opportunities and recommendations",
];

const initialAudit: Audit = {
  clientName: "Northstar Coffee",
  brandName: "Northstar",
  website: "northstar.coffee",
  industry: "Specialty coffee",
  audience: "Design-conscious coffee drinkers and independent cafés",
  objectives: "Build recognition beyond the flagship store and make the subscription offer easier to understand.",
  findings: [
    {
      id: "finding-1",
      title: "A distinctive visual world is not yet consistent",
      category: "Visual identity consistency",
      observation:
        "The warm, tactile photography creates a memorable point of view. Across digital touchpoints, however, image treatment and spacing vary enough that the brand feels more campaign-led than system-led.",
      impact: "Inconsistent application makes recognition harder and reduces the sense of care associated with the product.",
      recommendation:
        "Create a lightweight art direction guide covering crop, contrast, negative space, and a small set of repeatable layout principles.",
      priority: "High",
      status: "Approved",
    },
    {
      id: "finding-2",
      title: "The subscription proposition is buried",
      category: "Brand communication",
      observation:
        "The homepage introduces the product range before explaining why a visitor should subscribe. The strongest commercial difference is therefore discovered late in the journey.",
      impact: "New visitors may understand what Northstar sells without understanding the recurring value of choosing it.",
      recommendation:
        "Bring the subscription promise into the first screen, then support it with a concise three-step explanation and a clear comparison of plan benefits.",
      priority: "Medium",
      status: "Reviewed",
    },
  ],
};

const emptyFinding: Omit<Finding, "id"> = {
  title: "",
  category: categories[0],
  observation: "",
  impact: "",
  recommendation: "",
  priority: "Medium",
  status: "Draft",
};

function makeId() {
  return `finding-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function Home() {
  const [audit, setAudit] = useState<Audit>(initialAudit);
  const [activeView, setActiveView] = useState<"workspace" | "report">("workspace");
  const [selectedId, setSelectedId] = useState(initialAudit.findings[0]?.id ?? "");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Omit<Finding, "id">>(emptyFinding);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("brandaudit-audit");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Audit;
        setAudit(parsed);
        setSelectedId(parsed.findings[0]?.id ?? "");
      } catch {
        window.localStorage.removeItem("brandaudit-audit");
      }
    }
  }, []);

  const selectedFinding = audit.findings.find((finding) => finding.id === selectedId);
  const approvedCount = audit.findings.filter((finding) => finding.status === "Approved").length;
  const completion = audit.findings.length ? Math.round((approvedCount / audit.findings.length) * 100) : 0;
  const categoryCount = new Set(audit.findings.map((finding) => finding.category)).size;

  function updateAudit(field: keyof Omit<Audit, "findings">, value: string) {
    setAudit((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function updateFinding(field: keyof Finding, value: string) {
    setAudit((current) => ({
      ...current,
      findings: current.findings.map((finding) =>
        finding.id === selectedId ? { ...finding, [field]: value } as Finding : finding,
      ),
    }));
    setSaved(false);
  }

  function saveAudit() {
    window.localStorage.setItem("brandaudit-audit", JSON.stringify(audit));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function addFinding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.observation.trim()) return;
    const finding = { ...draft, id: makeId() };
    setAudit((current) => ({ ...current, findings: [...current.findings, finding] }));
    setSelectedId(finding.id);
    setDraft(emptyFinding);
    setShowForm(false);
    setSaved(false);
  }

  function deleteFinding() {
    if (!selectedFinding) return;
    const remaining = audit.findings.filter((finding) => finding.id !== selectedId);
    setAudit((current) => ({ ...current, findings: remaining }));
    setSelectedId(remaining[0]?.id ?? "");
    setSaved(false);
  }

  function moveFinding(direction: -1 | 1) {
    const index = audit.findings.findIndex((finding) => finding.id === selectedId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= audit.findings.length) return;
    const findings = [...audit.findings];
    [findings[index], findings[nextIndex]] = [findings[nextIndex], findings[index]];
    setAudit((current) => ({ ...current, findings }));
    setSaved(false);
  }

  const stats = useMemo(
    () => [
      { label: "Findings", value: audit.findings.length.toString().padStart(2, "0") },
      { label: "Categories", value: categoryCount.toString().padStart(2, "0") },
      { label: "Approved", value: `${completion}%` },
    ],
    [audit.findings.length, categoryCount, completion],
  );

  return (
    <main>
      <aside className="sidebar">
        <div className="brand-mark"><span>BA</span><strong>BrandAudit</strong></div>
        <div className="sidebar-label">Workspace</div>
        <nav className="nav-list" aria-label="Primary navigation">
          <button className={activeView === "workspace" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("workspace")}><span>◈</span> Audit workspace</button>
          <button className={activeView === "report" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("report")}><span>▤</span> Report preview</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="storage-note"><span className="status-dot" /> Local draft storage<div>Saved in this browser</div></div>
          <div className="user-chip"><span className="avatar">MC</span><div><strong>My workspace</strong><small>Solo designer</small></div><span className="more">···</span></div>
        </div>
      </aside>

      <section className="app-shell">
        <header className="topbar">
          <div><span className="eyebrow">CURRENT AUDIT</span><h1>{audit.brandName || "Untitled audit"}</h1></div>
          <div className="top-actions"><span className="draft-state"><span className="status-dot" /> {saved ? "Saved just now" : "Unsaved changes"}</span><button className="button button-quiet" onClick={() => window.print()}>Export / print <span>↗</span></button><button className="button button-dark" onClick={saveAudit}>Save audit</button></div>
        </header>

        <div className="content">
          {activeView === "workspace" ? (
            <>
              <section className="welcome-row"><div><p className="eyebrow">AUDIT WORKSPACE / 01</p><h2>A sharper view of <em>what matters.</em></h2><p className="intro">Turn considered observations into a clear, confident direction for {audit.clientName || "your client"}.</p></div><div className="progress-card"><div className="progress-heading"><span>Report readiness</span><strong>{completion}%</strong></div><div className="progress-track"><div style={{ width: `${completion}%` }} /></div><small>{approvedCount} of {audit.findings.length} findings approved</small></div></section>
              <div className="stats-row">{stats.map((stat) => <div className="stat" key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}<div className="stat stat-note"><span>Last edited</span><strong>Today, 09:42</strong></div></div>

              <div className="workspace-grid">
                <section className="panel project-panel">
                  <div className="panel-heading"><div><p className="eyebrow">FOUNDATION</p><h3>Brand context</h3></div><span className="step-label">01 / 03</span></div>
                  <div className="field-grid">
                    <label>Client name<input value={audit.clientName} onChange={(e) => updateAudit("clientName", e.target.value)} /></label>
                    <label>Brand name<input value={audit.brandName} onChange={(e) => updateAudit("brandName", e.target.value)} /></label>
                    <label>Website URL<input value={audit.website} onChange={(e) => updateAudit("website", e.target.value)} /></label>
                    <label>Industry<input value={audit.industry} onChange={(e) => updateAudit("industry", e.target.value)} /></label>
                    <label className="full-field">Target audience<textarea rows={2} value={audit.audience} onChange={(e) => updateAudit("audience", e.target.value)} /></label>
                    <label className="full-field">Brand objectives<textarea rows={3} value={audit.objectives} onChange={(e) => updateAudit("objectives", e.target.value)} /></label>
                  </div>
                </section>

                <section className="panel findings-panel">
                  <div className="panel-heading"><div><p className="eyebrow">OBSERVATIONS</p><h3>Findings <span className="count-badge">{audit.findings.length}</span></h3></div><button className="button button-outline" onClick={() => setShowForm(true)}>+ New finding</button></div>
                  <div className="findings-list">
                    {audit.findings.map((finding, index) => <button className={`finding-row ${finding.id === selectedId ? "selected" : ""}`} key={finding.id} onClick={() => setSelectedId(finding.id)}><span className="finding-index">{String(index + 1).padStart(2, "0")}</span><span className="finding-copy"><strong>{finding.title}</strong><small>{finding.category}</small></span><span className={`priority priority-${finding.priority.toLowerCase()}`}>{finding.priority}</span><span className={`mini-status status-${finding.status.toLowerCase()}`} title={finding.status} /></button>)}
                    {audit.findings.length === 0 && <div className="empty-state">No findings yet. Start with the observation that feels most important.</div>}
                  </div>
                </section>
              </div>

              {selectedFinding && <section className="panel editor-panel">
                <div className="panel-heading"><div><p className="eyebrow">EDIT FINDING</p><h3>{selectedFinding.title}</h3></div><div className="editor-actions"><button className="icon-button" onClick={() => moveFinding(-1)} aria-label="Move finding up">↑</button><button className="icon-button" onClick={() => moveFinding(1)} aria-label="Move finding down">↓</button><button className="delete-button" onClick={deleteFinding}>Delete finding</button></div></div>
                <div className="editor-grid">
                  <label>Finding title<input value={selectedFinding.title} onChange={(e) => updateFinding("title", e.target.value)} /></label>
                  <label>Category<select value={selectedFinding.category} onChange={(e) => updateFinding("category", e.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                  <label className="full-field">Observation <span className="ai-hint">AI assist available</span><textarea rows={4} value={selectedFinding.observation} onChange={(e) => updateFinding("observation", e.target.value)} /></label>
                  <label>Business / communication impact<textarea rows={4} value={selectedFinding.impact} onChange={(e) => updateFinding("impact", e.target.value)} /></label>
                  <label>Recommendation<textarea rows={4} value={selectedFinding.recommendation} onChange={(e) => updateFinding("recommendation", e.target.value)} /></label>
                  <label>Priority<select value={selectedFinding.priority} onChange={(e) => updateFinding("priority", e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></label>
                  <label>Status<select value={selectedFinding.status} onChange={(e) => updateFinding("status", e.target.value)}><option>Draft</option><option>Reviewed</option><option>Approved</option></select></label>
                </div>
              </section>}
            </>
          ) : <ReportPreview audit={audit} />}
        </div>
      </section>

      {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><form className="modal" onSubmit={addFinding}><div className="panel-heading"><div><p className="eyebrow">NEW OBSERVATION</p><h3>Add a finding</h3></div><button type="button" className="close-button" onClick={() => setShowForm(false)} aria-label="Close">×</button></div><label>Finding title<input autoFocus required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. The brand voice shifts between touchpoints" /></label><label>Category<select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Observation<textarea required rows={5} value={draft.observation} onChange={(e) => setDraft({ ...draft, observation: e.target.value })} placeholder="What are you seeing? Keep this grounded in supplied evidence." /></label><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="button button-dark">Add finding</button></div></form></div>}
    </main>
  );
}

function ReportPreview({ audit }: { audit: Audit }) {
  return <div className="report-wrap"><div className="report-toolbar"><div><p className="eyebrow">REPORT PREVIEW</p><h2>Editorial report</h2></div><button className="button button-dark" onClick={() => window.print()}>Print report ↗</button></div><article className="report-page"><div className="report-cover"><span className="report-kicker">BRAND AUDIT / 2025</span><div><div className="report-monogram">BA</div><h1>{audit.brandName || "Untitled"}<br /><em>in focus.</em></h1><p>A considered review of the brand&apos;s current expression, opportunities, and next direction.</p></div><div className="cover-meta"><span>Prepared for</span><strong>{audit.clientName || "Client name"}</strong><span>{audit.website}</span></div></div><div className="report-section"><span className="report-number">01</span><div><p className="eyebrow">EXECUTIVE VIEW</p><h2>A foundation with room<br />to become <em>recognisable.</em></h2><p className="report-lede">{audit.objectives || "This report brings the most important observations into focus, with practical recommendations for the next stage of the brand."}</p></div></div><div className="report-section findings-report"><div><p className="eyebrow">SELECTED FINDINGS</p><h2>What we noticed.</h2></div>{audit.findings.filter((finding) => finding.status === "Approved" || audit.findings.length < 3).map((finding, index) => <div className="report-finding" key={finding.id}><span>{String(index + 1).padStart(2, "0")}</span><div><p className="report-category">{finding.category}</p><h3>{finding.title}</h3><p>{finding.observation}</p><div className="recommendation"><strong>Direction</strong><p>{finding.recommendation}</p></div></div><b className={`priority priority-${finding.priority.toLowerCase()}`}>{finding.priority}</b></div>)}</div><footer><span>BrandAudit</span><span>{audit.brandName} / Confidential</span><span>01</span></footer></article></div>;
}
