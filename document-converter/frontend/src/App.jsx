import React, { useRef, useState } from "react";
import { FileText, FileType2, Presentation, ShieldCheck, UploadCloud, Download, ArrowRight, CheckCircle2, LoaderCircle, RefreshCw, LockKeyhole, Zap } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const tools = [
  { id: "pdf-to-word", title: "PDF to Word", description: "Turn PDF documents into editable Word files.", input: ".pdf", output: "DOCX", icon: FileText, color: "blue" },
  { id: "word-to-pdf", title: "Word to PDF", description: "Share polished documents with consistent formatting.", input: ".docx", output: "PDF", icon: FileType2, color: "red" },
  { id: "pdf-to-ppt", title: "PDF to PowerPoint", description: "Turn every PDF page into a presentation slide.", input: ".pdf", output: "PPTX", icon: Presentation, color: "purple" }
];

export default function App() {
  const [active, setActive] = useState(tools[0]);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef(null);

  function chooseTool(tool) {
    setActive(tool); setFile(null); setError(""); setSuccess("");
    if (inputRef.current) inputRef.current.value = "";
  }
  function acceptFile(candidate) {
    setError(""); setSuccess("");
    if (!candidate) return;
    const extension = candidate.name.slice(candidate.name.lastIndexOf(".")).toLowerCase();
    if (extension !== active.input) {
      setFile(null);
      setError(`Please choose a ${active.input} file for this conversion.`);
      return;
    }
    if (candidate.size > 20 * 1024 * 1024) {
      setFile(null); setError("File is larger than the 20 MB upload limit."); return;
    }
    setFile(candidate);
  }
  async function convert() {
    if (!file || busy) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch(`${API_URL}/api/conversions/${active.id}`, { method: "POST", body: data });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Conversion failed. Please try another file.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `converted.${active.output.toLowerCase()}`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSuccess("Your converted file is ready and the download has started.");
    } catch (e) {
      setError(e.message || "Could not reach the conversion server. Check that the API is running.");
    } finally { setBusy(false); }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" aria-label="DocuFlow home"><span className="brand-mark"><FileText size={22}/></span><span>docuflow<span className="brand-dot">.</span></span></a>
      <nav><a href="#tools">Converters</a><a href="#how-it-works">How it works</a><a href="#privacy">Privacy</a></nav>
      <span className="secure-label"><ShieldCheck size={16}/> Secure conversion</span>
    </header>

    <main>
      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-dot"/> DOCUMENT TOOLS, MADE SIMPLE</div>
        <h1>Your files, <span>in the right format.</span></h1>
        <p className="hero-copy">Convert documents in seconds. Straightforward tools for PDFs, Word documents, and presentations — all in one place.</p>
        <div className="trust-row"><span><CheckCircle2 size={16}/> Easy to use</span><span><LockKeyhole size={16}/> Temporary file handling</span><span><Zap size={16}/> Fast conversion</span></div>
      </section>

      <section className="workspace" id="tools">
        <div className="section-heading"><div><span className="small-label">CHOOSE YOUR TOOL</span><h2>What would you like to convert?</h2></div><span className="format-pill">3 tools available</span></div>
        <div className="tool-grid">
          {tools.map(tool => { const Icon = tool.icon; return <button key={tool.id} className={`tool-card ${active.id === tool.id ? "selected" : ""}`} onClick={() => chooseTool(tool)} aria-pressed={active.id === tool.id}>
            <span className={`tool-icon ${tool.color}`}><Icon size={23}/></span><span className="tool-title">{tool.title}</span><span className="tool-description">{tool.description}</span><span className="tool-footer"><span>{tool.input.toUpperCase()} <ArrowRight size={13}/> {tool.output}</span><span className="select-circle">{active.id === tool.id ? <CheckCircle2 size={18}/> : <ArrowRight size={16}/>}</span></span>
          </button>; })}
        </div>

        <div className="upload-panel">
          <div className="upload-panel-heading"><div><span className="small-label">STEP 1</span><h3>Upload your document</h3></div><span className="limit-label">Maximum file size: 20 MB</span></div>
          <div className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`} onDragOver={e => {e.preventDefault(); setDragging(true);}} onDragLeave={() => setDragging(false)} onDrop={e => {e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0]);}}>
            <input ref={inputRef} type="file" accept={active.input} onChange={e => acceptFile(e.target.files?.[0])} hidden />
            {file ? <><span className="upload-symbol file-ready"><CheckCircle2 size={27}/></span><strong className="filename">{file.name}</strong><span className="file-meta">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to convert</span><button className="text-button" onClick={() => {setFile(null); if(inputRef.current) inputRef.current.value="";}}>Choose a different file</button></> : <><span className="upload-symbol"><UploadCloud size={28}/></span><strong>Drag and drop your file here</strong><span className="drop-subtitle">or browse files from your computer</span><button className="browse-button" onClick={() => inputRef.current?.click()}>Browse files</button><span className="supported">Supported format: {active.input.toUpperCase()}</span></>}
          </div>
          {error && <div className="message error" role="alert">{error}</div>}
          {success && <div className="message success" role="status">{success}</div>}
          <button className="convert-button" disabled={!file || busy} onClick={convert}>{busy ? <><LoaderCircle className="spin" size={18}/> Converting your file…</> : <>Convert to {active.output} <ArrowRight size={18}/></>}</button>
          <p className="disclaimer"><LockKeyhole size={13}/> Your file is processed by the server. Avoid uploading confidential documents to a demo deployment.</p>
        </div>
      </section>

      <section className="steps-section" id="how-it-works"><div className="center-heading"><span className="small-label">THREE SIMPLE STEPS</span><h2>From upload to download</h2><p>No complicated setup. Just choose, convert, and continue working.</p></div><div className="steps-grid"><div className="step"><span className="step-number">01</span><div className="step-icon"><UploadCloud/></div><h3>Choose your file</h3><p>Select a PDF or Word document from your device.</p></div><div className="step"><span className="step-number">02</span><div className="step-icon"><RefreshCw/></div><h3>Convert it</h3><p>Our conversion engine processes your document.</p></div><div className="step"><span className="step-number">03</span><div className="step-icon"><Download/></div><h3>Download the result</h3><p>Save your converted file and use it wherever you need.</p></div></div></section>

      <section className="privacy-band" id="privacy"><span className="privacy-icon"><ShieldCheck size={25}/></span><div><h3>Privacy should come first.</h3><p>Files are stored temporarily for conversion and scheduled for deletion. For real public use, run isolated conversion workers and enforce automatic cleanup.</p></div></section>
    </main>
    <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><FileText size={18}/></span><span>docuflow<span className="brand-dot">.</span></span></a><span>Document conversion, made simpler.</span><span>© {new Date().getFullYear()} DocuFlow</span></footer>
  </div>;
}
