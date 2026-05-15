import { useState } from "react";

const DOC_TYPES = [
  {
    id: "demand",
    label: "Demand Letter",
    icon: "⚖️",
    desc: "Formal payment or action demand",
    premium: false,
    fields: [
      { key: "senderName", label: "Your Full Name / Business", type: "text" },
      { key: "recipientName", label: "Recipient Name / Business", type: "text" },
      { key: "amount", label: "Amount Owed ($)", type: "text" },
      { key: "dueDate", label: "Original Due Date", type: "text" },
      { key: "description", label: "Description of What's Owed", type: "textarea" },
      { key: "deadline", label: "Response Deadline (e.g. 10 days)", type: "text" },
    ],
  },
  {
    id: "smallclaims",
    label: "Small Claims Prep",
    icon: "🏛️",
    desc: "Organize your case for court",
    premium: false,
    fields: [
      { key: "plaintiffName", label: "Plaintiff (Your) Name", type: "text" },
      { key: "defendantName", label: "Defendant Name", type: "text" },
      { key: "claimAmount", label: "Claim Amount ($)", type: "text" },
      { key: "incidentDate", label: "Date of Incident", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "facts", label: "Facts of the Case", type: "textarea" },
      { key: "evidence", label: "Evidence You Have (list)", type: "textarea" },
    ],
  },
  {
    id: "contractor",
    label: "Contractor Dispute",
    icon: "🔨",
    desc: "Dispute poor work or non-completion",
    premium: false,
    fields: [
      { key: "homeownerName", label: "Your Name", type: "text" },
      { key: "contractorName", label: "Contractor Name / Company", type: "text" },
      { key: "projectDesc", label: "Project Description", type: "textarea" },
      { key: "contractDate", label: "Contract Date", type: "text" },
      { key: "amountPaid", label: "Amount Already Paid ($)", type: "text" },
      { key: "issues", label: "Issues / Defects / Incomplete Work", type: "textarea" },
      { key: "remedy", label: "Requested Remedy", type: "text" },
    ],
  },
  {
    id: "ceasedesist",
    label: "Cease & Desist",
    icon: "🛑",
    desc: "Stop harassment, infringement, or nuisance",
    premium: true,
    fields: [
      { key: "senderName", label: "Your Name / Business", type: "text" },
      { key: "recipientName", label: "Recipient Name", type: "text" },
      { key: "behavior", label: "Behavior to Cease", type: "textarea" },
      { key: "legalBasis", label: "Legal Basis (e.g. harassment, trespass)", type: "text" },
      { key: "priorNotice", label: "Prior Notices Given?", type: "text" },
      { key: "consequences", label: "Consequences if Not Complied", type: "textarea" },
    ],
  },
  {
    id: "credit",
    label: "Credit Dispute",
    icon: "💳",
    desc: "Dispute errors on your credit report",
    premium: true,
    fields: [
      { key: "consumerName", label: "Your Full Name", type: "text" },
      { key: "address", label: "Your Address", type: "text" },
      { key: "bureau", label: "Credit Bureau (Equifax / Experian / TransUnion)", type: "text" },
      { key: "accountName", label: "Creditor / Account Name", type: "text" },
      { key: "accountNumber", label: "Account Number (partial ok)", type: "text" },
      { key: "errorDesc", label: "Description of the Error", type: "textarea" },
      { key: "correctionRequested", label: "What Correction You're Requesting", type: "textarea" },
    ],
  },
  {
    id: "hoa",
    label: "HOA Dispute",
    icon: "🏘️",
    desc: "Respond to or file HOA complaints",
    premium: true,
    fields: [
      { key: "residentName", label: "Your Name", type: "text" },
      { key: "hoaName", label: "HOA Name", type: "text" },
      { key: "propertyAddress", label: "Property Address", type: "text" },
      { key: "issue", label: "Nature of Dispute", type: "textarea" },
      { key: "rulesCited", label: "Rules or Bylaws Referenced", type: "text" },
      { key: "requestedAction", label: "Action You're Requesting", type: "textarea" },
    ],
  },
  {
    id: "security",
    label: "Security Deposit",
    icon: "🔑",
    desc: "Demand return of security deposit",
    premium: false,
    fields: [
      { key: "tenantName", label: "Your (Tenant) Name", type: "text" },
      { key: "landlordName", label: "Landlord / Property Manager", type: "text" },
      { key: "propertyAddress", label: "Rental Property Address", type: "text" },
      { key: "moveOutDate", label: "Move-Out Date", type: "text" },
      { key: "depositAmount", label: "Deposit Amount ($)", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "condition", label: "Condition Left (describe)", type: "textarea" },
    ],
  },
];

