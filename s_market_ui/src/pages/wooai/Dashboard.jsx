import React, { useState, useCallback, useEffect } from 'react';
import {
  MessageSquare, CheckCircle, Phone, Clock,
  TrendingUp, TrendingDown, Users, AlertCircle, RefreshCw,
  X, Eye, Filter, ChevronRight, ChevronLeft
} from 'lucide-react';
import { 
  getWooAIAnalyticsToday,
  getWooAIAnalyticsWeek,
  getWooAIAnalyticsMonth,
  getWooAIResolutionRate,
  getWooAIPendingCallbacks,
  getWooAIAverageResponseTime,
  getWooAIActiveAgents,
  getWooAIEscalations,
  getWooAITopIntents,
  getWooAIChatSession,
  getWooAISessions
} from '@/api/api';
import './Dashboard.css';

/* ── Data per tab ── */
const TAB_DATA = {
  today: {
    stats: [],
    perf: [],
    intents: [],
  },
  week: {
    stats: [],
    perf: [],
    intents: [],
  },
  month: {
    stats: [],
    perf: [],
    intents: [],
  },
};

const ACTIVITY_BASE = [
  { dot: '#16a34a', msg: 'Bot config updated — auto-reply enabled',   time: '08:30 · Admin'  },
  { dot: '#6d28d9', msg: 'New policy added — Bot Escalation Rules',   time: '09:10 · Admin'  },
  { dot: '#d97706', msg: 'Callback assigned to Sneha R. (#8820)',     time: '10:25 · System' },
  { dot: '#dc2626', msg: '5 chats escalated — peak hour alert',       time: '11:00 · System' },
  { dot: '#2563eb', msg: 'Quick action "Artisan Picks" created',      time: '12:15 · Admin'  },
];

const PREVIEW_COUNT = 6;

const statusBadge = s => {
  const map = { resolved:'green', escalated:'red', pending:'amber' };
  return <span className={`db-badge ${map[s]||'gray'}`}>{s}</span>;
};

const initials = name => name.split(' ').map(w=>w[0]).join('');

/* ── Toast ── */
const Toast = ({ msg, onDone }) => {
  React.useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, []);
  return (
    <div className="db-toast">✓ {msg}</div>
  );
};

