import React, { useState, useEffect } from 'react';
import {
  Search, MessageSquare, X, ChevronRight, ChevronLeft,
  User, Bot, Download, Copy, Check, Star, Filter, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getWooAISessions } from '@/api/api';
import './Chatlogs.css';

/* ── Helpers ── */

/* ── Helpers ── */
const initials = name => name.split(' ').map(w=>w[0]).join('');

const StatusBadge = ({ s }) => {
  const map = { resolved:'green', escalated:'red', pending:'amber' };
  return <span className={`cl-badge ${map[s]||'gray'}`}>{s}</span>;
};

const Stars = ({ n, size='sm' }) =>
  n==null
    ? <span style={{color:'#9ca3af',fontSize:11}}>—</span>
    : <span className={`cl-stars cl-stars--${size}`}>
        {'★'.repeat(n)}{'☆'.repeat(5-n)}
      </span>;

/* ── Toast ── */
const Toast = ({ msg, type, onDone }) => {
  React.useEffect(()=>{ const t=setTimeout(onDone,2400); return ()=>clearTimeout(t); },[]);
  const cfg = {
    success:['#f0fdf4','#16a34a','#bbf7d0','✓'],
    error:  ['#fee2e2','#dc2626','#fecaca','✕'],
    info:   ['#dbeafe','#2563eb','#bfdbfe','ℹ'],
  };
  const [bg,fg,bd,ico] = cfg[type]||cfg.info;
  return (
    <div className="cl-toast" style={{background:bg,color:fg,border:`1px solid ${bd}`}}>
      {ico} {msg}
    </div>
  );
};