const PRICING = {
  payPerDoc: { free: 0, premium: 1.99 },
  subscription: { monthly: 9.99, annual: 79.99 },
};

export default function App() {
  const [screen, setScreen] = useState("home"); // home | select | form | preview | pricing
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formData, setFormData] = useState({});
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [loading, setLoading] = useState(false);
  const [pricingTab, setPricingTab] = useState("payper");
  const [subscribed, setSubscribed] = useState(false);
  const [purchased, setPurchased] = useState([]);

  const isUnlocked = (doc) => subscribed || purchased.includes(doc.id) || !doc.premium;

  const handleSelect = (doc) => {
    setSelectedDoc(doc);
    setFormData({});
    setGeneratedDoc("");
    setScreen("form");
  };

  const handleGenerate = async () => {
    if (!isUnlocked(selectedDoc)) {
      setScreen("pricing");
      return;
    }
    setLoading(true);
    setScreen("preview");

    const fieldSummary = selectedDoc.fields
      .map((f) => `${f.label}: ${formData[f.key] || "N/A"}`)
      .join("\n");

    const prompt = `You are a professional legal document drafter. Generate a formal, professional ${selectedDoc.label} document based on the following information:\n\n${fieldSummary}\n\nFormat it as a proper legal letter with today's date, proper salutation, body paragraphs, and closing. Use firm but professional language. Include relevant legal references where appropriate. Do not include any explanation—only the document itself.`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const text = data.content?.find((b) => b.type === "text")?.text || "Error generating document.";
      setGeneratedDoc(text);
    } catch {
      setGeneratedDoc("Error generating document. Please try again.");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDoc);
  };

  const handlePurchase = (docId) => {
    setPurchased((p) => [...p, docId]);
    setScreen("form");
  };

  const handleSubscribe = () => {
    setSubscribed(true);
    setScreen("select");
  };

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo} onClick={() => setScreen("home")}>
            <span style={styles.logoIcon}>⚖</span>
            <span style={styles.logoText}>DocRight</span>
            <span style={styles.logoBadge}>AI</span>
          </div>
          <nav style={styles.nav}>
            <button style={styles.navBtn} onClick={() => setScreen("select")}>Documents</button>
            <button style={styles.navBtn} onClick={() => setScreen("pricing")}>Pricing</button>
            {subscribed && <span style={styles.proBadge}>PRO</span>}
          </nav>
        </div>
      </header>

      <main style={styles.main}>
        {/* HOME */}
        {screen === "home" && (
          <div style={styles.hero}>
            <div style={styles.heroTag}>AI-Powered Legal Documents</div>
            <h1 style={styles.heroTitle}>
              Legal Documents.<br />
              <span style={styles.heroAccent}>Written in Seconds.</span>
            </h1>
            <p style={styles.heroSub}>
              Professional demand letters, cease & desist, small claims prep, credit disputes,
              and more — generated by AI, tailored to your situation.
            </p>
            <div style={styles.heroActions}>
              <button style={styles.btnPrimary} onClick={() => setScreen("select")}>
                Generate a Document →
              </button>
              <button style={styles.btnGhost} onClick={() => setScreen("pricing")}>
                View Pricing
              </button>
            </div>
            <div style={styles.docGrid}>
              {DOC_TYPES.map((d) => (
                <div key={d.id} style={styles.docChip}>
                  <span>{d.icon}</span> {d.label}
                  {d.premium && <span style={styles.chipBadge}>PRO</span>}
                </div>
              ))}
            </div>
            <div style={styles.trustBar}>
              <span>✅ No account required</span>
              <span>✅ Texas & all 50 states</span>
              <span>✅ Instant generation</span>
            </div>
          </div>
        )}

        {/* SELECT DOC */}
        {screen === "select" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Choose Document Type</h2>
            <p style={styles.sectionSub}>Select the document you need generated</p>
            <div style={styles.cardGrid}>
              {DOC_TYPES.map((doc) => (
                <div
                  key={doc.id}
                  style={{ ...styles.docCard, ...(isUnlocked(doc) ? {} : styles.docCardLocked) }}
                  onClick={() => handleSelect(doc)}
                >
                  <div style={styles.docCardIcon}>{doc.icon}</div>
                  <div style={styles.docCardLabel}>{doc.label}</div>
                  <div style={styles.docCardDesc}>{doc.desc}</div>
                  {doc.premium && !isUnlocked(doc) && (
                    <div style={styles.lockBadge}>🔒 PRO</div>
                  )}
                  {isUnlocked(doc) && <div style={styles.freeBadge}>FREE</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FORM */}
        {screen === "form" && selectedDoc && (
          <div style={styles.section}>
            <button style={styles.backBtn} onClick={() => setScreen("select")}>← Back</button>
            <div style={styles.formCard}>
              <div style={styles.formHeader}>
                <span style={styles.formIcon}>{selectedDoc.icon}</span>
                <div>
                  <h2 style={styles.formTitle}>{selectedDoc.label}</h2>
                  <p style={styles.formSub}>{selectedDoc.desc}</p>
                </div>
              </div>
              <div style={styles.fields}>
                {selectedDoc.fields.map((f) => (
                  <div key={f.key} style={styles.fieldGroup}>
                    <label style={styles.label}>{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea
                        style={styles.textarea}
                        value={formData[f.key] || ""}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        rows={3}
                        placeholder={`Enter ${f.label.toLowerCase()}...`}
                      />
                    ) : (
                      <input
                        style={styles.input}
                        type="text"
                        value={formData[f.key] || ""}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        placeholder={`Enter ${f.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button style={styles.btnPrimary} onClick={handleGenerate}>
                {isUnlocked(selectedDoc) ? "Generate Document →" : "🔒 Unlock & Generate →"}
              </button>
              {!isUnlocked(selectedDoc) && (
                <p style={styles.unlockNote}>
                  This is a PRO document. One-time unlock: $1.99 or subscribe for $9.99/mo
                </p>
              )}
            </div>
          </div>
        )}

        {/* PREVIEW */}
        {screen === "preview" && (
          <div style={styles.section}>
            <button style={styles.backBtn} onClick={() => setScreen("form")}>← Edit</button>
            <div style={styles.previewCard}>
              <div style={styles.previewHeader}>
                <h2 style={styles.previewTitle}>{selectedDoc?.icon} {selectedDoc?.label}</h2>
                <div style={styles.previewActions}>
                  <button style={styles.btnSmall} onClick={handleCopy}>📋 Copy</button>
                  <button style={styles.btnSmall} onClick={() => window.print()}>🖨️ Print</button>
                  <button style={styles.btnSmallPrimary} onClick={() => setScreen("select")}>+ New Doc</button>
                </div>
              </div>
              {loading ? (
                <div style={styles.loadingArea}>
                  <div style={styles.spinner} />
                  <p style={styles.loadingText}>Drafting your document...</p>
                </div>
              ) : (
                <pre style={styles.docOutput}>{generatedDoc}</pre>
              )}
            </div>
          </div>
        )}

        {/* PRICING */}
        {screen === "pricing" && (
          <div style={styles.section}>
            <button style={styles.backBtn} onClick={() => setScreen(selectedDoc ? "form" : "home")}>← Back</button>
            <h2 style={styles.sectionTitle}>Simple Pricing</h2>
            <p style={styles.sectionSub}>Pay once per doc, or subscribe for unlimited access</p>
            <div style={styles.pricingTabs}>
              <button
                style={{ ...styles.tabBtn, ...(pricingTab === "payper" ? styles.tabActive : {}) }}
                onClick={() => setPricingTab("payper")}
              >Pay Per Document</button>
              <button
                style={{ ...styles.tabBtn, ...(pricingTab === "sub" ? styles.tabActive : {}) }}
                onClick={() => setPricingTab("sub")}
              >Subscription</button>
            </div>

            {pricingTab === "payper" && (
              <div style={styles.pricingGrid}>
                <div style={styles.pricingCard}>
                  <div style={styles.pricingIcon}>📄</div>
                  <h3 style={styles.pricingName}>Free Documents</h3>
                  <div style={styles.pricingPrice}>$0</div>
                  <ul style={styles.pricingList}>
                    <li>✅ Demand Letters</li>
                    <li>✅ Small Claims Prep</li>
                    <li>✅ Contractor Dispute</li>
                    <li>✅ Security Deposit</li>
                  </ul>
                  <button style={styles.btnPrimary} onClick={() => setScreen("select")}>Get Started Free</button>
                </div>
                <div style={{ ...styles.pricingCard, ...styles.pricingCardFeatured }}>
                  <div style={styles.featuredTag}>MOST POPULAR</div>
                  <div style={styles.pricingIcon}>⭐</div>
                  <h3 style={styles.pricingName}>PRO Documents</h3>
                  <div style={styles.pricingPrice}>$1.99 <span style={styles.pricingPer}>/ doc</span></div>
                  <ul style={styles.pricingList}>
                    <li>✅ Cease & Desist</li>
                    <li>✅ Credit Dispute</li>
                    <li>✅ HOA Dispute</li>
                    <li>✅ One-time unlock</li>
                  </ul>
                  {selectedDoc?.premium ? (
                    <button style={styles.btnPrimary} onClick={() => handlePurchase(selectedDoc.id)}>
                      Unlock {selectedDoc.label}
                    </button>
                  ) : (
                    <button style={styles.btnPrimary} onClick={() => setScreen("select")}>
                      Choose a PRO Doc
                    </button>
                  )}
                </div>
              </div>
            )}

            {pricingTab === "sub" && (
              <div style={styles.pricingGrid}>
                <div style={styles.pricingCard}>
                  <div style={styles.pricingIcon}>🗓️</div>
                  <h3 style={styles.pricingName}>Monthly</h3>
                  <div style={styles.pricingPrice}>$9.99 <span style={styles.pricingPer}>/ mo</span></div>
                  <ul style={styles.pricingList}>
                    <li>✅ All document types</li>
                    <li>✅ Unlimited generations</li>
                    <li>✅ Priority support</li>
                    <li>✅ New docs added monthly</li>
                  </ul>
                  <button style={styles.btnPrimary} onClick={handleSubscribe}>Subscribe Monthly</button>
                </div>
                <div style={{ ...styles.pricingCard, ...styles.pricingCardFeatured }}>
                  <div style={styles.featuredTag}>BEST VALUE</div>
                  <div style={styles.pricingIcon}>🏆</div>
                  <h3 style={styles.pricingName}>Annual</h3>
                  <div style={styles.pricingPrice}>$79.99 <span style={styles.pricingPer}>/ yr</span></div>
                  <div style={styles.savingsBadge}>Save $40/year</div>
                  <ul style={styles.pricingList}>
                    <li>✅ Everything in Monthly</li>
                    <li>✅ 2 months free</li>
                    <li>✅ Early access to new docs</li>
                  </ul>
                  <button style={styles.btnPrimary} onClick={handleSubscribe}>Subscribe Annually</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>DocRight AI · For informational purposes only. Not a substitute for legal advice.</p>
      </footer>
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#0a0f1e", color: "#e8eaf6", fontFamily: "'Georgia', 'Times New Roman', serif", display: "flex", flexDirection: "column" },
  header: { background: "rgba(10,15,30,0.95)", borderBottom: "1px solid rgba(212,175,55,0.2)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(10px)" },
  headerInner: { maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
  logoIcon: { fontSize: 22, color: "#d4af37" },
  logoText: { fontSize: 22, fontWeight: "bold", color: "#fff", letterSpacing: 1 },
  logoBadge: { background: "#d4af37", color: "#0a0f1e", fontSize: 10, fontWeight: "bold", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" },
  nav: { display: "flex", alignItems: "center", gap: 20 },
  navBtn: { background: "none", border: "none", color: "#a0a8c0", cursor: "pointer", fontSize: 14, letterSpacing: 0.5 },
  proBadge: { background: "#d4af37", color: "#0a0f1e", fontSize: 11, fontWeight: "bold", padding: "3px 8px", borderRadius: 4 },
  main: { flex: 1, maxWidth: 1100, margin: "0 auto", width: "100%", padding: "0 24px" },

  hero: { textAlign: "center", padding: "80px 0 60px" },
  heroTag: { display: "inline-block", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", fontSize: 12, letterSpacing: 2, padding: "6px 16px", borderRadius: 20, marginBottom: 24, textTransform: "uppercase" },
  heroTitle: { fontSize: 52, fontWeight: "bold", lineHeight: 1.15, marginBottom: 20, color: "#fff" },
  heroAccent: { color: "#d4af37" },
  heroSub: { fontSize: 18, color: "#8892b0", maxWidth: 600, margin: "0 auto 36px", lineHeight: 1.7 },
  heroActions: { display: "flex", gap: 16, justifyContent: "center", marginBottom: 48 },
  docGrid: { display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 40 },
  docChip: { display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 14px", borderRadius: 20, fontSize: 13, color: "#c0c8e0" },
  chipBadge: { background: "#d4af37", color: "#0a0f1e", fontSize: 9, fontWeight: "bold", padding: "1px 5px", borderRadius: 3 },
  trustBar: { display: "flex", gap: 32, justifyContent: "center", color: "#606880", fontSize: 13 },

  section: { padding: "48px 0" },
  sectionTitle: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  sectionSub: { color: "#8892b0", marginBottom: 36, fontSize: 16 },

  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },
  docCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "24px 20px", cursor: "pointer", transition: "all 0.2s", position: "relative", hover: {} },
  docCardLocked: { opacity: 0.7 },
  docCardIcon: { fontSize: 32, marginBottom: 10 },
  docCardLabel: { fontSize: 15, fontWeight: "bold", color: "#e0e4f0", marginBottom: 6 },
  docCardDesc: { fontSize: 13, color: "#7080a0" },
  lockBadge: { position: "absolute", top: 12, right: 12, background: "rgba(212,175,55,0.15)", color: "#d4af37", fontSize: 10, padding: "3px 8px", borderRadius: 4 },
  freeBadge: { position: "absolute", top: 12, right: 12, background: "rgba(72,200,120,0.15)", color: "#48c878", fontSize: 10, padding: "3px 8px", borderRadius: 4 },

  backBtn: { background: "none", border: "none", color: "#d4af37", cursor: "pointer", fontSize: 14, marginBottom: 24, padding: 0 },
  formCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "32px" },
  formHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)" },
  formIcon: { fontSize: 36 },
  formTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  formSub: { color: "#7080a0", fontSize: 14 },
  fields: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, marginBottom: 28 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: "#a0a8c0", letterSpacing: 0.5, textTransform: "uppercase" },
  input: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", color: "#e0e4f0", fontSize: 14, outline: "none" },
  textarea: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", color: "#e0e4f0", fontSize: 14, outline: "none", resize: "vertical" },
  unlockNote: { textAlign: "center", color: "#d4af37", fontSize: 13, marginTop: 12 },

  previewCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "32px" },
  previewHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: 12 },
  previewTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  previewActions: { display: "flex", gap: 10 },
  docOutput: { whiteSpace: "pre-wrap", fontFamily: "'Georgia', serif", fontSize: 14, lineHeight: 1.8, color: "#c8d0e8", background: "rgba(0,0,0,0.2)", padding: 24, borderRadius: 8 },
  loadingArea: { textAlign: "center", padding: "60px 0" },
  spinner: { width: 40, height: 40, border: "3px solid rgba(212,175,55,0.2)", borderTop: "3px solid #d4af37", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" },
  loadingText: { color: "#8892b0" },

  pricingTabs: { display: "flex", gap: 0, marginBottom: 36, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4, width: "fit-content" },
  tabBtn: { background: "none", border: "none", color: "#8892b0", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  tabActive: { background: "#d4af37", color: "#0a0f1e", fontWeight: "bold" },
  pricingGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, maxWidth: 700 },
  pricingCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "32px", position: "relative" },
  pricingCardFeatured: { border: "1px solid rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.05)" },
  featuredTag: { position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#d4af37", color: "#0a0f1e", fontSize: 10, fontWeight: "bold", padding: "4px 12px", borderRadius: 10, letterSpacing: 1, whiteSpace: "nowrap" },
  pricingIcon: { fontSize: 32, marginBottom: 12 },
  pricingName: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  pricingPrice: { fontSize: 36, fontWeight: "bold", color: "#d4af37", marginBottom: 20 },
  pricingPer: { fontSize: 16, color: "#8892b0" },
  pricingList: { listStyle: "none", padding: 0, marginBottom: 24, display: "flex", flexDirection: "column", gap: 10, color: "#a0a8c0", fontSize: 14 },
  savingsBadge: { display: "inline-block", background: "rgba(72,200,120,0.15)", color: "#48c878", fontSize: 12, padding: "4px 10px", borderRadius: 6, marginBottom: 16 },

  btnPrimary: { background: "#d4af37", color: "#0a0f1e", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, width: "100%" },
  btnGhost: { background: "transparent", color: "#d4af37", border: "1px solid rgba(212,175,55,0.4)", padding: "12px 28px", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15 },
  btnSmall: { background: "rgba(255,255,255,0.08)", color: "#c0c8e0", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  btnSmallPrimary: { background: "#d4af37", color: "#0a0f1e", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "bold" },

  footer: { borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", textAlign: "center" },
  footerText: { color: "#404860", fontSize: 12 },
};