/* ── Stat card ── */
const Stat = ({ icon: Icon, label, val, change, dir, color }) => (
  <div className={`db-stat ${color}`}>
    <div className="db-stat-icon"><Icon size={15}/></div>
    <div className="db-stat-val">{val}</div>
    <div className="db-stat-label">{label}</div>
    {change && (
      <div className={`db-stat-change ${dir}`}>
        {dir==='up' ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
        {change}
      </div>
    )}
  </div>
);

/* ── Chat detail modal ── */
const ChatModal = ({ chat, onClose }) => (
  <div className="db-overlay" onClick={onClose}>
    <div className="db-modal" onClick={e=>e.stopPropagation()}>
      <div className="db-modal__hdr">
        <div>
          <div className="db-modal__title">{chat.id}</div>
          <div className="db-modal__sub">{chat.intent}</div>
        </div>
        <button className="db-modal__close" onClick={onClose}><X size={15}/></button>
      </div>
      <div className="db-modal__body">
        {[
          {l:'User',   v:chat.user},
          {l:'Agent',  v:chat.agent},
          {l:'Status', v:chat.status},
          {l:'Intent', v:chat.intent},
          {l:'Time',   v:chat.time},
        ].map((r,i)=>(
          <div key={i} className="db-modal__row">
            <span className="db-modal__lbl">{r.l}</span>
            {r.l==='Status' ? statusBadge(r.v) : <span className="db-modal__val">{r.v}</span>}
          </div>
        ))}
        <div className="db-modal__transcript">
          <div className="db-modal__t-lbl">Session Transcript (simulated)</div>
          <div className="db-bubble db-bubble--bot">Hi! How can I help you today?</div>
          <div className="db-bubble db-bubble--user">{chat.intent === 'Order Tracking' ? 'Where is my order #ORD-44210?' : `I need help with ${chat.intent.toLowerCase()}.`}</div>
          <div className="db-bubble db-bubble--bot">{chat.status==='escalated' ? "I'm transferring you to a human agent now." : "I've resolved your query. Is there anything else?"}</div>
          {chat.status==='resolved' && <div className="db-bubble db-bubble--user">No, thanks!</div>}
        </div>
      </div>
    </div>
  </div>
);

/* ── View-all modal ── */
const ViewAllModal = ({ chats, onClose }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = statusFilter==='all' ? chats : chats.filter(c=>c.status===statusFilter);
  return (
    <div className="db-overlay" onClick={onClose}>
      <div className="db-modal db-modal--wide" onClick={e=>e.stopPropagation()}>
        <div className="db-modal__hdr">
          <div>
            <div className="db-modal__title">All Chat Sessions</div>
            <div className="db-modal__sub">{chats.length} sessions</div>
          </div>
          <button className="db-modal__close" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="db-modal__filters">
          {['all','resolved','escalated','pending'].map(f=>(
            <button key={f} className={`db-modal__filter ${statusFilter===f?'db-modal__filter--active':''}`}
              onClick={()=>setStatusFilter(f)}>
              {f[0].toUpperCase()+f.slice(1)}
              <span className="db-modal__filter-count">
                {f==='all'?chats.length:chats.filter(c=>c.status===f).length}
              </span>
            </button>
          ))}
        </div>
        <div className="db-modal__body db-modal__body--scroll">
          <table className="db-table" style={{minWidth:500}}>
            <thead>
              <tr>
                <th>ID</th><th>User</th><th>Intent</th><th>Status</th><th>Agent</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c=>(
                <tr key={c.id}>
                  <td style={{color:'#6d28d9',fontWeight:600,fontSize:11}}>{c.id}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      <div className="db-avatar">{initials(c.user)}</div>
                      <span style={{fontSize:13,fontWeight:500}}>{c.user}</span>
                    </div>
                  </td>
                  <td style={{fontSize:12,color:'#6b7280'}}>{c.intent}</td>
                  <td>{statusBadge(c.status)}</td>
                  <td style={{fontSize:12}}>{c.agent}</td>
                  <td style={{fontSize:11,color:'#9ca3af'}}>{c.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [activeTab,    setActiveTab]    = useState('today');
  const [spinning,     setSpinning]     = useState(false);
  const [toast,        setToast]        = useState(null);
  const [chatModal,    setChatModal]    = useState(null);
  const [viewAll,      setViewAll]      = useState(false);
  const [activity,     setActivity]     = useState(ACTIVITY_BASE);
  const [data, setData] = useState(TAB_DATA['today']);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  
  // Fetch data based on active tab
  useEffect(() => {
    fetchDashboardData();
    fetchSessions();
  }, [activeTab]);
  
  const fetchSessions = async () => {
    try {
      const res = await getWooAISessions(12);
      setSessions(Array.isArray(res) ? res : []);
    } catch {
      setSessions([]);
    }
  };
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let stats = [];
      let perf = [];
      let intents = [];
      
      switch (activeTab) {
        case 'today':
          const [todayStats, todayPerf, todayIntents] = await Promise.all([
            fetchTodayStats(),
            fetchTodayPerf(),
            fetchTodayIntents()
          ]);
          stats = todayStats;
          perf = todayPerf;
          intents = todayIntents;
          break;
        case 'week':
          const [weekStats, weekPerf, weekIntents] = await Promise.all([
            fetchWeekStats(),
            fetchWeekPerf(),
            fetchWeekIntents()
          ]);
          stats = weekStats;
          perf = weekPerf;
          intents = weekIntents;
          break;
        case 'month':
          const [monthStats, monthPerf, monthIntents] = await Promise.all([
            fetchMonthStats(),
            fetchMonthPerf(),
            fetchMonthIntents()
          ]);
          stats = monthStats;
          perf = monthPerf;
          intents = monthIntents;
          break;
      }
      
      setData({ stats, perf, intents });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setToast('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTodayStats = async () => {
    const [totalChatsRes, aiResolvedRes, pendingCallbacksRes, avgResponseRes, activeAgentsRes, escalationsRes] = await Promise.all([
      getWooAIAnalyticsToday(),
      getWooAIResolutionRate(),
      getWooAIPendingCallbacks(),
      getWooAIAverageResponseTime(),
      getWooAIActiveAgents(),
      getWooAIEscalations()
    ]);
    
    return [
      { icon: MessageSquare, label: 'Total Chats',       val: totalChatsRes.count.toLocaleString(), change: '12% vs yesterday', dir: 'up',   color: ''      },
      { icon: CheckCircle,   label: 'AI Resolved',       val: `${aiResolvedRes.rate}%`,   change: '3% this week',     dir: 'up',   color: 'green' },
      { icon: Phone,         label: 'Pending Callbacks', val: pendingCallbacksRes.count,    change: '5 urgent',          dir: 'down', color: 'red'   },
      { icon: Clock,         label: 'Avg Response',      val: `${avgResponseRes.time}s`,  change: 'Optimised',         dir: 'up',   color: 'blue'  },
      { icon: Users,         label: 'Active Agents',     val: activeAgentsRes.count,     change: '1 away',            dir: 'down', color: 'amber' },
      { icon: AlertCircle,   label: 'Escalations',       val: escalationsRes.count,    change: '7% of total',       dir: 'down', color: ''      },
    ];
  };
  
  const fetchTodayPerf = async () => {
    // For simplicity, using static values for performance metrics
    // In a real implementation, these would come from dedicated endpoints
    return [
      { label: 'CSAT Score',         val: '4.7/5', color: '#16a34a' },
      { label: 'First Contact Res.', val: '78%',   color: '#6d28d9' },
      { label: 'Containment Rate',   val: '89%',   color: '#2563eb' },
      { label: 'Fallback Rate',      val: '11%',   color: '#d97706' },
    ];
  };
  
  const fetchTodayIntents = async () => {
    const intentsRes = await getWooAITopIntents();
    // Assuming the API returns an array of [label, count] pairs
    const total = intentsRes.intents.reduce((sum, intent) => sum + intent[1], 0);
    return intentsRes.intents.map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / total) * 100)
    }));
  };
  
  const fetchWeekStats = async () => {
    const [totalChatsRes, aiResolvedRes, pendingCallbacksRes, avgResponseRes, activeAgentsRes, escalationsRes] = await Promise.all([
      getWooAIAnalyticsWeek(),
      getWooAIResolutionRate(),
      getWooAIPendingCallbacks(),
      getWooAIAverageResponseTime(),
      getWooAIActiveAgents(),
      getWooAIEscalations()
    ]);
    
    return [
      { icon: MessageSquare, label: 'Total Chats',       val: totalChatsRes.count.toLocaleString(),  change: '8% vs last week',  dir: 'up',   color: ''      },
      { icon: CheckCircle,   label: 'AI Resolved',       val: `${aiResolvedRes.rate}%`,    change: '1% vs last week',  dir: 'up',   color: 'green' },
      { icon: Phone,         label: 'Pending Callbacks', val: pendingCallbacksRes.count,     change: '12 urgent',         dir: 'down', color: 'red'   },
      { icon: Clock,         label: 'Avg Response',      val: `${avgResponseRes.time}s`,   change: 'Stable',            dir: 'up',   color: 'blue'  },
      { icon: Users,         label: 'Active Agents',     val: activeAgentsRes.count,      change: 'Full capacity',     dir: 'up',   color: 'amber' },
      { icon: AlertCircle,   label: 'Escalations',       val: escalationsRes.count,    change: '9% of total',       dir: 'down', color: ''      },
    ];
  };
  
  const fetchWeekPerf = async () => {
    return [
      { label: 'CSAT Score',         val: '4.6/5', color: '#16a34a' },
      { label: 'First Contact Res.', val: '75%',   color: '#6d28d9' },
      { label: 'Containment Rate',   val: '87%',   color: '#2563eb' },
      { label: 'Fallback Rate',      val: '13%',   color: '#d97706' },
    ];
  };
  
  const fetchWeekIntents = async () => {
    const intentsRes = await getWooAITopIntents();
    const total = intentsRes.intents.reduce((sum, intent) => sum + intent[1], 0);
    return intentsRes.intents.map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / total) * 100)
    }));
  };
  
  const fetchMonthStats = async () => {
    const [totalChatsRes, aiResolvedRes, pendingCallbacksRes, avgResponseRes, activeAgentsRes, escalationsRes] = await Promise.all([
      getWooAIAnalyticsMonth(),
      getWooAIResolutionRate(),
      getWooAIPendingCallbacks(),
      getWooAIAverageResponseTime(),
      getWooAIActiveAgents(),
      getWooAIEscalations()
    ]);
    
    return [
      { icon: MessageSquare, label: 'Total Chats',       val: totalChatsRes.count.toLocaleString(), change: '15% vs last month', dir: 'up',   color: ''      },
      { icon: CheckCircle,   label: 'AI Resolved',       val: `${aiResolvedRes.rate}%`,   change: '4% improvement',    dir: 'up',   color: 'green' },
      { icon: Phone,         label: 'Pending Callbacks', val: pendingCallbacksRes.count,   change: '28 urgent',          dir: 'down', color: 'red'   },
      { icon: Clock,         label: 'Avg Response',      val: `${avgResponseRes.time}s`,  change: 'Best this quarter',  dir: 'up',   color: 'blue'  },
      { icon: Users,         label: 'Active Agents',     val: activeAgentsRes.count,     change: '2 new hires',        dir: 'up',   color: 'amber' },
      { icon: AlertCircle,   label: 'Escalations',       val: escalationsRes.count,   change: '6% of total',        dir: 'up',   color: ''      },
    ];
  };
  
  const fetchMonthPerf = async () => {
    return [
      { label: 'CSAT Score',         val: '4.8/5', color: '#16a34a' },
      { label: 'First Contact Res.', val: '81%',   color: '#6d28d9' },
      { label: 'Containment Rate',   val: '91%',   color: '#2563eb' },
      { label: 'Fallback Rate',      val: '9%',    color: '#d97706' },
    ];
  };
  
  const fetchMonthIntents = async () => {
    const intentsRes = await getWooAITopIntents();
    const total = intentsRes.intents.reduce((sum, intent) => sum + intent[1], 0);
    return intentsRes.intents.map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / total) * 100)
    }));
  };
  
  /* ── Refresh ── */
  const handleRefresh = useCallback(() => {
    setSpinning(true);
    setTimeout(() => {
      fetchDashboardData();
      fetchSessions();
      setSpinning(false);
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      setActivity(prev => [
        { dot:'#16a34a', msg:`Dashboard refreshed — data up to date`, time:`${hhmm} · System` },
        ...prev.slice(0,4),
      ]);
      setToast('Data refreshed');
    }, 900);
  }, [activeTab]);

  /* ── Tab change ── */
  const handleTab = (t) => {
    setActiveTab(t);
    setToast(`Showing ${t} data`);
  };

  /* ── Row click → chat detail ── */
  const handleRowClick = (chat) => setChatModal(chat);

  const formatChat = (s) => ({
    id: s.sessionId || `#${s.id}`,
    user: s.userName || 'Unknown',
    intent: s.intent || 'General',
    status: s.status ? s.status.toLowerCase() : 'pending',
    time: s.startTime ? new Date(s.startTime).toLocaleString() : '',
    agent: s.agent || 'AI Bot'
  });

  const displayedChats = (sessions.length > 0 ? sessions : []).slice(0, PREVIEW_COUNT).map(formatChat);
  const allChats = sessions.map(formatChat);

  return (
    <div className="db-page">
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      {chatModal && <ChatModal chat={chatModal} onClose={()=>setChatModal(null)}/>}
      {viewAll   && <ViewAllModal chats={allChats} onClose={()=>setViewAll(false)}/>}

      {/* Header */}
      <div className="db-header">
        <div className="db-header-row">
          <div>
            <h1>WooAI Dashboard</h1>
            <p>Real-time overview of your AI chat operations</p>
          </div>
          <div className="db-header-controls">
            <div className="db-tabs">
              {['today','week','month'].map(t=>(
                <button key={t} className={`db-tab ${activeTab===t?'active':''}`} onClick={()=>handleTab(t)}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
            <button className={`db-refresh-btn ${spinning?'db-refresh-btn--spin':''}`} onClick={handleRefresh} disabled={spinning}>
              <RefreshCw size={13} className={spinning?'db-spin':undefined}/> {spinning?'Refreshing…':'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="db-body">

        {/* Stat strip */}
        <div className="db-stats">
          {data.stats.map((s,i)=><Stat key={i} {...s}/>)}
        </div>

        {/* Row 1 */}
        <div className="db-grid-2">

          {/* Recent sessions */}
          <div className="db-card">
            <div className="db-card-header">
              <span className="db-card-title" style={{margin:0}}>Recent Chat Sessions</span>
              <button className="db-ghost-btn" onClick={()=>setViewAll(true)}>View all →</button>
            </div>

            {/* Desktop table — rows clickable */}
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr><th>ID</th><th>User</th><th>Intent</th><th>Status</th><th>Agent</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {displayedChats.map(c=>(
                    <tr key={c.id} style={{cursor:'pointer'}} onClick={()=>handleRowClick(c)}>
                      <td style={{color:'#6d28d9',fontWeight:600,fontSize:11}}>{c.id}</td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:7}}>
                          <div className="db-avatar">{initials(c.user)}</div>
                          <span style={{fontSize:13,fontWeight:500}}>{c.user}</span>
                        </div>
                      </td>
                      <td style={{fontSize:12,color:'#6b7280'}}>{c.intent}</td>
                      <td>{statusBadge(c.status)}</td>
                      <td style={{fontSize:12}}>{c.agent}</td>
                      <td style={{fontSize:11,color:'#9ca3af'}}>{c.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile chat cards — also clickable */}
            <div className="db-chat-cards">
              {displayedChats.map(c=>(
                <div key={c.id} className="db-chat-card" style={{cursor:'pointer'}} onClick={()=>handleRowClick(c)}>
                  <div className="db-avatar">{initials(c.user)}</div>
                  <div className="db-chat-card-info">
                    <div className="db-chat-card-top">
                      <span className="db-chat-card-name">{c.user}</span>
                      <span className="db-chat-card-id">{c.id}</span>
                    </div>
                    <div className="db-chat-card-meta">{c.intent} · {c.agent}</div>
                  </div>
                  <div className="db-chat-card-right">
                    {statusBadge(c.status)}
                    <span className="db-chat-card-time">{c.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intent breakdown */}
          <div className="db-card">
            <div className="db-card-title">Top Chat Intents</div>
            {data.intents.map((it,i)=>(
              <div key={i} className="db-intent-row">
                <div className="db-intent-meta">
                  <span className="db-intent-label">{it.label}</span>
                  <span>
                    <span className="db-intent-count">{it.count.toLocaleString()}</span>
                    <span className="db-intent-pct"> ({it.pct}%)</span>
                  </span>
                </div>
                <div className="db-bar-bg">
                  <div className="db-bar-fill" style={{width:`${it.pct*3}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 */}
        <div className="db-grid-2">

          {/* Bot performance */}
          <div className="db-card">
            <div className="db-card-title">Bot Performance</div>
            <div className="db-perf-grid">
              {data.perf.map((m,i)=>(
                <div key={i} className="db-perf-item">
                  <div className="db-perf-label">{m.label}</div>
                  <div className="db-perf-val" style={{color:m.color}}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity log — updates on refresh */}
          <div className="db-card">
            <div className="db-card-title">System Activity</div>
            {activity.map((a,i)=>(
              <div key={i} className="db-activity-row">
                <div className="db-activity-dot" style={{background:a.dot}}/>
                <div>
                  <div className="db-activity-msg">{a.msg}</div>
                  <div className="db-activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}