export default function ChatLogs() {
  const [LOGS,          setLOGS]        = useState([]);
  const [loading,       setLoading]     = useState(true);
  const [search,        setSearch]      = useState('');
  const [statusFilter,  setStatus]      = useState('all');
  const [csatFilter,    setCsatFilter]  = useState('all');
  const [agentFilter,   setAgentFilter] = useState('all');
  const [showFilters,   setShowFilters] = useState(false);
  const [selected,      setSelected]    = useState(null);
  const [copied,        setCopied]      = useState(false);
  const [toast,         setToast]       = useState(null);
  
  useEffect(() => {
    fetchSessions();
  }, []);
  
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await getWooAISessions(50);
      const sessions = Array.isArray(res) ? res : [];
      const formatted = sessions.map(s => ({
        id: s.sessionId || `#${s.id}`,
        user: s.userName || 'Unknown',
        email: '',
        intent: s.intent || 'General',
        status: s.status ? s.status.toLowerCase() : 'pending',
        agent: s.agent || 'AI Bot',
        msgs: (s.messages || []).length,
        duration: s.startTime && s.endTime
          ? Math.round((new Date(s.endTime) - new Date(s.startTime)) / 1000) + 's'
          : '—',
        date: s.startTime ? new Date(s.startTime).toLocaleString() : '—',
        csat: null,
        messages: (s.messages || []).map(m => ({
          role: m.role ? m.role.toLowerCase() : 'bot',
          text: m.content || ''
        }))
      }));
      setLOGS(formatted);
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
      setLOGS([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type='success') => setToast({ msg, type });

  /* mobile detection */
  const [isMobile, setIsMobile] = React.useState(
    ()=> typeof window!=='undefined' && window.innerWidth<900
  );
  React.useEffect(()=>{
    const h = ()=>setIsMobile(window.innerWidth<900);
    window.addEventListener('resize',h);
    return ()=>window.removeEventListener('resize',h);
  },[]);

  /* ── KPIs (live from LOGS) ── */
  const ratedLogs = LOGS.filter(l=>l.csat);
  const avgCsat   = ratedLogs.length
    ? (ratedLogs.reduce((s,l)=>s+l.csat,0)/ratedLogs.length).toFixed(1)
    : '—';

  const allAgents = ['all',...[...new Set(LOGS.map(l=>l.agent))]];

  /* ── Filtered list ── */
  const filtered = LOGS.filter(l=>{
    const mStatus = statusFilter==='all' || l.status===statusFilter;
    const mSearch = l.user.toLowerCase().includes(search.toLowerCase()) ||
                    l.intent.toLowerCase().includes(search.toLowerCase()) ||
                    l.id.toLowerCase().includes(search.toLowerCase()) ||
                    l.email.toLowerCase().includes(search.toLowerCase());
    const mCsat   = csatFilter==='all'  ? true
                  : csatFilter==='none' ? l.csat==null
                  : l.csat===Number(csatFilter);
    const mAgent  = agentFilter==='all' || l.agent===agentFilter;
    return mStatus && mSearch && mCsat && mAgent;
  });

  const sel = selected ? LOGS.find(l=>l.id===selected) : null;

  /* ── Active filter count ── */
  const activeFilters = (statusFilter!=='all'?1:0)+(csatFilter!=='all'?1:0)+(agentFilter!=='all'?1:0);

  /* ── Export CSV ── */
  const handleExport = () => {
    const rows = [
      ['Session ID','User','Email','Intent','Status','Agent','Messages','Duration','Date','CSAT'],
      ...LOGS.map(l=>[l.id,l.user,l.email,l.intent,l.status,l.agent,l.msgs,l.duration,l.date,l.csat??''])
    ];
    const csv  = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a    = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'chatlogs.csv'});
    a.click(); URL.revokeObjectURL(a.href);
    showToast('Chat logs exported as CSV');
  };

  /* ── Copy transcript ── */
  const copyTranscript = () => {
    if (!sel) return;
    const text = sel.messages.map(m=>`[${m.role.toUpperCase()}] ${m.text}`).join('\n');
    navigator.clipboard?.writeText(text).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false),1800);
    showToast('Transcript copied to clipboard');
  };

  /* ── Clear all filters ── */
  const clearFilters = () => { setStatus('all'); setCsatFilter('all'); setAgentFilter('all'); };

  return (
    <div className="cl-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* ── Header ── */}
      <div className="cl-header">
        <Link to="/admin/wooai/dashboard" className="wooai-back-link"><ArrowLeft size={14}/> Back to Dashboard</Link>
        <div className="cl-header-row">
          <div>
            <h1>Chat Logs</h1>
            <p>Browse and review all WooAI chat session transcripts</p>
          </div>
          <button className="cl-btn-outline" onClick={handleExport}>
            <Download size={13}/> Export CSV
          </button>
        </div>
      </div>

      <div className="cl-body">

        {/* ── Stats ── */}
        <div className="cl-stats">
          <div className="cl-stat">
            <div className="cl-stat-val">{LOGS.length}</div>
            <div className="cl-stat-label">Total Sessions</div>
          </div>
          <div className="cl-stat green">
            <div className="cl-stat-val">{LOGS.filter(l=>l.status==='resolved').length}</div>
            <div className="cl-stat-label">Resolved</div>
          </div>
          <div className="cl-stat red">
            <div className="cl-stat-val">{LOGS.filter(l=>l.status==='escalated').length}</div>
            <div className="cl-stat-label">Escalated</div>
          </div>
          <div className="cl-stat amber">
            <div className="cl-stat-val">{avgCsat}/5</div>
            <div className="cl-stat-label">Avg CSAT</div>
          </div>
        </div>

        {/* ── Split layout ── */}
        <div className={`cl-split ${sel?'has-detail':'no-detail'}`}>

          {/* ── List panel ── */}
          <div style={isMobile&&sel?{display:'none'}:{}} className="cl-list-panel">

            {/* Search + filter row */}
            <div className="cl-search-row">
              <div className="cl-search-wrap">
                <Search size={14}/>
                <input placeholder="Search user, intent, ID or email…"
                  value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <select className="cl-select" value={statusFilter}
                onChange={e=>setStatus(e.target.value)}>
                <option value="all">All status</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
                <option value="pending">Pending</option>
              </select>
              <button
                className={`cl-filter-btn ${showFilters||activeFilters>0?'cl-filter-btn--active':''}`}
                title="More filters"
                onClick={()=>setShowFilters(s=>!s)}>
                <Filter size={13}/>
                {activeFilters>0 && <span className="cl-filter-badge">{activeFilters}</span>}
              </button>
            </div>

            {/* Expanded filter panel */}
            {showFilters && (
              <div className="cl-filter-panel">
                <div className="cl-filter-panel__hdr">
                  <span style={{fontWeight:600,fontSize:12}}>More Filters</span>
                  {activeFilters>0 && (
                    <button className="cl-filter-clear" onClick={clearFilters}>Clear all</button>
                  )}
                </div>
                <div className="cl-filter-grid">
                  <div>
                    <label className="cl-filter-label">CSAT Rating</label>
                    <div className="cl-filter-pills">
                      {['all','5','4','3','2','1','none'].map(v=>(
                        <button key={v}
                          className={`cl-filter-pill ${csatFilter===v?'cl-filter-pill--active':''}`}
                          onClick={()=>setCsatFilter(v)}>
                          {v==='all'?'All':v==='none'?'Unrated':`${v}★`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="cl-filter-label">Agent</label>
                    <div className="cl-filter-pills">
                      {allAgents.map(a=>(
                        <button key={a}
                          className={`cl-filter-pill ${agentFilter===a?'cl-filter-pill--active':''}`}
                          onClick={()=>setAgentFilter(a)}>
                          {a==='all'?'All':a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Log list */}
            <div className="cl-list-card">
              {filtered.length===0 && (
                <div className="cl-empty">
                  <MessageSquare size={28}/>
                  <h3>No sessions found</h3>
                  <p>Adjust search or filters</p>
                </div>
              )}
              {filtered.map(l=>(
                <div key={l.id}
                  className={`cl-log-row ${selected===l.id?'active':''}`}
                  onClick={()=>setSelected(l.id===selected?null:l.id)}>
                  <div className="cl-log-avatar">{initials(l.user)}</div>
                  <div className="cl-log-info">
                    <div className="cl-log-top">
                      <span className="cl-log-name">{l.user}</span>
                      <StatusBadge s={l.status}/>
                    </div>
                    <div className="cl-log-sub">
                      <span>{l.intent}</span>
                      <span>{l.msgs} msgs</span>
                      <span>{l.duration}</span>
                      <Stars n={l.csat}/>
                    </div>
                  </div>
                  <div className="cl-log-meta">
                    <div className="cl-log-date">{l.date}</div>
                    <div className="cl-log-agent">{l.agent}</div>
                  </div>
                  <ChevronRight size={14} color="#9ca3af"/>
                </div>
              ))}
            </div>

            {/* Result count */}
            <div className="cl-result-count">
              Showing {filtered.length} of {LOGS.length} sessions
            </div>
          </div>

          {/* ── Detail panel ── */}
          {sel && (
            <div className="cl-detail-panel">
              <button className="cl-back-btn" onClick={()=>setSelected(null)}>
                <ChevronLeft size={15}/> Back to logs
              </button>

              <div className="cl-detail-card">
                <div className="cl-detail-header">
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span className="cl-detail-name">{sel.user}</span>
                      <StatusBadge s={sel.status}/>
                    </div>
                    <div className="cl-detail-email">{sel.email} · Session {sel.id}</div>
                  </div>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <button className="cl-btn-ghost cl-copy-btn" title="Copy transcript" onClick={copyTranscript}>
                      {copied ? <Check size={14} color="#16a34a"/> : <Copy size={14}/>}
                    </button>
                    <button className="cl-btn-ghost" onClick={()=>setSelected(null)}><X size={15}/></button>
                  </div>
                </div>

                <div className="cl-detail-meta">
                  {[
                    { label:'Intent',   val:sel.intent   },
                    { label:'Agent',    val:sel.agent    },
                    { label:'Duration', val:sel.duration },
                    { label:'Messages', val:`${sel.msgs} messages` },
                    { label:'Date',     val:sel.date     },
                    { label:'CSAT',     val:<Stars n={sel.csat} size="lg"/> },
                  ].map((m,i)=>(
                    <div key={i}>
                      <div className="cl-meta-label">{m.label}</div>
                      <div className="cl-meta-val">{m.val}</div>
                    </div>
                  ))}
                </div>

                {/* CSAT stars clickable (rate / re-rate) */}
                {(sel.status==='resolved'||sel.status==='escalated') && (
                  <div className="cl-csat-rate">
                    <span style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em'}}>
                      {sel.csat?'Re-rate CSAT':'Rate this session'}
                    </span>
                    <div style={{display:'flex',gap:4}}>
                      {[1,2,3,4,5].map(n=>(
                        <button key={n} className={`cl-star-btn ${sel.csat>=n?'cl-star-btn--on':''}`}
                          onClick={()=>{
                            /* mutate in-place for demo */
                            const idx = LOGS.findIndex(l=>l.id===sel.id);
                            if(idx>-1){ LOGS[idx]={...LOGS[idx],csat:n}; setSelected(sel.id+'_'); setTimeout(()=>setSelected(sel.id),0); }
                            showToast(`CSAT rated ${n}/5`,'success');
                          }}>★</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="cl-transcript-title">
                  Transcript
                  <span style={{fontWeight:400,color:'#9ca3af',marginLeft:6}}>{sel.messages.length} messages</span>
                </div>

                <div className="cl-messages">
                  {sel.messages.map((m,i)=>(
                    <div key={i} className={`cl-msg ${m.role}`}>
                      <div className={`cl-msg-icon ${m.role}`}>
                        {m.role==='user'  && <User size={12} color="#fff"/>}
                        {m.role==='bot'   && <Bot  size={12} color="#6b7280"/>}
                        {m.role==='agent' && <User size={12} color="#fff"/>}
                      </div>
                      <div className={`cl-msg-bubble ${m.role}`}>
                        {m.role==='agent' && <div className="cl-agent-label">Agent</div>}
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Export this session */}
                <button className="cl-export-session" onClick={()=>{
                  const text = `Session: ${sel.id}\nUser: ${sel.user}\nEmail: ${sel.email}\nAgent: ${sel.agent}\nIntent: ${sel.intent}\nDate: ${sel.date}\nDuration: ${sel.duration}\nCSAT: ${sel.csat??'Unrated'}\n\n--- TRANSCRIPT ---\n`
                    + sel.messages.map(m=>`[${m.role.toUpperCase()}] ${m.text}`).join('\n');
                  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([text],{type:'text/plain'})),download:`session_${sel.id}.txt`});
                  a.click(); URL.revokeObjectURL(a.href);
                  showToast(`Session ${sel.id} exported`);
                }}>
                  <Download size={12}/> Download session transcript
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}